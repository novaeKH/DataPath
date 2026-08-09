---
title: Model Selection and Hyperparameter Tuning
id: concept.ml.model-selection-tuning
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Подбор гиперпараметров
- Model selection
tags:
- ml/validation
- ml/tuning
math_depth: 1
---

# Model Selection and Hyperparameter Tuning

## Что выбирается

Model selection включает не только estimator:

- features;
- preprocessing;
- model family;
- hyperparameters;
- early stopping;
- calibration;
- threshold;
- ensemble.

Каждое решение, принятое по validation, расходует information этого validation set.

## Search space

Задавайте диапазоны по механизму:

- log scale для learning rate, regularization;
- bounded integers для depth;
- conditional parameters для разных models;
- разумные limits по latency/memory.

Не подбирайте всё подряд без hypothesis.

## Grid и random search

Grid проверяет декартово произведение и быстро растёт. Random search эффективнее, когда важны лишь несколько dimensions.

Bayesian optimization использует прошлые trials, но не исправляет noisy validation и неверный split.

## Nested CV

Outer folds оценивают selection procedure, inner folds выбирают hyperparameters. Полезно на малых данных, но дорого.

## Early stopping

Iteration count является hyperparameter. Нужен validation fold внутри training process. После выбора можно refit согласно определённой policy, не используя test.

## Multiple comparisons

Из сотен trials лучший score частично является noise. Поэтому:

- смотрите fold spread;
- повторяйте top candidates;
- предпочитайте simpler stable region;
- храните все trials;
- используйте untouched test.

## Практический порядок

1. Простой baseline.
2. Проверить data/split.
3. Выбрать metric.
4. Несколько model families с defaults.
5. Тюнинг 3–6 важных parameters.
6. Error analysis.
7. Calibration/threshold.
8. Final test.

## Визуализация

Компонент `hyperparameter-search-landscape`:

- 2D objective surface;
- grid vs random points;
- noisy validation;
- best trial selection bias;
- outer test estimate.

## Частые ошибки

- test в search loop;
- preprocessing вне CV;
- огромный grid;
- выбирать по одному lucky fold;
- tuning до baseline/data audit;
- скрывать failed trials;
- оптимизировать metric, не связанную с action.

## Связи

- [[Validation Splits and Data Leakage]]
- [[Regularization]]
- [[Ensemble Comparison]]

## Код: search без preprocessing leakage

```python
from scipy.stats import loguniform
from sklearn.model_selection import RandomizedSearchCV

search = RandomizedSearchCV(
    pipeline,
    {"classifier__C": loguniform(1e-3, 1e2)},
    n_iter=30,
    scoring="average_precision",
    cv=5,
    refit=True,
    random_state=42,
)
search.fit(X_train, y_train)
```

Pipeline включает preprocessing: каждый fold обучает его заново. Test не
участвует ни в выборе параметров, ни в выборе метрики.
