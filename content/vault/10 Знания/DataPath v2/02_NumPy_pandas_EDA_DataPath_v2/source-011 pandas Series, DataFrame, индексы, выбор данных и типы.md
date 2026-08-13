---
title: "pandas: Series, DataFrame, индексы, выбор данных и типы"
id: concept.datapath-v2.011
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 11
canonical_course: "NumPy / pandas / EDA"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# pandas: Series, DataFrame, индексы, выбор данных и типы

pandas добавляет к массивам имена столбцов, index, разнородные типы и автоматическое выравнивание по меткам. Это делает анализ удобнее, но означает, что DataFrame нельзя мыслить как обычную матрицу NumPy.

## Series и DataFrame

`Series` — values + index + name. `DataFrame` — набор Series с общим row index. Колонки могут иметь разные dtypes.

## `loc` и `iloc`

`loc` выбирает по labels, `iloc` — по позициям. Если index числовой, эти два способа особенно легко перепутать.

## Alignment

При арифметике Series/DataFrame pandas выравнивает значения по index/column labels. Две Series с одинаковыми значениями, но разным порядком индексов складываются по именам, а не по позициям.

## Типы и nullable dtypes

`object` часто означает строки или смешанные Python-объекты и требует внимания. Nullable `Int64`, `boolean`, `string` позволяют хранить пропуски без принудительного перехода к обычному float/object.

## Безопасное присваивание

Избегайте chained assignment вида `df[df.age>18]["flag"]=1`; используйте `df.loc[mask, "flag"] = 1`. Так intent и semantics assignment ясны.

## Быстрый аудит

`info`, `value_counts(dropna=False)`, `nunique`, `isna().mean()` и выбор реальных примеров дают гораздо больше информации, чем механический `describe()`.

## Практический код

```python
import pandas as pd

df = pd.DataFrame({
    "client_id": [1, 2, 3],
    "age": [20, 31, None],
    "city": ["Moscow", "Kazan", "Moscow"],
})

mask = (df["age"] >= 18) & (df["city"] == "Moscow")
adult_moscow = df.loc[mask, ["client_id", "age"]]

df["age"] = df["age"].astype("Int64")
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- путать label и position
- игнорировать автоматическое alignment
- доверять `object` dtype
- использовать chained assignment
- сбрасывать index, не понимая, что он кодировал

## Проверка понимания

1. Series из чего состоит?
2. `loc` vs `iloc`?
3. Что такое alignment?
4. Почему `object` подозрителен?
5. Что даёт nullable `Int64`?
6. Почему `.loc` предпочтительнее chained assignment?

## Мини-практика

Постройте audit-таблицу для CSV: column, dtype, missing%, nunique, три примера. Отдельно проверьте уникальность предполагаемого `client_id`.

## Что нужно унести

pandas — label-aware table model. Index alignment и heterogeneous dtypes — сила библиотеки и одновременно источник скрытых ошибок.

## Куда дальше

Следующий шаг — очистка реальных данных: пропуски, типы, duplicates и outliers.
