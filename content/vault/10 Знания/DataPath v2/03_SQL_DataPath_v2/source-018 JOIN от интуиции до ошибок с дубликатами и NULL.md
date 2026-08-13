---
title: "JOIN от интуиции до ошибок с дубликатами и NULL"
id: concept.datapath-v2.018
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 18
canonical_course: "SQL"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# JOIN от интуиции до ошибок с дубликатами и NULL

JOIN — не «приклеить столбцы», а построить комбинации строк, удовлетворяющие условию соединения. Если ключ повторяется по обе стороны, результат размножается.

## INNER и LEFT JOIN

`INNER JOIN` оставляет только совпавшие строки. `LEFT JOIN` сохраняет все строки левой таблицы и ставит NULL для отсутствующих совпадений.

## Cardinality

Нужно назвать relation: one-to-one, one-to-many, many-to-one, many-to-many. Клиенты→заказы обычно one-to-many. Если после JOIN нужна одна строка на клиента, заказы обычно агрегируют до клиента до соединения.

## Почему появляются дубликаты

Если ключ встречается 3 раза слева и 4 справа, SQL создаёт до 12 комбинаций для этого ключа. Это нормальная relational semantics.

## NULL после LEFT JOIN

`WHERE right.col = ...` после LEFT JOIN может удалить unmatched строки и фактически превратить нужную часть запроса в inner-like behavior. Иногда condition нужно помещать в `ON`.

## Self join и anti-join

Self join соединяет таблицу с собой. Для поиска отсутствий используются patterns `LEFT JOIN ... WHERE right.id IS NULL` или `NOT EXISTS`.

## Практический код

```sql
SELECT
    c.customer_id,
    c.city,
    o.order_count,
    o.revenue
FROM customers c
LEFT JOIN (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(amount) AS revenue
    FROM orders
    GROUP BY customer_id
) o
ON c.customer_id = o.customer_id;
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- не проверять уникальность ключей
- делать raw customer-to-orders JOIN и удивляться росту строк
- фильтровать правую таблицу в WHERE после LEFT JOIN и терять unmatched
- соединять по неполному composite key
- лечить дубликаты `DISTINCT` вместо поиска причины

## Проверка понимания

1. INNER vs LEFT?
2. Почему 3×4 даёт 12?
3. Когда aggregate before join?
4. Как WHERE по right table влияет на LEFT JOIN?
5. Почему DISTINCT может скрыть баг?

## Мини-практика

Есть `customers`, `orders`, `payments`. Нужна одна строка на клиента с суммой оплат. Опишите правильную последовательность агрегирования/соединения и ожидаемую cardinality каждого шага.

## Что нужно унести

JOIN корректен только при ясных ключах и cardinality. Рост строк — не баг SQL, а следствие связи данных.

## Куда дальше

Следующий урок — CTE и подзапросы: как строить сложный запрос слоями, сохраняя читаемую гранулярность.
