---
title: SQL analytical patterns and interview tasks
id: concept.sql.analytical-patterns
schema_version: 2
type: concept
area: sql
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [sql/analytics, interview/sql]
---

# SQL analytical patterns and interview tasks

## Grain прежде синтаксиса

Перед запросом сформулируйте: одна строка результата — это что? Например, `user_id + month`. Большинство ошибок JOIN и aggregation — не синтаксис, а случайное изменение grain.

```sql
SELECT user_id, date(created_at, 'start of month') AS month,
       COUNT(*) AS orders, SUM(amount) AS revenue
FROM orders
WHERE status = 'paid'
GROUP BY user_id, date(created_at, 'start of month');
```

`WHERE` фильтрует строки до aggregation, `HAVING` — группы после неё. `COUNT(*)` считает строки, `COUNT(amount)` игнорирует NULL, `COUNT(DISTINCT user_id)` считает уникальные непустые значения.

## JOIN и cardinality

До JOIN проверьте uniqueness ключа справа. Если у пользователя пять orders, JOIN `users → orders` закономерно создаёт пять строк. Если затем суммировать user-level feature, значение умножится.

```sql
WITH order_features AS (
  SELECT user_id, COUNT(*) AS order_count, SUM(amount) AS revenue
  FROM orders
  GROUP BY user_id
)
SELECT u.user_id, COALESCE(o.order_count, 0) AS order_count
FROM users u
LEFT JOIN order_features o USING (user_id);
```

Условие на правую таблицу в `WHERE` после LEFT JOIN может превратить результат в INNER JOIN. Если условие относится к matching rows, чаще оно должно быть в `ON` или внутри правого CTE.

## CASE, dates и conditional aggregation

```sql
SELECT
  date(created_at) AS day,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_revenue,
  SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunds
FROM orders
GROUP BY date(created_at);
```

Date functions зависят от dialect. В SQLite используются `date`, `datetime`, `strftime`; в PostgreSQL — `date_trunc`, интервалы и casts. На собеседовании сначала уточните dialect и timezone.

## Window functions

Window считает значение по группе, но не схлопывает строки. `PARTITION BY` задаёт независимую группу, `ORDER BY` — порядок внутри неё.

```sql
WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY created_at DESC, order_id DESC
         ) AS rn,
         SUM(amount) OVER (
           PARTITION BY user_id
           ORDER BY created_at
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
         ) AS cumulative_revenue
  FROM orders
  WHERE status = 'paid'
)
SELECT * FROM ranked WHERE rn = 1;
```

Tie-breaker `order_id` делает ranking детерминированным. `RANK` оставляет пропуски после ties, `DENSE_RANK` — нет, `ROW_NUMBER` всегда уникален.

## Subquery и CTE

CTE не обязательно быстрее: это способ назвать этап и зафиксировать grain. Correlated subquery выполняет логическую проверку для каждой outer row; иногда optimizer перепишет её, но читаемый JOIN/CTE часто проще анализировать.

```sql
SELECT u.user_id
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.user_id AND o.status = 'paid'
);
```

`EXISTS` выражает наличие и не размножает строки outer query.

## Интервью-задача: retention

Нужно определить, вернулся ли пользователь на следующий календарный день. Сначала получаем уникальные user-day, затем self-join.

```sql
WITH active_days AS (
  SELECT DISTINCT user_id, date(event_time) AS day
  FROM events
), retention AS (
  SELECT a.day,
         COUNT(DISTINCT a.user_id) AS users,
         COUNT(DISTINCT b.user_id) AS returned_d1
  FROM active_days a
  LEFT JOIN active_days b
    ON b.user_id = a.user_id
   AND b.day = date(a.day, '+1 day')
  GROUP BY a.day
)
SELECT day, users, returned_d1,
       1.0 * returned_d1 / NULLIF(users, 0) AS d1_retention
FROM retention;
```

Умножение на `1.0` избегает integer division, `NULLIF` защищает от division by zero.

## Типичные ошибки и self-check

- `= NULL` вместо `IS NULL`;
- `SELECT *` при JOIN с одинаковыми именами;
- missing tie-breaker;
- many-to-many JOIN без осознанного grain;
- window без правильного frame;
- фильтр по event time после aggregation;
- использование будущих событий при построении ML features.

1. Почему window не заменяет GROUP BY?
2. Чем `WHERE` отличается от `HAVING`?
3. Когда нужен `EXISTS`, а не JOIN?
4. Напишите top-2 orders по amount для каждого пользователя и объясните выбор ranking function.

## Связи

До: таблицы, keys, SELECT/WHERE. После: feature tables, cohort analysis, ML leakage checks и pandas groupby/merge.
