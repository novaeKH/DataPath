---
title: From EDA to ML Pipeline
id: concept.eda.to-ml-pipeline
type: concept
area: eda
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
aliases:
- От EDA к ML pipeline
tags:
- eda/pipeline
- ml/pipeline
---

# From EDA to ML Pipeline

## Проблема notebook-only решений

Во время EDA легко вручную заполнить пропуски, удалить outlier и построить признаки. Если эти шаги не оформлены как deterministic pipeline, их невозможно одинаково применить к validation и production.

## Что должно выйти из EDA

1. Prediction contract.
2. Data dictionary и grain.
3. Split strategy.
4. Список допустимых features.
5. Rules обработки missing/invalid values.
6. Feature transformations.
7. Baseline.
8. Metrics и threshold policy.
9. Data quality checks.
10. Monitoring risks.

## От ручного шага к функции

Исследовательский код:

```python
frame["income"] = frame["income"].fillna(frame["income"].median())
```

Production-safe решение: median fit только на train внутри transformer.

```python
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("model", model),
])
```

## ColumnTransformer

```python
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric_features),
    ("categorical", categorical_pipeline, categorical_features),
])
```

Список features и transformer становятся частью одного fit-able объекта.

## Контракты до модели

Проверки, которые не зависят от train statistics, выполняются до pipeline:

- обязательные колонки;
- типы;
- диапазоны;
- уникальность;
- cutoff;
- schema version.

## Feature availability

Для каждого feature храните:

- source;
- timestamp;
- aggregation window;
- update frequency;
- default;
- owner;
- known failure modes.

Это снижает риск train-serving skew.

## Baseline first

Сначала простой baseline:

- constant/mean;
- logistic/linear regression;
- shallow tree;
- popularity;
- last value.

Сложная модель имеет смысл только после честного сравнения.

## Error analysis loop

```text
baseline → ошибки → сегменты → гипотеза → новый feature/model
→ validation → решение
```

Не добавляйте feature только потому, что он красиво коррелирует на всей выборке.

## Артефакты

Сохраняйте вместе:

- fitted pipeline;
- feature list;
- config;
- metric report;
- threshold;
- training data/version;
- code commit;
- schema contract.

## Связи

- [[Data Preprocessing and Feature Engineering]] — transformers и признаки.
- [[Validation Splits and Data Leakage]] — честная схема.
- [[Universal_Regression_Pipeline]] — практический pipeline.
- [[sklearn End-to-End Classification — Practice]] — runnable пример.
