---
title: K-Nearest Neighbors
type: concept
area: ml
status: active
aliases:
  - KNN
  - Метод k ближайших соседей
tags:
  - ml/classical
  - ml/distance-based
math_depth: 2
id: concept.ml.k-nearest-neighbors
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# K-Nearest Neighbors

## Идея за 30 секунд

KNN не строит явную parametric function: для нового объекта он находит $k$ ближайших train points и агрегирует их targets. Малый $k$ даёт гибкую, но шумную boundary; большой $k$ сильнее сглаживает. Метод полностью зависит от distance, поэтому scaling, irrelevant features и curse of dimensionality критичны.

## Как работает

Для query $x$:

1. вычислить distance до train objects;
2. выбрать set $N_k(x)$ из $k$ ближайших;
3. классификация — majority/weighted vote;
4. регрессия — mean/weighted mean targets.

Classification estimate:

$$
\widehat{P}(Y=c\mid x)
=\frac{1}{k}
\sum_{i\in N_k(x)}
\mathbb{1}[y_i=c].
$$

Regression:

$$
\widehat{y}(x)
=\frac{1}{k}
\sum_{i\in N_k(x)}y_i.
$$

Distance weighting:

$$
w_i=\frac{1}{(d(x,x_i)+\varepsilon)^p},
\qquad
\widehat{y}(x)
=\frac{\sum_{i\in N_k(x)}w_i y_i}
{\sum_{i\in N_k(x)}w_i}.
$$

$\varepsilon$ предотвращает division by zero; $p$ управляет локальностью.

## Distance

Euclidean:

$$
d_2(x,z)=
\sqrt{\sum_{j=1}^{d}(x_j-z_j)^2}.
$$

Manhattan:

$$
d_1(x,z)=
\sum_{j=1}^{d}|x_j-z_j|.
$$

Cosine distance фокусируется на направлении и полезна для некоторых sparse/embedding representations. Metric должна соответствовать geometry задачи, а не выбираться только по default.

## Почему scaling обязателен

Если `income` измерен десятками тысяч, а binary feature принимает $0/1$, Euclidean distance почти полностью определяется income.

Standardization:

$$
x_j^{(s)}
=\frac{x_j-\mu_j}{\sigma_j}
$$

fit только на train. Scaling не делает features одинаково полезными; irrelevant standardized dimensions по-прежнему добавляют noise к distance.

## Выбор k и bias–variance

- $k=1$: минимальный local bias, высокий variance, чувствительность к noise.
- Большой $k$: smoother boundary, меньше variance, больше bias.
- Слишком большой $k$ приближает prediction к global average/majority.

$k$ выбирают внутри CV с тем же pipeline scaling. При class imbalance majority vote может игнорировать minority; нужны suitable metric, class-aware weighting или другой method.

## Curse of dimensionality

В high dimension:

- volume сосредоточен далеко от центра;
- для fixed neighborhood требуется очень много data;
- nearest и farthest distances становятся относительно похожими;
- irrelevant coordinates накапливают noise.

Качественная «локальность» исчезает. Помогают:

- feature selection;
- domain metric;
- PCA/embeddings;
- metric learning;
- больше данных;
- другая model family.

PCA не нужно применять автоматически: supervised signal может жить в low-variance direction.

## Complexity

Наивное обучение почти отсутствует: сохраняется train set. Наивный inference:

$$
O(nd)
$$

на query для $n$ объектов и $d$ features, плюс selection neighbors.

KD-tree/Ball-tree ускоряют низкую dimension, но деградируют в high-dimensional spaces. Approximate nearest neighbor indexes меняют exactness на latency/memory.

## Failure modes

- scaling fit до split;
- ID-like и high-cardinality encoded features в distance;
- duplicates с конфликтующими labels;
- data drift: сохранённые neighbors больше не локальны;
- leakage через post-event features;
- интерпретация neighbor labels как calibrated probability без проверки;
- медленный inference на большом train set.

## Связи

- [[Linear Algebra for ML]] — norms, distances и cosine similarity.
- [[ML Foundations]] — $k$ управляет bias–variance.
- [[Principal Component Analysis]] — возможное preprocessing для distance, но только внутри CV.
- [[Validation Splits and Data Leakage]] — scaler и выбор $k$ fit внутри folds.
- [[ML Metrics and Threshold Selection]] — imbalance и threshold меняют оценку classifier.
