---
title: Class Imbalance and Resampling
id: concept.ml.class-imbalance-resampling
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
- Дисбаланс классов
- Imbalanced classification
tags:
- ml/classification
- ml/imbalance
math_depth: 1
---

# Class Imbalance and Resampling

## Проблема

Rare positive class встречается в fraud, churn, defects. Accuracy может быть высокой у модели, которая всегда предсказывает negative. Но imbalance сам по себе не требует resampling: сначала нужно определить costs, metric и operating capacity.

## Метрики

Используйте:

- precision/recall;
- PR-AUC/AP;
- ROC-AUC как ranking context;
- confusion matrix at operating point;
- recall at fixed precision;
- precision at top-K;
- expected cost.

Всегда показывайте prevalence.

## Class weights

Loss positive examples получает больший вес. Это меняет optimization и decision boundary. Raw probabilities после weighting могут быть miscalibrated.

## Undersampling

Удаляется часть majority class.

Плюсы: быстрее, балансирует gradient.
Минусы: теряется информация, probability prior меняется.

Выполняется только внутри train fold.

## Oversampling

Копирование minority rows увеличивает их weight. SMOTE интерполирует между neighbours, но может создавать unrealistic points и плохо работать с categories/time/groups.

Никогда не oversample до split: duplicate/synthetic relatives попадут в validation.

## Threshold

Часто достаточно обучить модель на исходных данных, получить хороший ranking и выбрать threshold/top-K по business constraint.

## Evaluation

Validation/test должны сохранять production prevalence. Искусственно balanced test искажает precision и expected cost.

## Числовой пример

Пусть в 10 000 транзакциях только 100 fraud cases. Модель нашла 80 fraud cases, но также пометила 320 обычных транзакций.

- $TP=80$;
- $FN=20$;
- $FP=320$;
- $TN=9580$.

Тогда:

$$
\operatorname{Recall}=\frac{80}{100}=0.8,
$$

$$
\operatorname{Precision}=\frac{80}{80+320}=0.2.
$$

Accuracy при этом равна $(80+9580)/10000=96.6\%$ и выглядит высокой, хотя четыре из пяти alerts ложные. Поэтому metric выбирается из стоимости пропуска fraud и стоимости ручной проверки.

## Как выбирать стратегию

1. Зафиксируйте real prevalence и стоимость ошибок.
2. Выберите metric и operational constraint: например, максимум 500 alerts в день.
3. Постройте baseline без resampling.
4. Настройте threshold на validation.
5. Затем сравните class weights, undersampling или oversampling внутри train folds.
6. Проверьте calibration и сегменты.

Resampling — не обязательный ритуал. Иногда CatBoost/LightGBM с class weights и правильно выбранным threshold работают лучше и проще, чем SMOTE.

## Почему split должен быть первым

Если сначала создать synthetic minority objects, а потом разделить данные, близкие synthetic points могут попасть и в train, и в validation. Validation перестаёт имитировать новые данные и metric становится оптимистичной. При cross-validation sampler должен находиться внутри pipeline и выполняться отдельно на каждом training fold.

## Мини-проверка

Вам нужно проверять не более 200 заявок из 20 000. В таком процессе полезнее смотреть precision@200 и recall@200, чем accuracy. PR-AUC помогает сравнить ranking в целом, но production threshold всё равно определяется capacity.

## Визуализация

Компонент `imbalance-threshold-lab`:

- prevalence slider;
- same score distributions;
- PR/ROC curves;
- threshold;
- confusion counts;
- class weight/resampling toggle;
- calibration warning.

## Частые ошибки

- accuracy как главная metric;
- SMOTE до split;
- balanced test;
- class weights и threshold одновременно без validation;
- считать ROC-AUC достаточной;
- забыть capacity;
- считать weighted probabilities calibrated.

## Связи

- [[ML Metrics and Threshold Selection]]
- [[Probability Calibration]]
- [[Logistic Regression]]
- [[Validation Splits and Data Leakage]]
