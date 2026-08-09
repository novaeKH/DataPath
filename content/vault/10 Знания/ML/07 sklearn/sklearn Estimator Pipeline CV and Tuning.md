---
title: scikit-learn estimator API, Pipeline, CV and tuning
id: concept.sklearn.workflow
schema_version: 2
type: concept
area: sklearn
status: active
language: ru
app: source
rag: include
rag_collection: knowledge
tags: [sklearn/pipeline, sklearn/cv]
---

# scikit-learn estimator API, Pipeline, CV and tuning

## Один API для разных моделей

Estimator хранит hyperparameters и после `fit` — learned state. `fit(X, y)` оценивает параметры по train. Predictor реализует `predict`; classifier часто — `predict_proba` или `decision_function`. Transformer реализует `transform`, а `fit_transform` последовательно учит состояние и преобразует train.

```python
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

На test нельзя вызывать `fit_transform`: среднее и variance теста протекут в preprocessing. Это один из главных смыслов Pipeline.

## Split до preprocessing

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
```

`stratify` сохраняет доли классов, но не решает group/time leakage. Для клиентов с несколькими строками нужен GroupShuffleSplit/GroupKFold; для времени — cutoff или TimeSeriesSplit. Random state фиксирует воспроизводимость, а не делает split «правильным».

## ColumnTransformer и Pipeline

```python
numeric = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])
categorical = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore")),
])

preprocess = ColumnTransformer([
    ("num", numeric, ["age", "income"]),
    ("cat", categorical, ["city", "channel"]),
])

model = Pipeline([
    ("preprocess", preprocess),
    ("classifier", LogisticRegression(max_iter=1000)),
])
model.fit(X_train, y_train)
probability = model.predict_proba(X_test)[:, 1]
```

Во время `fit` каждый transformer учится только на переданном train fold. При `predict_proba` применяются сохранённые transformations, затем classifier. `[:, 1]` выбирает вероятность positive class, но сначала проверьте `model.classes_`.

## Cross-validation

K-fold обучает k моделей: каждый fold один раз validation, остальные — train. Среднее оценивает ожидаемое качество, spread показывает нестабильность. Все learned preprocessing steps должны находиться внутри Pipeline, иначе scaler/encoder увидит validation folds заранее.

```python
scores = cross_validate(
    model, X_train, y_train,
    cv=StratifiedKFold(5, shuffle=True, random_state=42),
    scoring=["roc_auc", "average_precision"],
    return_train_score=True,
)
```

Cross-validation не заменяет финальный untouched test. Test открывают после выбора модели и threshold policy.

## GridSearch и RandomizedSearch

Параметр вложенного шага задаётся через `step__parameter`.

```python
search = RandomizedSearchCV(
    model,
    param_distributions={
        "classifier__C": loguniform(1e-3, 1e2),
        "classifier__class_weight": [None, "balanced"],
    },
    n_iter=30,
    scoring="average_precision",
    cv=5,
    refit=True,
    random_state=42,
)
search.fit(X_train, y_train)
best_model = search.best_estimator_
```

Grid перебирает декартово произведение и быстро становится дорогим. RandomizedSearch лучше использует budget, особенно для непрерывных log-scale параметров. `refit=True` после выбора обучает лучший pipeline на всём переданном train.

## Metrics и threshold

`predict` применяет внутреннее правило класса, обычно threshold 0.5. Для бизнес-решения сначала получают score/probability, затем выбирают threshold на validation или out-of-fold predictions. Accuracy не подходит при редком fraud; PR-AUC и recall at constrained precision часто полезнее.

```python
precision, recall, thresholds = precision_recall_curve(y_valid, valid_probability)
eligible = np.where(precision[:-1] >= 0.8)[0]
threshold = thresholds[eligible[np.argmax(recall[:-1][eligible])]]
```

Калибровку оценивают отдельно: ROC-AUC может быть высоким при плохом соответствии probability реальной частоте.

## Model persistence

`joblib.dump(pipeline, path)` сохраняет Python object, но не является безопасным форматом для недоверенных файлов. Вместе с artifact храните версии sklearn, feature schema, training data version, metric и threshold. При загрузке выполните smoke prediction на известном input.

## Типичные ошибки

- preprocessing до split;
- `fit_transform` на test;
- выбирать metric после просмотра результата;
- tuning и reporting на одном test;
- забыть `handle_unknown="ignore"`;
- читать `predict()` как probability;
- искать threshold на train predictions;
- сохранять только classifier без preprocessing и column order.

## Self-check и mini-case

1. Почему scaler должен быть внутри Pipeline при CV?
2. Что делает `refit=True`?
3. Чем `transform` отличается от `predict`?
4. Для churn определите target, group-aware split, numeric/categorical pipeline, PR-oriented metric и threshold rule. Назовите три проверки leakage.

## Связи

До: preprocessing, models, metrics. После: experiment tracking, serialization, inference service и monitoring.
