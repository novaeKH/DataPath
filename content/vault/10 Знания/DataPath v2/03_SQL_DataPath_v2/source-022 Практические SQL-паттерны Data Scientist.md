---
title: "Практические SQL-паттерны Data Scientist"
id: concept.datapath-v2.022
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 22
canonical_course: "SQL"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Практические SQL-паттерны Data Scientist

Собеседование и реальная аналитика редко спрашивают «что делает SELECT». Они дают задачу: найти retention, latest record, top-N per group, funnel или cohort. Эти задачи состоят из уже изученных primitives.

## Latest record per entity

`ROW_NUMBER() OVER (PARTITION BY entity ORDER BY time DESC)` → оставить `rn=1`. Главное — deterministic tie-breaker, если timestamps могут совпадать.

## Top-N per group

Rank/window внутри category, затем filter `rank <= N`. Global `LIMIT N` не решает top-N для каждой группы.

## Dedup

Сначала определить, что считать duplicate. Затем rank records по приоритету/updated_at и оставить один. `DISTINCT` без rule не выбирает правильную запись.

## Retention

Определите cohort start (например, месяц первой покупки), затем activity period и вычислите долю cohort, активную через N periods. Нужны distinct users, иначе много событий одного пользователя исказят retention.

## Cohorts

Cohort table обычно строится как `user → first_period`, затем join/activity periods, затем difference in periods, затем group counts.

## Funnels

Для этапов signup→view→purchase важно определить ordering и time window. Просто наличие всех событий без порядка может завысить conversion.

## Intervals and sessionization

Через `LAG(timestamp)` можно вычислить gap; новый session начинается, если gap > threshold. Затем cumulative sum flag формирует session_id.

## Практический код

Соберём паттерны в одну задачу: для каждого клиента получить последнюю покупку, выручку за 30 дней и ранг внутри региона. Сначала CTE очищает исходные события и ограничивает временной интервал. Затем отдельная агрегация считает выручку на уровне клиента. `ROW_NUMBER` с сортировкой по времени выбирает последнюю покупку, после чего результаты соединяются по уникальному `customer_id`. Только в финале рассчитывается региональный ранг.

Такой порядок устраняет типичную ошибку: если сначала соединить детальные покупки с другой таблицей «многие ко многим», а затем агрегировать, сумма может умножиться. Безопаснее заранее привести каждый источник к требуемой гранулярности и проверять уникальность ключа перед соединением.

Для интервью и реальной работы важен не только финальный запрос, но и объяснение. Назовите единицу строки на каждом этапе, причину выбора `LEFT` или `INNER JOIN`, способ обработки `NULL` и правило разрешения одинаковых временных меток. Затем проверьте крайние случаи: клиент без покупок, две покупки в одну секунду, новый регион и границу временного окна.

SQL становится надёжным, когда запрос можно читать как цепочку проверяемых таблиц. Оптимизацию стоит начинать после проверки смысла: посмотреть план выполнения, уменьшить объём ранним фильтром и убедиться, что ключи соединения поддерживаются подходящими индексами.

```sql
WITH first_order AS (
    SELECT
        customer_id,
        MIN(order_date) AS first_date
    FROM orders
    GROUP BY customer_id
),
activity AS (
    SELECT DISTINCT
        o.customer_id,
        DATE_TRUNC('month', f.first_date) AS cohort_month,
        DATE_TRUNC('month', o.order_date) AS activity_month
    FROM orders o
    JOIN first_order f USING (customer_id)
)
SELECT
    cohort_month,
    activity_month,
    COUNT(DISTINCT customer_id) AS active_users
FROM activity
GROUP BY cohort_month, activity_month
ORDER BY cohort_month, activity_month;
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- делать top-N через global LIMIT
- retention считать по событиям вместо уникальных пользователей
- funnel без порядка событий
- dedup через DISTINCT без business rule
- не определять time window funnel/cohort
- не учитывать repeated entities

## Проверка понимания

1. Как выбрать latest row?
2. Top-N per group?
3. Почему retention считает distinct users?
4. Что такое cohort start?
5. Почему funnel требует порядка?
6. Как LAG помогает sessionization?

## Мини-практика

Решите на Olist-подобной схеме: cohort по месяцу первого заказа, retention на следующий месяц и top-3 категории по выручке внутри каждого месяца. Сначала опишите гранулярность каждого CTE.

## Что нужно унести

Сильный SQL — это комбинация небольшого набора идей: правильная гранулярность, GROUP BY, JOIN, windows, temporal ordering и явные business rules.

## Куда дальше

Следующий блок — математика: векторы, матрицы, производные и градиенты как язык ML-моделей.
