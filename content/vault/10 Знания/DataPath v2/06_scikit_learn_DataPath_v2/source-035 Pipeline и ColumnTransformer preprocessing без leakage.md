---
title: "Pipeline и ColumnTransformer: preprocessing без leakage"
id: concept.datapath-v2.035
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 35
canonical_course: "scikit-learn"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Pipeline и ColumnTransformer: preprocessing без leakage

Типичный табличный dataset содержит numeric и categorical columns. Если imputer/scaler/OHE делать вручную до cross-validation, легко fit-нуть statistics на validation. `Pipeline` и `ColumnTransformer` помещают все обучаемые transformations внутрь одной CV boundary.

## Pipeline

`Pipeline` последовательно вызывает `fit/transform` промежуточных steps и `fit` final estimator. На `predict` preprocessing автоматически повторяется теми же fitted objects.

## ColumnTransformer

Разные columns требуют разных transformations: numeric `impute→scale`, categorical `impute→OneHotEncoder`. `ColumnTransformer` применяет ветви параллельно и объединяет features.

## Leakage barrier

При cross-validation sklearn clone-ит Pipeline для каждого fold. Imputer/scaler/encoder fit-ятся только на training part fold. Validation проходит только через transform. Это главный методологический benefit.

## Unknown categories

`OneHotEncoder(handle_unknown="ignore")` позволяет inference с unseen category, не падая. Но quality может ухудшиться, поэтому production стоит мониторить unknown rate.

## Remainder and feature selection

`remainder="drop"`/`"passthrough"` определяет судьбу unspecified columns. Лучше явно контролировать schema, чем случайно протаскивать ID/target-like fields.

## Custom transformers

Если feature engineering зависит от train statistics, он должен быть sklearn-compatible transformer или иным образом fit-иться внутри fold. Pure row-wise deterministic features могут быть вычислены до split, если не используют future/target/distribution, но единый pipeline часто всё равно удобнее.

## Pipeline params

Nested hyperparameters задаются через `step__param`, например `model__C`, `prep__num__imputer__strategy`. Это позволяет model selection без разрыва pipeline.

## Практический код

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression

num_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

cat_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("ohe", OneHotEncoder(handle_unknown="ignore")),
])

prep = ColumnTransformer([
    ("num", num_pipe, numeric_cols),
    ("cat", cat_pipe, categorical_cols),
])

pipe = Pipeline([
    ("prep", prep),
    ("model", LogisticRegression(max_iter=1000)),
])

pipe.fit(X_train, y_train)
proba = pipe.predict_proba(X_valid)[:, 1]
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- делать `pd.get_dummies` на train+validation вместе
- масштабировать до CV
- случайно передавать target/ID через remainder
- писать отдельный production preprocessing вручную
- не обрабатывать unseen categories

## Проверка понимания

1. Что делает Pipeline?
2. Зачем ColumnTransformer?
3. Почему они уменьшают leakage?
4. Что делает `handle_unknown='ignore'`?
5. Как обратиться к nested hyperparameter?
6. Какие transformations должны fit inside fold?

## Мини-практика

Соберите Pipeline для dataset с `age, income, city, tariff`. Numeric: median+scale; categories: most-frequent+OHE; final LogisticRegression. Затем объясните, что именно fit-ится заново в каждом CV fold.

## Что нужно унести

Pipeline — не просто удобный syntax. Это executable boundary, которая связывает preprocessing и estimator в одну воспроизводимую модель и защищает validation.

## Куда дальше

Следующий урок добавит cross-validation, hyperparameter search и сохранение готового Pipeline как artifact.
