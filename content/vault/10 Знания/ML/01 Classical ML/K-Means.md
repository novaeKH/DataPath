---
title: K-Means
type: concept
area: ml
status: active
aliases:
  - K-means clustering
  - Метод k средних
tags:
  - ml/classical
  - ml/clustering
math_depth: 2
id: concept.ml.k-means
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# K-Means

## Идея за 30 секунд

K-Means делит points на $K$ clusters так, чтобы сумма squared distances до cluster centroids была мала. Алгоритм чередует assignment к ближайшему centroid и пересчёт mean. Он находит local optimum, зависит от initialization и scaling и лучше всего соответствует компактным примерно spherical clusters.

## Objective

Для data $x_1,\ldots,x_n\in\mathbb{R}^d$, assignments $c_i\in\{1,\ldots,K\}$ и centroids $\mu_1,\ldots,\mu_K$:

$$
J
=\sum_{i=1}^{n}
\lVert x_i-\mu_{c_i}\rVert_2^2.
$$

Squared Euclidean distance определяет geometry метода. Если нужна другая distance, update centroid как mean может перестать минимизировать objective.

## Lloyd algorithm

### Assignment step

$$
c_i
=\arg\min_{k}
\lVert x_i-\mu_k\rVert_2^2.
$$

### Update step

$$
\mu_k
=\frac{1}{|C_k|}
\sum_{i:c_i=k}x_i.
$$

Mean — minimizer sum of squared distances внутри fixed cluster.

Каждый шаг не увеличивает objective, поэтому algorithm сходится, но только к local optimum.

## Initialization

Random centroids могут:

- попасть в один region;
- дать empty/poor clusters;
- привести к разным local optima.

K-Means++ выбирает initial centers с предпочтением points далеко от уже выбранных centers. Обычно запускают несколько initializations и выбирают solution с меньшей inertia.

## Почему scaling важен

Feature в крупных units доминирует squared distance и centroids. Standardization fit на train/analysis population обычно необходима.

Но автоматическое equal scaling может сделать noise feature столь же важным, как business-critical feature. Scaling — часть определения similarity.

## Как выбрать K

- inertia всегда не возрастает с $K$, поэтому minimum не выбирает $K$;
- elbow plot ищет diminishing returns, но elbow может быть нечётким;
- silhouette сравнивает cohesion и separation;
- stability между samples/initializations;
- downstream usefulness и domain interpretation.

Cluster count — modelling decision, а не обязательно «истинное число типов».

## Assumptions geometry

K-Means предпочитает clusters:

- convex;
- приблизительно spherical;
- похожего scale;
- разделимые Euclidean distance;
- без большого числа сильных outliers.

Для elongated, nested, varying-density или categorical structures подходят другие methods/representations.

## Prediction для новых объектов

После fit новый point относят к ближайшему centroid. Это возможно, но при distribution shift distance может не отражать исходную cluster semantics.

Clusters не получают смысл автоматически. Business label появляется только после profiling без использования post-outcome leakage.

## Failure modes

- не scaling features;
- интерпретировать cluster ID как ordinal number;
- выбирать $K$ только по красивой projection;
- оценивать clusters на тех же features и metric без stability;
- считать PCA 2D plot доказательством separation в original space;
- игнорировать outliers;
- давать clusters causal/personality labels без проверки.

## Связи

- [[Linear Algebra for ML]] — Euclidean distance и centroid.
- [[Expectation Variance Covariance and Correlation]] — within-cluster variance.
- [[Principal Component Analysis]] — visualization/compression, но не обязательная часть K-Means.
- [[ML Foundations]] — unsupervised objective не равен business usefulness.
- [[Validation Splits and Data Leakage]] — preprocessing и profiling должны учитывать момент доступности данных.
