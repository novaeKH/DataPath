---
title: "Подзапросы и CTE: как строить сложный запрос по частям"
id: concept.datapath-v2.019
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 19
canonical_course: "SQL"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Подзапросы и CTE: как строить сложный запрос по частям

Сложный аналитический SQL легче понимать как pipeline из именованных промежуточных отношений. CTE (`WITH`) позволяет дать каждому этапу имя и проверить его гранулярность.

## Подзапрос

Подзапрос может жить в FROM, WHERE/EXISTS или scalar expression. Он создаёт промежуточный relation/value для внешнего запроса.

## CTE

`WITH recent_orders AS (...)` делает этап читаемым и удобным для обсуждения. CTE не обязательно материализуется: optimizer конкретной СУБД может встроить его в план.

## Layering

Хороший pattern: `filtered → aggregated → joined → final`. Каждый CTE должен иметь понятную гранулярность и назначение.

## EXISTS

Если нужно проверить наличие связанной строки, `EXISTS` часто выражает intent лучше JOIN+DISTINCT. Он отвечает на boolean existence, не размножая результат.

## Correlated subquery

Подзапрос может ссылаться на текущую строку внешнего запроса. Современный optimizer иногда преобразует его эффективно, но логически это повторяющаяся зависимость и её нужно понимать.

## Практический код

```sql
WITH recent_orders AS (
    SELECT *
    FROM orders
    WHERE order_date >= DATE '2026-07-01'
),
customer_agg AS (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(amount) AS revenue
    FROM recent_orders
    GROUP BY customer_id
)
SELECT
    c.customer_id,
    a.order_count,
    a.revenue
FROM customers c
LEFT JOIN customer_agg a
  ON c.customer_id = a.customer_id;
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- делать один гигантский SELECT без этапов
- считать CTE гарантированно materialized
- использовать JOIN+DISTINCT для простой проверки existence
- терять гранулярность промежуточного CTE
- копировать один и тот же subquery много раз

## Проверка понимания

1. Что даёт CTE?
2. CTE всегда материализуется?
3. Когда EXISTS лучше JOIN?
4. Что такое correlated subquery?
5. Почему важно описывать гранулярность каждого CTE?

## Мини-практика

Напишите запрос из 3 CTE: заказы за 90 дней → агрегация клиента → объединение с профилем. Для каждого CTE подпишите one-row meaning.

## Что нужно унести

CTE — инструмент ясности и композиции. SQL становится надёжнее, когда каждый промежуточный слой имеет имя и определённую гранулярность.

## Куда дальше

Следующий урок — оконные функции: агрегаты, которые не схлопывают строки.
