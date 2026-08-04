---
title: Validation Splits and Data Leakage
type: concept
area: ml
status: active
aliases:
  - Валидация и утечки данных
  - Cross-validation
tags:
  - ml/validation
  - ml/leakage
math_depth: 1
id: concept.ml.validation-splits-and-data-leakage
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Validation Splits and Data Leakage

## Идея за 30 секунд

Validation имитирует будущую эксплуатацию: кто будет новым объектом, когда строится prediction и какие данные доступны в этот момент. Train оценивает parameters, validation выбирает решения, test один раз оценивает уже зафиксированный pipeline. Split определяется data-generating process, а не удобным random default.

## Роли train, validation и test

- **Train**: fit parameters и preprocessing statistics.
- **Validation**: выбрать features, model family, hyperparameters, threshold, calibration и early stopping.
- **Test**: финальная unbiased-as-possible оценка одного выбранного pipeline.

Если test смотрели несколько раз и меняли решение, он стал validation. Нужен новый untouched test или честное описание selection bias.

## Сначала определить prediction contract

Перед split:

1. unit одного observation;
2. target и prediction horizon;
3. cutoff time;
4. какие features существуют к cutoff;
5. что будет новым в production: row, user, group, future period, item.

Split должен разрывать именно тот тип dependence, который будет разорван в deployment.

## Random split

Подходит, если rows приблизительно iid и один entity не повторяется между folds. Пример — независимые физические measurements без temporal drift.

Не подходит автоматически для:

- transactions одного user;
- multiple images одного patient;
- events во времени;
- augmented copies;
- sessions одного device;
- recommendations по тем же users/items.

## Stratification

Stratified split сохраняет class proportions. Это снижает variance metrics при rare classes, но не устраняет group/time leakage.

Для regression иногда stratify по target bins, если bins строятся стабильно и не создают слишком малые strata. Это heuristic, а не требование.

## Group split и GroupKFold

Если rows одного entity зависимы, весь group должен находиться в одном fold:

```text
train users ∩ validation users = ∅
```

`GroupKFold` проверяет generalization на новые groups. `StratifiedGroupKFold` пытается одновременно сохранять label balance и groups, но при малом числе groups идеальный balance невозможен.

Group выбирается по source dependence, а не по удобному ID. Household, patient, merchant или document source могут быть правильнее user ID.

## Time split

Для prediction будущего:

```text
train:  past
validation: later
test: latest untouched period
```

Нельзя случайно перемешивать future в train. Rolling/expanding windows оценивают stability во времени:

```text
fold 1: train [t0..t3] → validate [t4]
fold 2: train [t0..t4] → validate [t5]
fold 3: train [t0..t5] → validate [t6]
```

Gap между train и validation нужен, если features/labels созревают с задержкой или nearby observations почти дублируются.

## Cross-validation

Для $K$ folds:

$$
\widehat{m}_{CV}
=\frac{1}{K}
\sum_{k=1}^{K}m_k.
$$

Важно смотреть не только mean, но и spread/fold diagnostics. Большая variation может указывать на малые segments, drift, group imbalance или нестабильный pipeline.

CV не создаёт независимые estimates: folds overlap по train data. Standard deviation fold scores — диагностический spread, не автоматический confidence interval.

## Preprocessing внутри folds

В каждом fold отдельно fit:

- imputer;
- scaler;
- category encoder;
- target encoder;
- feature selector;
- PCA;
- vocabulary/TF-IDF;
- calibration;
- threshold, если он часть model-selection.

Правильная структура:

```text
raw train fold
→ fit transformers
→ transform train and validation fold
→ fit model
→ evaluate validation fold
```

После выбора pipeline его refit на allowed training data и один раз оценивают на test.

## Виды leakage

### Target leakage

Feature прямо или косвенно использует target: post-outcome status, refund after churn, target encoding с собственной label.

### Time leakage

Feature создан после prediction cutoff или aggregation заглядывает в future.

### Group leakage

Один entity или near-duplicate присутствует в train и validation.

### Preprocessing leakage

Statistics/feature selection/PCA/vocabulary fit на полном dataset.

### Validation overfitting

Много ручных итераций по одному validation set адаптируют решение к его noise, даже без прямого доступа к labels в code.

## Early stopping, calibration и threshold

- Early stopping выбирает iteration на validation.
- Calibration fit на held-out или out-of-fold predictions.
- Threshold выбирается по costs/constraints на validation.
- Final test получает уже зафиксированные iteration, calibrator и threshold.

Использовать test для early stopping — утечка model selection.

## Малые данные

- repeated/stratified CV снижает зависимость от одного random split;
- nested CV отделяет hyperparameter selection от outer evaluation;
- но правильный group/time structure важнее числа repeats;
- uncertainty и fold-level results нужно показывать честно.

## Связи

- [[ML Foundations]] — validation измеряет generalization, а не train fit.
- [[ML Metrics and Threshold Selection]] — metric и decision rule выбираются на validation.
- [[A-B Testing]] — offline validation не заменяет randomized online effect.
- [[Principal Component Analysis]] — PCA fit только внутри train folds.
- [[Regularization]] — strength выбирается по validation.
- [[Диагностика — PR-AUC на train выше validation]] — практический разбор gap.
