---
title: pandas GroupBy Merge and Reshape
id: concept.pandas.groupby-merge-reshape
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
- groupby merge pivot pandas
tags:
- pandas/core
- data/aggregation
---

# pandas GroupBy, Merge and Reshape

## GroupBy: split–apply–combine

```python
summary = (
    transactions
    .groupby("user_id", as_index=False)
    .agg(
        transaction_count=("transaction_id", "count"),
        amount_sum=("amount", "sum"),
        amount_mean=("amount", "mean"),
        last_time=("event_time", "max"),
    )
)
```

Сначала данные делятся по ключу, затем к каждой группе применяется функция, результаты объединяются.

### `count` и `size`

- `size` считает строки;
- `count` считает непустые значения конкретной колонки.

Это важно при пропусках.

## `agg` и `transform`

`agg` уменьшает число строк до числа групп. `transform` возвращает результат исходной длины:

```python
transactions["user_amount_mean"] = (
    transactions.groupby("user_id")["amount"].transform("mean")
)
```

Используйте `transform`, когда групповой признак нужен для каждой исходной строки.

## Merge

```python
result = users.merge(
    summary,
    on="user_id",
    how="left",
    validate="one_to_one",
)
```

`how`:

- `left` сохраняет все строки левой таблицы;
- `inner` оставляет только совпадения;
- `outer` сохраняет оба множества;
- `right` симметричен left.

`validate` защищает от неожиданного размножения строк:

- `one_to_one`;
- `one_to_many`;
- `many_to_one`;
- `many_to_many`.

## Диагностика join

```python
result = left.merge(right, on="key", how="outer", indicator=True)
result["_merge"].value_counts()
```

До join проверьте уникальность ключей и ожидаемое число строк. После join сравните:

- row count;
- уникальные ключи;
- долю unmatched;
- пропуски новых колонок.

## Опасность many-to-many

Если ключ повторяется с обеих сторон, число строк умножается. Иногда это правильно, но часто означает неверный grain.

```text
2 строки ключа A слева × 3 строки A справа = 6 строк
```

## `concat`

```python
all_months = pd.concat(frames, ignore_index=True)
```

`concat` складывает таблицы по оси, не ищет бизнес-ключи. Колонки выравниваются по именам.

## Pivot и melt

Wide format:

```python
pivot = frame.pivot_table(
    index="user_id",
    columns="event_type",
    values="amount",
    aggfunc="sum",
    fill_value=0,
)
```

Long format:

```python
long = wide.melt(
    id_vars=["user_id"],
    var_name="metric",
    value_name="value",
)
```

Seaborn и многие статистические операции удобнее работают с tidy/long data.

## Cumulative и rolling признаки

```python
frame = frame.sort_values(["user_id", "event_time"])
frame["previous_count"] = frame.groupby("user_id").cumcount()
frame["previous_amount"] = frame.groupby("user_id")["amount"].cumsum() - frame["amount"]
```

В ML нельзя включать текущую или будущую информацию, если prediction строится до события. `shift` часто нужен для удаления текущего значения.

## Частые ошибки

- не определить grain до groupby;
- использовать `count`, ожидая число строк;
- join без `validate`;
- many-to-many explosion;
- потерять строки из-за `inner`;
- вычислить агрегат по будущим событиям;
- забыть сортировку перед cumulative/rolling;
- использовать pivot с неуникальной парой без `pivot_table`.

## Связи

- [[pandas Time Series and Window Functions]] — временные окна.
- [[Validation Splits and Data Leakage]] — aggregation cutoff.
- [[Universal_Pandas_Data_Work_Pipeline]] — практический шаблон.
