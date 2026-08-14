---
title: "Временные данные, rolling и оконные вычисления"
id: concept.datapath-v2.014
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 14
canonical_course: "NumPy / pandas / EDA"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Временные данные, rolling и оконные вычисления

Время задаёт причинный порядок. Любой temporal feature должен отвечать на вопрос: какая информация была известна в момент предсказания?

## Datetime и timezone

Преобразуйте timestamps через `pd.to_datetime`; определите UTC/local policy. Naive и timezone-aware datetimes нельзя смешивать бездумно.

## Lag через `shift`

После сортировки по entity/time `groupby(...).shift(1)` даёт предыдущую запись. `shift(-1)` переносит future назад и как feature обычно leakage.

## Rolling window

`rolling(7)` означает 7 observations; `rolling("7D")` — временной интервал при соответствующем datetime setup. Это разные задачи.

## Include current?

Если prediction совершается до outcome текущего события, current value нельзя включать в historical statistic. Часто pattern: `shift(1)` → `rolling(...)`.

## Resample и seasonality

`resample` переводит irregular events в fixed intervals. Calendar/cyclic features (`sin/cos` часа/дня недели) помогают моделировать периодичность.

## Time validation

Temporal features требуют time split, если production generalizes into future. Random split может смешать regimes и повторные сущности.

## Практический код

Рассмотрим ежедневную выручку магазина. Сначала строковые даты преобразуются в `datetime`, затем данные сортируются по магазину и времени. Сортировка — часть корректности: `shift(1)` означает «предыдущая строка в текущем порядке», а не автоматически «предыдущий день».

`rolling(7).mean()` по семи строкам и окно `rolling("7D")` отвечают на разные вопросы. Первое берёт семь наблюдений, даже если между ними есть пропущенные дни. Второе использует календарный интервал и требует временного индекса. Выбор зависит от смысла данных: семь последних продаж и семь календарных дней — не одно и то же.

Для прогноза на день `t` признаки должны быть известны до момента прогноза. Среднее, включающее сам день `t`, подглядывает в текущий target. Безопасный шаблон — сначала `shift(1)`, затем rolling: вчерашняя и более ранняя история образуют признак, а текущая выручка остаётся целевой переменной.

После построения признаков полезно вручную проверить несколько строк на границах: начало ряда, смену клиента или магазина, пропуск даты. Если ожидается одна строка в день, сначала приводят ряд к этой частоте и осознанно решают, чем являются отсутствующие даты — нулём, пропуском измерения или отсутствием события.

```python
df = df.sort_values(["client_id", "timestamp"])

df["prev_amount"] = (
    df.groupby("client_id")["amount"]
      .shift(1)
)

df["weekday"] = df["timestamp"].dt.dayofweek
df["hour"] = df["timestamp"].dt.hour
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- делать shift до сортировки
- путать 7 rows и 7 days
- использовать future shift как feature
- включать текущий outcome в historical window
- игнорировать timezone
- random split временной задачи без проверки

## Проверка понимания

1. Зачем сортировать?
2. Что даёт `shift(1)`?
3. 7 observations vs 7 days?
4. Когда текущую строку надо исключать?
5. Почему time split естественен?
6. Зачем cyclic encoding?

## Мини-практика

Определите leakage-safe `count_7d`, `sum_30d`, `recency` для prediction на каждый snapshot клиента. Запишите, какие timestamps входят в окно и какие нет.

## Что нужно унести

Temporal feature определяется не только формулой, но и границей доступности информации. Prediction moment — часть каждой оконной функции.

## Куда дальше

Закрываем блок EDA: как превратить все эти инструменты в последовательный процесс исследования.
