---
title: pandas Performance and Debugging
id: concept.pandas.performance-debugging
type: concept
area: pandas
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
aliases:
- Производительность pandas
- Отладка pandas
tags:
- pandas/core
- data/performance
---

# pandas Performance and Debugging

## Зачем это нужно

pandas удобен, но наивный код легко делает то же самое в 100 раз медленнее и в десятки раз больше памяти, чем нужно. Для Data Science это не косметика: батч, который «не влезает» в память, и цикл, который работает час, — типичные причины срыва пайплайна. Понимание стоимости операций и инструментов отладки — часть работы с табличными данными.

## Правило: векторизация, а не цикл

Внутри pandas операции над колонками выполняются на нативном коде. Любой `for` по строкам почти всегда можно заменить векторной операцией:

```python
# медленно: построчный цикл
frame["ratio"] = [
    a / b if b != 0 else None
    for a, b in zip(frame["a"], frame["b"])
]

# быстро: векторно
frame["ratio"] = frame["a"].div(frame["b"]).where(frame["b"] != 0)
```

Порядок выбора: векторная операция → `.agg`/`.transform` → `apply` с нативной функцией → только в крайнем случае `iterrows`/`itertuples`. `apply` не делает код «векторным» автоматически: он остаётся Python-циклом.

## Память и dtype

По умолчанию pandas хранит числа как `int64`/`float64`. Типичные приёмы экономии памяти:

- понизить dtype: `int32`, `float32`, `uint8` для малых диапазонов;
- категории для строк с повторениями: `pd.Categorical` или `astype("category")`;
- не хранить лишние копии колонок;
- проверить реальный размер: `frame.memory_usage(deep=True)`.

```python
frame["is_active"] = frame["is_active"].astype("int8")   # bool → 1 байт
frame["city"] = frame["city"].astype("category")          # повторяющиеся строки
print(frame.memory_usage(deep=True).sum() / 1024**2, "MB")
```

`datetime64` и `timedelta64` экономят память по сравнению со строками дат.

## Merge и join: стоимость растёт с cardinality

`merge` строит хеш по ключу; many-to-many может размножить строки (row explosion). Перед join проверяйте:

- уникальность ключа в обеих таблицах: `df[key].is_unique`;
- grain: одна строка левой таблицы = сколько строк правой;
- тип ключа совпадает (int vs str создаёт «пустой» join без ошибки).

Для больших таблиц join на категориальном или приведённом к общему типу ключе быстрее, чем на строках.

## Chunking и работа с большими файлами

```python
reader = pd.read_csv("data.csv", chunksize=100_000)
total = 0.0
for chunk in reader:
    total += chunk["amount"].sum()
```

Чтение по частям позволяет обрабатывать файлы больше памяти. Для регулярных пайплайнов лучше перейти на parquet (`to_parquet`/`read_parquet`): быстрее и сохраняет dtype.

## Отладка

- `SettingWithCopyWarning` — признак работы с копией вместо оригинала: использовать `.loc[...]` или явную копию.
- неожиданный dtype: проверять `dtypes` после чтения (например, `id` стал `float64` из-за NaN).
- «тихие» ошибки: NaN, появившиеся из-за несовпадения индексов при присваивании.
- сравнение с `is`/`==` на колонках: `frame["col"] == None` — ошибка, использовать `.isna()`.
- профилировать по-настоящему: `%timeit`, `time.perf_counter`, memory profiler, а не догадки.

## Частые ошибки

- строчный цикл там, где есть векторная операция;
- `apply` с Python-функцией на большой колонке;
- чтение файла целиком, когда достаточно чанков;
- join без проверки unique и grain (row explosion);
- неявная копия и потеря изменений;
- экономия памяти ценой потери точности без проверки диапазонов;
- верить «pandas медленный» без профилирования конкретной операции.

## Связи

- [[NumPy Foundations]] — векторные операции под капотом.
- [[pandas Foundations and Selection]] — базовые операции.
- [[pandas GroupBy Merge and Reshape]] — join и агрегация.
- [[09_Память_GC_GIL]] — модель памяти Python.
- [[10_Python_для_Data_Science]] — границы Python и векторизация.
