---
title: SQL Aggregations and Windows — Practice
type: practice
area: sql
status: active
aliases:
  - SQL агрегации и оконные функции
tags:
  - practice/sql
  - data/quality
rag: include
id: practice.sql.sql-aggregations-and-windows-practice
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# SQL Aggregations and Windows — Practice

## Цель

Для оплаченных заказов посчитать daily revenue пользователя и выбрать его последний оплаченный order. Query читается сверху вниз: сначала filter/typing, затем aggregation, затем window ranking.

## Схема

```sql
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL,
    amount REAL
);
```

Grain — одна строка на `order_id`.

## Прямая реализация

```sql
WITH paid_orders AS (
    SELECT
        order_id,
        user_id,
        DATE(created_at) AS order_date,
        created_at,
        amount
    FROM orders
    WHERE status = 'paid'
      AND amount IS NOT NULL
),

daily_revenue AS (
    SELECT
        user_id,
        order_date,
        SUM(amount) AS revenue,
        COUNT(*) AS paid_orders
    FROM paid_orders
    GROUP BY
        user_id,
        order_date
),

ranked_orders AS (
    SELECT
        order_id,
        user_id,
        created_at,
        amount,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY created_at DESC, order_id DESC
        ) AS recency_rank
    FROM paid_orders
)

SELECT
    d.user_id,
    d.order_date,
    d.revenue,
    d.paid_orders,
    r.order_id AS latest_paid_order_id
FROM daily_revenue AS d
LEFT JOIN ranked_orders AS r
    ON d.user_id = r.user_id
   AND r.recency_rank = 1
ORDER BY
    d.user_id,
    d.order_date;
```

## Почему этапы разделены

- `paid_orders` фиксирует population и missing policy.
- `daily_revenue` меняет grain на user-day.
- `ranked_orders` сохраняет row grain и считает order внутри user.
- final join использует one latest row per user.

Если объединить всё до определения grains, легко умножить revenue.

## Window function не уменьшает число строк

`ROW_NUMBER()` добавляет rank каждой row. Filter `recency_rank = 1` выполняется позже. В отличие от `GROUP BY`, window сохраняет исходный row grain.

Tie-breaker `order_id DESC` делает result deterministic при одинаковом timestamp.

## Проверки

```sql
-- Primary key uniqueness должна обеспечиваться schema.
SELECT
    COUNT(*) AS rows_count,
    COUNT(DISTINCT order_id) AS unique_orders
FROM orders;
```

```sql
-- Нет ли user с несколькими latest rows после ranking?
WITH ranked AS (
    SELECT
        user_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY created_at DESC, order_id DESC
        ) AS recency_rank
    FROM orders
    WHERE status = 'paid'
)
SELECT
    user_id,
    COUNT(*) AS latest_rows
FROM ranked
WHERE recency_rank = 1
GROUP BY user_id
HAVING COUNT(*) != 1;
```

Ожидаем zero rows.

## NULL semantics

- `amount IS NOT NULL`, а не `amount != NULL`.
- `SUM` игнорирует NULL, но явный filter делает policy видимой.
- `COUNT(*)` считает rows, `COUNT(amount)` — non-NULL amounts.
- `LEFT JOIN` сохраняет left rows; condition right table в `WHERE` может случайно превратить его в inner join.

## Типичные ошибки

- `SELECT *` в production analytical query;
- скрытая many-to-many join;
- отсутствие deterministic tie-breaker;
- division integer/zero без cast/`NULLIF`;
- mixing event time и ingestion time;
- window partition по неверной business entity.

## Связанные знания

- [[pandas Data Cleaning and Joins — Practice]] — те же grain/key checks в dataframe.
- [[Validation Splits and Data Leakage]] — time cutoff и feature availability.
- [[ML Metrics and Threshold Selection]] — aggregation unit меняет metric.
