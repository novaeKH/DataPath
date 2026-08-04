---
type: source
area: sql
status: active
tags: [sql, interview, olist]
aliases:
  - SQL для собеседований
title: "SQL for Interviews"
rag: exclude
id: source.sql.sql-for-interviews
schema_version: 2
language: ru
app: exclude
---
# SQL for Interviews

Быстрое повторение: [[SQL — Interview]]

## 1. Логический порядок

```text
FROM / JOIN
→ WHERE
→ GROUP BY
→ HAVING
→ SELECT
→ DISTINCT
→ ORDER BY
→ LIMIT
```

Поэтому alias из `SELECT` обычно нельзя использовать в `WHERE`.

## 2. NULL

`NULL` — неизвестно, а не ноль/пустая строка. Сравнение через `IS NULL`. Трёхзначная логика даёт `TRUE/FALSE/UNKNOWN`.

- `COUNT(*)` считает строки;
- `COUNT(column)` игнорирует NULL;
- `COALESCE` подставляет первое non-null.

## 3. GROUP BY и HAVING

`WHERE` фильтрует строки до aggregation. `HAVING` — группы после.

Нужно заранее назвать grain результата: одна строка на заказ, клиента, месяц?

## 4. JOIN и размножение строк

`INNER` оставляет совпадения. `LEFT` сохраняет все строки слева.

Если ключ справа не уникален, строка слева размножится. Many-to-many умножает комбинации. В Olist нельзя наивно соединять `items × payments`: обе таблицы many для заказа. Сначала агрегировать каждую до `order_id`.

## 5. DISTINCT

Удаляет дубли результата, но не исправляет неверный JOIN. Если после `DISTINCT` цифра «стала правильной», нужно сначала доказать grain.

## 6. CASE WHEN

Условная логика и conditional aggregation:

```sql
SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)
```

## 7. CTE и subquery

CTE делает этапы читаемыми. Он не гарантирует материализацию; это решает optimizer. Временная таблица полезна при повторном использовании, индексации или отладке большого промежуточного результата.

## 8. Window functions

Окно считает значение, не схлопывая строки:

```sql
SUM(revenue) OVER (
  PARTITION BY customer_id
  ORDER BY month
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
```

- `PARTITION BY` — независимые группы;
- `ORDER BY` — порядок внутри;
- frame — какие строки окна участвуют.

## 9. ROW_NUMBER, RANK, DENSE_RANK

- `ROW_NUMBER`: уникальный номер.
- `RANK`: равные места, затем пропуск.
- `DENSE_RANK`: равные места без пропуска.

Последняя полная запись:

```sql
ROW_NUMBER() OVER (
  PARTITION BY customer_id
  ORDER BY event_time DESC
)
```

затем `WHERE rn = 1`.

## 10. LAG и LEAD

Доступ к предыдущей/следующей строке по оконному порядку. Используются для изменения к прошлому периоду, интервалов, retention и последовательностей.

## 11. Top-N per group

Сначала посчитать metric на нужном grain, затем rank внутри группы, затем filter:

```sql
WITH category_revenue AS (...),
ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY state
           ORDER BY revenue DESC
         ) AS rn
  FROM category_revenue
)
SELECT * FROM ranked WHERE rn <= 3;
```

## 12. Практический контроль

После JOIN:

- число строк;
- число уникальных ключей;
- суммы до/после;
- unmatched keys;
- ожидаемая cardinality.

## Связи

- [[SQL — Interview|Быстрое повторение]]
- [[02 Вопросы — SQL]]
- [[Universal_Pandas_Data_Work_Pipeline#21. Мост между pandas и SQL]]
