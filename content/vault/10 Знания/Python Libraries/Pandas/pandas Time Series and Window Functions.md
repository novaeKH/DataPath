---
title: pandas Time Series and Window Functions
id: concept.pandas.time-series-windows
type: concept
area: pandas
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- pandas datetime rolling
tags:
- pandas/time
- data/temporal
---

# pandas Time Series and Window Functions

## Даты как тип, а не строка

```python
frame["event_time"] = pd.to_datetime(frame["event_time"], utc=True, errors="coerce")
```

Строка сортируется лексикографически и не поддерживает временную арифметику. После преобразования проверьте долю `NaT`.

## Извлечение признаков

```python
frame["year"] = frame["event_time"].dt.year
frame["month"] = frame["event_time"].dt.month
frame["weekday"] = frame["event_time"].dt.dayofweek
frame["hour"] = frame["event_time"].dt.hour
```

Признак должен быть доступен на момент prediction. День недели известен, а «число покупок в следующие 30 дней» — leakage.

## Временной индекс и resample

```python
daily = (
    frame.set_index("event_time")
    .resample("D")["amount"]
    .sum()
)
```

`resample` группирует по календарным интервалам. Уточняйте timezone, границы и обработку пустых периодов.

## Rolling window

```python
series.rolling(window=7, min_periods=1).mean()
```

Для time-based окна:

```python
frame = frame.sort_values("event_time").set_index("event_time")
frame["amount_7d"] = frame["amount"].rolling("7D").sum()
```

## Grouped rolling

```python
frame = frame.sort_values(["user_id", "event_time"])
rolling = (
    frame.set_index("event_time")
    .groupby("user_id")["amount"]
    .rolling("30D")
    .sum()
)
```

Проверяйте индекс результата и возвращайте его к исходным строкам осознанно.

## `shift`, `diff`, `pct_change`

```python
frame["previous_amount"] = frame.groupby("user_id")["amount"].shift(1)
frame["days_since_previous"] = (
    frame.groupby("user_id")["event_time"].diff().dt.total_seconds() / 86400
)
```

`shift(1)` критичен, когда текущая строка не должна участвовать в признаке.

## Expanding и exponentially weighted

```python
series.expanding().mean()
series.ewm(alpha=0.2, adjust=False).mean()
```

Expanding использует всю историю, EWM сильнее взвешивает недавние значения.

## Cutoff и leakage

Для каждой prediction row признаки должны использовать события с `event_time <= cutoff`. Самый безопасный путь — явно хранить cutoff и тестировать, что maximum source time не превышает его.

## Cyclical encoding

Час `23` близок к `0`, поэтому иногда используют:

```python
angle = 2 * np.pi * frame["hour"] / 24
frame["hour_sin"] = np.sin(angle)
frame["hour_cos"] = np.cos(angle)
```

Это полезно для linear/distance models, но не обязательно для trees.

## Частые ошибки

- строки вместо datetime;
- timezone-naive и timezone-aware значения вместе;
- rolling без сортировки;
- включить текущую строку в «исторический» признак;
- использовать future aggregation;
- потерять строки из-за index alignment;
- интерпретировать календарный месяц как фиксированные 30 дней.

## Связи

- [[EDA Relationships Time and Groups]] — диагностика temporal patterns.
- [[Validation Splits and Data Leakage]] — time split.
- [[Data Preprocessing and Feature Engineering]] — temporal features.
