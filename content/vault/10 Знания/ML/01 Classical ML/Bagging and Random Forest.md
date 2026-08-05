---
title: Bagging and Random Forest
type: concept
area: ml
status: active
aliases:
  - Bagging
  - Random Forest
  - Случайный лес
  - Бэггинг
tags:
  - ml/classical
  - ml/ensembles
math_depth: 2
id: concept.ml.bagging-and-random-forest
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Bagging and Random Forest

## Идея за 30 секунд

Bagging обучает base models независимо на bootstrap samples и усредняет predictions. Он особенно полезен для high-variance estimators вроде deep trees. Random Forest добавляет случайный subset features на каждом split, чтобы trees меньше коррелировали. Averaging снижает variance только когда ошибки моделей не полностью одинаковы.

## Bootstrap

Из $n$ train objects выбирают $n$ раз с возвращением. Probability, что конкретный object не выбран:

$$
\left(1-\frac{1}{n}\right)^n
\approx e^{-1}\approx0.368.
$$

Значит одна bootstrap sample содержит около $63.2\%$ unique objects. Остальные для данного tree — out-of-bag.

Bootstrap имитирует variation training sample и создаёт разные fitted trees.

## Bagging prediction

Regression:

$$
\widehat{f}(x)
=\frac{1}{M}
\sum_{m=1}^{M}
\widehat{f}_m(x).
$$

Classification агрегирует class probabilities или votes.

Если individual model errors имеют variance $\sigma^2$ и pairwise correlation $\rho$, variance average приблизительно:

$$
\operatorname{Var}(\bar{f})
\approx
\rho\sigma^2
+\frac{1-\rho}{M}\sigma^2.
$$

Увеличение $M$ уменьшает independent component, но не убирает correlated error. Поэтому diversity важна.

## Random Forest

Каждый tree:

1. получает bootstrap sample;
2. на каждом split рассматривает случайный subset features;
3. растёт с заданными structural constraints;
4. участвует в averaging.

Feature subsampling может сделать отдельный tree слабее, но снижает correlation: один очень сильный feature не захватывает одинаковый first split во всех trees.

## Bias и variance

**Интуиция с монеткой:** подбросьте одну монетку 10 раз — можете получить 8 орлов (сильная случайная ошибка). Подбросьте 100 монеток по 10 раз и усредните — результат будет близок к 50%. Усреднение многих независимых «голосований» сглаживает случайные ошибки.

Для деревьев: одно глубокое дерево сильно зависит от конкретной обучающей выборки — небольшое изменение данных может полностью изменить структуру дерева (high variance). Если обучить $M$ деревьев на разных bootstrap-выборках и усреднить предсказания:
- каждое дерево имеет низкий bias (глубокое) и высокую индивидуальную variance;
- но ошибки деревьев **нескоррелированы** (разные выборки, разные features на каждом split);
- при усреднении независимые ошибки компенсируют друг друга.

- Более глубокие trees: lower bias, higher individual variance.
- Больше trees: обычно ниже Monte Carlo variance, но больше latency/memory.
- Меньше `max_features`: больше diversity, возможен higher bias.
- Больше `min_samples_leaf`: smoother probabilities и lower variance.

Random Forest обычно не переобучается просто от добавления trees после stabilization, но может overfit из-за leakage, слишком маленьких leaves, noisy features или неправильной validation.

## Out-of-bag estimate

Для object prediction агрегируют только trees, где он был OOB. Это даёт internal estimate без отдельного fold split.

Ограничения:

- не заменяет time/group-aware validation;
- preprocessing должен быть leakage-safe;
- OOB metric может отличаться от final decision metric;
- tuning многократно по OOB тоже создаёт selection bias.

## Probability quality

Leaf class fractions, усреднённые по trees, дают score/probability-like output. Small leaves и imbalance могут ухудшать calibration. Threshold и calibration выбираются на held-out/CV predictions.

## Feature importance и uncertainty

Impurity importance наследует biases tree splits. Permutation importance считать на validation/OOB и интерпретировать с учётом correlation.

Spread predictions между trees не является автоматически calibrated predictive uncertainty: trees зависимы и bootstrap не отражает все sources shift/noise.

## Extra Trees

Extremely Randomized Trees добавляют randomness thresholds/splits. Это может ещё сильнее снизить correlation и ускорить fit ценой дополнительного bias.

## Когда использовать

- нелинейный tabular baseline;
- mixed interactions без сложного feature engineering;
- достаточно data для leaves;
- важны robust defaults и parallel training;
- boosting overfit или слишком чувствителен к tuning.

## Failure modes

- считать OOB честным при time series;
- задавать integer categories как ordered numbers;
- использовать tiny leaves для probability estimation;
- сравнивать forests с разным preprocessing/split;
- трактовать importance causally;
- ожидать extrapolation в regression.

## Ответ для собеседования

Random Forest — ансамбль Decision Trees, где каждое дерево обучается на bootstrap-выборке строк и случайном подмножестве признаков на каждом split. Предсказание — усреднение (регрессия) или голосование (классификация). **Ключевая идея:** усреднение некоррелированных деревьев снижает variance. Одно дерево может сильно переобучиться; $M$ деревьев на разных выборках ошибаются по-разному, и при усреднении ошибки компенсируются. **Преимущества:** стабильнее одного дерева, OOB-оценка заменяет validation set для baseline, feature importance, параллельное обучение. **Ограничения:** не экстраполирует за пределы train-диапазона, хуже boosting на сложных зависимостях, требует кодирования категорий.

## Связи

- [[Decision Trees]] — base learner и split mechanics.
- [[Gradient Boosting]] — последовательная коррекция вместо independent averaging.
- [[ML Foundations]] — variance reduction через averaging.
- [[Expectation Variance Covariance and Correlation]] — correlation errors определяет предел averaging.
- [[Validation Splits and Data Leakage]] — OOB не заменяет structure-aware split.
- [[Trees and Random Forest — Interview]] — короткий формат.
- [[Ensemble Comparison]] — comparison table и decision framework.
