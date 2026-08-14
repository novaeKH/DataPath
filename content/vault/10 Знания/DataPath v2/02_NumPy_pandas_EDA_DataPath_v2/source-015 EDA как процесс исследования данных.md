---
title: "EDA как процесс исследования данных"
id: concept.datapath-v2.015
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 15
canonical_course: "NumPy / pandas / EDA"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# EDA как процесс исследования данных

Разведочный анализ данных (Exploratory Data Analysis, EDA) — не галерея графиков. Его результатом должны стать решения: какой split, какие риски leakage, какие transformations и baseline нужны.

## Сначала задача и гранулярность

Зафиксируйте one-row meaning, target, prediction moment и business decision. Без этого корреляция с post-event column может выглядеть как «отличный feature».

## Audit

Размер, time range, entities, dtypes, missing, duplicates, target distribution. Сначала таблицы и реальные examples, затем plots.

## Target analysis

Classification: balance, target over time/segments. Regression: distribution, tails, zeros, impossible values. Ошибка target definition делает все последующие модели бессмысленными.

## Numeric/categorical analysis

Для numeric смотрите quantiles, shape, missing, target relation. Для category — cardinality, rare support, missing, target rates с sample count. 100% target rate на двух строках — шум, а не закономерность.

## Correlation and causality

Pearson ловит linear association, Spearman — monotonic rank relation. Ни один не доказывает causal effect. Correlation полезна для поиска redundancy и suspicious proxies.

## Time/segment stability

Количество строк, target rate, missing rate и feature quantiles по времени выявляют drift/schema changes. Segment analysis показывает, где global average скрывает проблемы.

## Выход EDA

EDA должен закончиться конкретным списком: split, primary metric, baseline, preprocessing, leakage risks, hypotheses for features. Если график не меняет понимание/решение, он может быть лишним.

## Практический код

Хороший EDA начинается не с набора графиков, а с вопроса. Для задачи оттока клиента нужно выяснить, что означает одна строка, когда измерен каждый признак и в какой момент становится известен target. Затем проверяют форму таблицы, типы, уникальность ключа, пропуски и диапазоны. Только после этого одномерные распределения и связи между признаками получают интерпретацию.

Предположим, модель показывает почти идеальную связь оттока с колонкой `closed_at`. График сам по себе не доказывает полезность признака: дата закрытия может появляться уже после факта ухода. Такой признак нужно исключить как leakage, даже если он даёт лучший score. Напротив, слабая на общем графике связь может быть важной внутри отдельного сегмента, поэтому агрегаты проверяют по времени, региону и типу клиента.

Результат EDA — не «мы посмотрели данные», а список решений и рисков: какая гранулярность принята, какие записи исключены и почему, какие преобразования войдут в pipeline, как будет устроено разбиение, какие срезы потребуют отдельной метрики. Каждое важное наблюдение должно приводить либо к проверяемой гипотезе, либо к конкретному изменению дальнейшего эксперимента.

Завершать исследование полезно коротким отчётом: факты отделены от предположений, рядом с каждым графиком записан вывод, а код можно повторно запустить на новой версии данных. Это превращает EDA в этап моделирования, а не в декоративный notebook.

```python
audit = pd.DataFrame({
    "dtype": df.dtypes.astype(str),
    "missing_pct": df.isna().mean() * 100,
    "nunique": df.nunique(dropna=False),
})

target_by_month = (
    df.groupby(df["date"].dt.to_period("M"))["target"]
      .mean()
)
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- строить все возможные графики без вопроса
- принимать correlation за causation
- не анализировать target до features
- игнорировать временную стабильность
- интерпретировать category target rate без support
- менять данные только ради красивого plot

## Проверка понимания

1. Какие четыре вопроса задать до plots?
2. Почему target first?
3. Pearson vs Spearman?
4. Что показывает support категории?
5. Как time EDA влияет на split?
6. Какой должен быть итог EDA?

## Мини-практика

Для неизвестного датасета напишите план из 12 EDA-вопросов и максимум 8 plots/tables. Для каждого укажите, какое modeling decision он способен изменить.

## Что нужно унести

EDA = постановка вопросов к данным → проверка качества/структуры → поиск leakage/stability → переход к validation и baseline. Это начало моделирования, а не отдельная декоративная фаза.

## Куда дальше

Следующий блок — SQL: получать и агрегировать аналитические данные прямо в реляционной базе.
