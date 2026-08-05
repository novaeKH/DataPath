---
title: Data Preprocessing and Feature Engineering
id: concept.ml.preprocessing-feature-engineering
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
aliases:
- Предобработка данных
- Feature engineering
tags:
- ml/preprocessing
- ml/features
math_depth: 1
---

# Data Preprocessing and Feature Engineering

## Зачем нужен preprocessing

Estimator получает численную representation. Сырые таблицы содержат пропуски, категории, даты, текст, разные units и ошибки. Preprocessing переводит их в стабильные features и является частью модели.

## Главное правило

Все обучаемые transformations fit только на train:

- imputation statistics;
- scaler;
- category vocabulary;
- target encoding;
- feature selection;
- PCA;
- text vocabulary.

Лучший способ — sklearn Pipeline/ColumnTransformer.

## Numerical features

Операции:

- median/constant imputation;
- missing indicator;
- scaling;
- log transform для positive long tail;
- clipping при domain bounds;
- robust transform;
- interactions;
- bins, если есть смысл.

Trees обычно не требуют scaling, linear/distance/SVM требуют чаще.

## Categorical features

- OneHotEncoder для low/moderate cardinality;
- ordinal encoding только при реальном порядке;
- hashing для large vocabulary;
- leakage-safe target statistics;
- native CatBoost/LightGBM handling.

Unknown category в production должна обрабатываться явно.

## Date and time

Извлекают:

- hour/day/week/month;
- time since previous event;
- age at cutoff;
- historical windows;
- cyclical sin/cos;
- season/holiday only if available.

Нельзя использовать future events или age, вычисленный после prediction.

## Aggregations

Для entity:

- count;
- sum/mean/median;
- recency;
- frequency;
- trend;
- diversity;
- rolling window.

Каждый агрегат обязан иметь cutoff. Для row at time $t$ используются только события раньше/до $t$ согласно contract.

## Feature selection

Причины удалить feature:

- leakage;
- недоступность production;
- почти полный missing;
- duplicate;
- unstable source;
- extreme cost/latency;
- noise по CV;
- privacy/policy.

Не удаляйте только по низкой univariate correlation: nonlinear model может использовать feature.

## ColumnTransformer пример

```python
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

numeric = Pipeline([
    ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
    ("scale", StandardScaler()),
])

categorical = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("num", numeric, numeric_features),
    ("cat", categorical, categorical_features),
])
```

## Train-serving consistency

Одинаковые rules должны работать offline и online. Сохраняйте fitted transformer вместе с model. Не переписывайте feature logic отдельно в notebook и service.

## Визуализация

Компонент `preprocessing-pipeline-builder`:

- columns разных типов;
- drag/select transformer;
- показ fit только на train;
- unknown category;
- resulting feature matrix shape;
- leakage warning при fit-before-split.

## Частые ошибки

- preprocessing до split;
- OHE категорий с тысячами values без контроля;
- integer codes как order;
- future aggregation;
- duplicating feature logic;
- `handle_unknown` не настроен;
- сравнение models с разным split/preprocessing;
- feature selection по test.

## Связи

- [[Categorical Features]]
- [[From EDA to ML Pipeline]]
- [[Validation Splits and Data Leakage]]
- [[pandas GroupBy Merge and Reshape]]
