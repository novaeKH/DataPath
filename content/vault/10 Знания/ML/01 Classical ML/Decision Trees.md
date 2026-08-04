---
title: Decision Trees
type: concept
area: ml
status: active
aliases:
  - Decision Tree
  - Деревья решений
tags:
  - ml/classical
  - ml/trees
math_depth: 2
id: concept.ml.decision-trees
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Decision Trees

## Идея за 30 секунд

Decision Tree рекурсивно делит feature space условиями и даёт простой constant prediction в каждом leaf. Split выбирается по уменьшению impurity/loss. Дерево ловит nonlinearities и interactions без scaling, но greedy growth и малые листья дают высокий variance.

## Как строится prediction

```text
income <= 80 000?
├─ да: age <= 25?
│  ├─ да  → probability 0.18
│  └─ нет → probability 0.41
└─ нет → probability 0.67
```

Каждый internal node содержит feature и condition; leaf хранит class proportions, mean, median или иной constant estimator.

## Split gain

Для node с $n$ objects:

$$
\operatorname{Gain}
=I(\text{parent})
-\frac{n_L}{n}I(\text{left})
-\frac{n_R}{n}I(\text{right}).
$$

$I$ — impurity или loss внутри node. Algorithm greedily выбирает лучший текущий split, не перебирая все будущие tree structures.

Для numeric feature достаточно рассматривать boundaries между соседними различными sorted values.

## Classification criteria

Если $p_k$ — доля класса $k$:

$$
\operatorname{Gini}
=1-\sum_k p_k^2,
$$

$$
\operatorname{Entropy}
=-\sum_k p_k\log p_k.
$$

Pure node имеет zero impurity. Gini и entropy часто дают похожие splits; structural constraints обычно важнее выбора между ними.

Tree criterion — surrogate. Он не обязан совпадать с business metric вроде F1 или expected cost.

## Regression tree

При squared error best constant prediction в leaf — mean:

$$
\widehat{y}_{\text{leaf}}
=\frac{1}{n_{\text{leaf}}}
\sum_{i\in\text{leaf}}y_i.
$$

Impurity:

$$
I(\text{leaf})
=\frac{1}{n_{\text{leaf}}}
\sum_{i\in\text{leaf}}
(y_i-\widehat{y}_{\text{leaf}})^2.
$$

При absolute error best constant — median.

Prediction piecewise constant и обычно не extrapolate за train range.

## Почему дерево overfit

Без ограничений leaf может содержать один object и запоминать noise. Малое изменение sample может изменить ранний split и всю нижнюю structure.

Capacity controls:

| Parameter | Смысл |
|---|---|
| `max_depth` | maximum interaction order/path length |
| `min_samples_split` | можно ли делить текущий node |
| `min_samples_leaf` | minimum support каждого child/leaf |
| `max_leaf_nodes` | прямое ограничение числа regions |
| `max_features` | candidate features на split |
| `ccp_alpha` | cost-complexity pruning |

Cost-complexity objective:

$$
R_\alpha(T)=R(T)+\alpha|T|.
$$

## Scaling, missing values и categories

Monotonic scaling сохраняет order объектов и эквивалентные thresholds, поэтому самому tree standardization обычно не нужна.

Missing/category handling зависит от implementation:

- imputation plus missing indicator;
- learned default direction;
- native categorical partitions;
- OHE;
- leakage-safe statistical encoding.

Integer category code нельзя автоматически трактовать как meaningful order.

## Feature importance

Impurity importance смещена в пользу continuous/high-cardinality features и делится между correlated variables. Permutation importance на validation ближе к вопросу «насколько model использует feature», но также страдает при correlation.

Ни одна model importance не является causal effect.

## Что если предположения нарушены

Tree не требует linearity или Gaussian noise, но всё равно зависит от:

- representative train sample;
- честного feature availability;
- достаточного support в листьях;
- стабильности categories/time;
- корректной validation scheme.

Small leaf с высоким score может быть noise или leakage, а не «найденный сегмент».

## Связи

- [[Bagging and Random Forest]] — averaging снижает variance нестабильных trees.
- [[Gradient Boosting]] — trees последовательно исправляют ошибки вместо независимого averaging.
- [[Categorical Features]] — leakage-safe обработка categories.
- [[ML Foundations]] — tree capacity и bias–variance.
- [[Validation Splits and Data Leakage]] — pruning/parameters выбираются внутри CV.
- [[Trees and Random Forest — Interview]] — краткие вопросы.
