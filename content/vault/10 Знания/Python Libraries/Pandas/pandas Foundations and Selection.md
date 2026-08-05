---
title: pandas Foundations and Selection
id: concept.pandas.foundations-selection
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
- Основы pandas
- DataFrame и Series
tags:
- pandas/core
- data/tabular
---

# pandas Foundations and Selection

## Зачем pandas

pandas предназначен для табличных данных с именованными колонками и индексом. `Series` — одномерный массив с индексом, `DataFrame` — набор выровненных Series. pandas удобен для очистки, объединения, агрегации и временных данных, но не заменяет понимание ключей и grain таблицы.

## Создание и чтение

```python
import pandas as pd

frame = pd.DataFrame({
    "user_id": [1, 2, 3],
    "age": [20, 35, 29],
    "target": [0, 1, 0],
})

frame = pd.read_csv("data.csv")
frame = pd.read_parquet("data.parquet")
```

После чтения всегда проверьте:

```python
frame.shape
frame.head()
frame.info()
frame.dtypes
frame.isna().mean().sort_values(ascending=False)
frame.duplicated().sum()
```

## Grain и ключ

До кода сформулируйте: одна строка — это кто или что? Пользователь, заказ, событие, товар-день? Ключ должен соответствовать grain.

```python
frame["order_id"].is_unique
```

Неуникальный ключ может быть нормой для событий, но критической ошибкой для таблицы заказов.

## Выбор колонок

```python
ages = frame["age"]                 # Series
subset = frame[["user_id", "age"]]  # DataFrame
```

Используйте список колонок, когда важно сохранить двумерную форму.

## `loc` и `iloc`

`loc` работает по labels:

```python
frame.loc[frame["age"] >= 18, ["user_id", "age"]]
```

`iloc` — по позициям:

```python
frame.iloc[:10, :3]
```

Не смешивайте смысл индекса и номер строки.

## Фильтрация

```python
mask = (
    frame["age"].between(18, 65)
    & frame["country"].isin(["RU", "SE"])
    & frame["email"].notna()
)
filtered = frame.loc[mask].copy()
```

Каждое условие заключайте в скобки. `and/or` не работают поэлементно для Series; нужны `&` и `|`.

## Сортировка

```python
frame.sort_values(["user_id", "event_time"], inplace=False)
```

Сортировка не меняет индекс автоматически. Для чистого последовательного индекса:

```python
frame = frame.sort_values("event_time").reset_index(drop=True)
```

## Создание колонок

```python
frame = frame.assign(
    income_per_person=lambda df: df["income"] / df["family_size"].clip(lower=1),
    is_adult=lambda df: df["age"] >= 18,
)
```

Прямое присваивание тоже нормально:

```python
frame["log_income"] = np.log1p(frame["income"])
```

Избегайте длинных цепочек, если отладка становится сложнее.

## `SettingWithCopy`

Проблема возникает, когда непонятно, изменяется view или независимый объект.

Плохо:

```python
frame[frame["age"] > 18]["segment"] = "adult"
```

Правильно:

```python
frame.loc[frame["age"] > 18, "segment"] = "adult"
```

Или создайте явную копию subset.

## `apply` и векторизация

`apply(axis=1)` выполняет Python-функцию для каждой строки и часто медленен. Сначала ищите:

- арифметику Series;
- `.str`;
- `.dt`;
- `.map`;
- `np.where`/`np.select`;
- `groupby.transform`.

`apply` остаётся допустимым для сложной логики на небольших данных, но должен быть осознанным.

## Index

Index используется для alignment. Это мощно, но может удивлять:

```python
s1 + s2  # значения складываются по index labels
```

Перед арифметикой убедитесь, что alignment желателен. Для обычной таблицы часто проще держать бизнес-ключ в колонке и использовать стандартный RangeIndex.

## Частые ошибки

- не определить grain;
- путать Series и DataFrame;
- фильтровать через `and`;
- chained assignment;
- случайный alignment по индексам;
- читать весь CSV, когда нужны три колонки;
- использовать `apply(axis=1)` для простой арифметики;
- превращать даты в строки ради сортировки.

## Связи

- [[pandas Cleaning and Data Types]] — пропуски и dtype.
- [[pandas GroupBy Merge and Reshape]] — агрегации и объединения.
- [[Exploratory Data Analysis Workflow]] — системная проверка таблицы.
