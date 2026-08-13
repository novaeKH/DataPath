---
title: "NULL, CASE, даты и строки в аналитическом SQL"
id: concept.datapath-v2.021
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 21
canonical_course: "SQL"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# NULL, CASE, даты и строки в аналитическом SQL

SQL использует трёхзначную логику: TRUE, FALSE и UNKNOWN. `NULL` — не обычное значение и не равен самому себе через `=`. Это объясняет множество неожиданных фильтров.

## NULL

Используйте `IS NULL` / `IS NOT NULL`. `COUNT(column)` не считает NULL. Arithmetic with NULL обычно даёт NULL, поэтому применяют `COALESCE` только когда replacement соответствует семантике.

## CASE

`CASE WHEN ... THEN ... ELSE ... END` создаёт категорию/условную метрику. Порядок WHEN важен: используется первая совпавшая ветка.

## COALESCE/NULLIF

`COALESCE(a,b,c)` возвращает первое non-NULL. `NULLIF(x,0)` полезен, например, чтобы избежать division by zero: `a / NULLIF(b,0)`.

## Даты

Для timestamps предпочитайте полуинтервалы: `ts >= start AND ts < end`. Извлечение month/day/functions зависит от dialect, поэтому концепцию отделяйте от конкретного синтаксиса.

## Строки

`LIKE`, lower/trim, concatenation и regexp dialect-specific. Нормализация текста/категорий в SQL должна быть такой же осознанной, как в pandas.

## Практический код

```sql
SELECT
    customer_id,
    CASE
        WHEN amount >= 10000 THEN 'high'
        WHEN amount >= 1000 THEN 'medium'
        ELSE 'low'
    END AS amount_band,
    COALESCE(discount, 0) AS discount
FROM orders
WHERE cancelled_at IS NULL
  AND created_at >= TIMESTAMP '2026-08-01 00:00:00'
  AND created_at <  TIMESTAMP '2026-09-01 00:00:00';
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- писать `col = NULL`
- заменять every NULL на 0
- забывать ELSE в CASE и получать NULL
- использовать `<= 23:59:59` для конца дня
- не учитывать dialect differences

## Проверка понимания

1. Почему `= NULL` неверно?
2. Что делает COALESCE?
3. Зачем NULLIF?
4. Почему порядок CASE WHEN важен?
5. Почему timestamp half-open interval удобен?

## Мини-практика

Создайте SQL, который безопасно считает `revenue/orders_count`, группирует клиентов по spend bands и сохраняет NULL там, где отсутствие значения действительно неизвестно.

## Что нужно унести

NULL — отдельная логика отсутствия, CASE — механизм явной бизнес-логики, а корректная работа со временем требует точных границ.

## Куда дальше

Финал SQL-блока — набор практических аналитических паттернов: retention, cohorts, funnels, top-N и dedup.
