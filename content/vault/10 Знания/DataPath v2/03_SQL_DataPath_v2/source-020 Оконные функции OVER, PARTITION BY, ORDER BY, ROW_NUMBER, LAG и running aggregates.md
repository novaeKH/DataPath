---
title: "Оконные функции: OVER, PARTITION BY, ORDER BY, ROW_NUMBER, LAG и running aggregates"
id: concept.datapath-v2.020
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 20
canonical_course: "SQL"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Оконные функции: OVER, PARTITION BY, ORDER BY, ROW_NUMBER, LAG и running aggregates

Window functions позволяют вычислять статистику по группе, сохраняя каждую исходную строку. Это SQL-аналог идеи `groupby().transform()` плюс мощная работа с порядком.

## OVER

Оконная функция использует `OVER(...)`. `PARTITION BY` задаёт независимые группы, `ORDER BY` — порядок внутри окна. В отличие от GROUP BY, строки не схлопываются.

## ROW_NUMBER/RANK/DENSE_RANK

`ROW_NUMBER` всегда выдаёт уникальные номера. `RANK` оставляет пропуски после ties, `DENSE_RANK` — нет. Выбор зависит от business semantics top-N.

## LAG/LEAD

`LAG(value)` берёт предыдущее значение в ordering; `LEAD` — следующее. Для temporal feature `LEAD` может быть future leakage, если используется как predictor.

## Running aggregates

`SUM(amount) OVER (PARTITION BY customer ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` строит cumulative sum. Window frame (`ROWS`/`RANGE`) влияет на semantics и требует внимания при одинаковых timestamps.

## Latest record

Pattern `ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) = 1` — стандартный способ выбрать последнюю запись на сущность через CTE/subquery.

## Практический код

```sql
WITH ranked AS (
    SELECT
        customer_id,
        order_id,
        order_date,
        amount,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id
            ORDER BY order_date DESC
        ) AS rn,
        LAG(amount) OVER (
            PARTITION BY customer_id
            ORDER BY order_date
        ) AS prev_amount
    FROM orders
)
SELECT *
FROM ranked
WHERE rn = 1;
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- путать GROUP BY и window
- использовать ROW_NUMBER без deterministic ORDER BY
- не понимать ties у RANK
- использовать LEAD как current feature
- игнорировать window frame

## Проверка понимания

1. Почему window сохраняет строки?
2. PARTITION BY role?
3. ROW_NUMBER vs RANK vs DENSE_RANK?
4. LAG vs LEAD?
5. Что такое frame?
6. Как выбрать latest row per client?

## Мини-практика

Для заказов выведите каждую строку с: номером заказа клиента, предыдущей суммой, cumulative spend и rank заказа по сумме внутри клиента.

## Что нужно унести

Window functions = аналитика по группе без потери row-level granularity. Это один из самых важных SQL-инструментов DS.

## Куда дальше

Дальше — NULL, CASE, даты и строки: повседневные детали, на которых ломаются правильные запросы.
