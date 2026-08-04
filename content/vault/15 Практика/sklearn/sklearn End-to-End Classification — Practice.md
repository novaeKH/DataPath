---
title: sklearn End-to-End Classification — Practice
type: practice
area: ml
status: active
aliases:
  - sklearn классификация end-to-end
tags:
  - practice/sklearn
  - ml/classification
rag: include
id: practice.ml.sklearn-end-to-end-classification-practice
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# sklearn End-to-End Classification — Practice

## Цель

Построить leakage-safe binary baseline: split, fold-safe preprocessing, Logistic Regression, probability metrics и validation threshold. Код остаётся небольшим и runnable.

## Полная прямая реализация

```python
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.datasets import make_classification
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    log_loss,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


RANDOM_STATE = 42

numeric_data, target = make_classification(
    n_samples=800,
    n_features=4,
    n_informative=3,
    n_redundant=0,
    weights=[0.75, 0.25],
    random_state=RANDOM_STATE,
)

features = pd.DataFrame(
    numeric_data,
    columns=["age_signal", "income_signal", "activity", "tenure"],
)

features["channel"] = np.where(
    features["activity"] > 0,
    "mobile",
    "web",
)

X_train, X_valid, y_train, y_valid = train_test_split(
    features,
    target,
    test_size=0.25,
    stratify=target,
    random_state=RANDOM_STATE,
)

numeric_features = [
    "age_signal",
    "income_signal",
    "activity",
    "tenure",
]
categorical_features = ["channel"]

numeric_pipeline = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ]
)

categorical_pipeline = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        (
            "one_hot",
            OneHotEncoder(handle_unknown="ignore"),
        ),
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        ("numeric", numeric_pipeline, numeric_features),
        ("categorical", categorical_pipeline, categorical_features),
    ]
)

model = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                random_state=RANDOM_STATE,
            ),
        ),
    ]
)

model.fit(X_train, y_train)

valid_probability = model.predict_proba(X_valid)[:, 1]

print(
    "PR-AUC:",
    round(average_precision_score(y_valid, valid_probability), 3),
)
print(
    "LogLoss:",
    round(log_loss(y_valid, valid_probability), 3),
)
```

Preprocessor fit происходит только внутри `model.fit(X_train, y_train)`. Validation statistics не участвуют.

## Threshold по constraint

Найдём самый высокий recall среди thresholds с precision не ниже $0.60$.

```python
from sklearn.metrics import precision_recall_curve


precision, recall, thresholds = precision_recall_curve(
    y_valid,
    valid_probability,
)

selected_threshold = None
selected_recall = -1.0

for index, threshold in enumerate(thresholds):
    current_precision = precision[index]
    current_recall = recall[index]

    if current_precision < 0.60:
        continue

    if current_recall > selected_recall:
        selected_threshold = float(threshold)
        selected_recall = float(current_recall)

if selected_threshold is None:
    raise ValueError(
        "No threshold satisfies precision >= 0.60"
    )

valid_prediction = (
    valid_probability >= selected_threshold
).astype(int)

print("Threshold:", round(selected_threshold, 3))
print(classification_report(y_valid, valid_prediction))
```

Threshold выбирается на validation и затем фиксируется. Для final test нельзя подбирать его заново.

## Проверки и инварианты

```python
assert len(valid_probability) == len(y_valid)
assert np.isfinite(valid_probability).all()
assert ((valid_probability >= 0) & (valid_probability <= 1)).all()
assert X_train.index.intersection(X_valid.index).empty
assert 0.0 <= selected_threshold <= 1.0
```

## Что добавить в реальном проекте

1. group/time-aware split вместо random, если требует data-generating process;
2. cross-validation и out-of-fold predictions;
3. baseline constant/previous model;
4. calibration curve;
5. segment and drift checks;
6. untouched final test;
7. serialization вместе с schema/version.

## Типичные ошибки

- fit scaler/OHE на полном dataset;
- threshold по test;
- `class_weight` считать заменой metric/cost analysis;
- использовать accuracy при rare positive;
- feature engineering после просмотра validation без учёта selection;
- сохранять classifier отдельно от preprocessor.

## Связанные знания

- [[Logistic Regression]] — Bernoulli, likelihood и LogLoss.
- [[Validation Splits and Data Leakage]] — выбор split и fold-local preprocessing.
- [[ML Metrics and Threshold Selection]] — PR-AUC, calibration и threshold.
- [[Regularization]] — scaling и penalty.
