---
title: Linear Algebra for ML
type: concept
area: math
status: active
aliases:
  - Линейная алгебра для ML
  - Vectors matrices and projections
tags:
  - math/linear-algebra
  - ml/foundations
math_depth: 2
id: concept.math.linear-algebra-for-ml
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Linear Algebra for ML

## Идея за 30 секунд

Объект ML часто представлен вектором, dataset — матрицей, linear model — матричным преобразованием. Dot product измеряет aligned component, norm — размер, projection — ближайшее представление в subspace, rank — число независимых направлений. Эти понятия объясняют Linear Regression, PCA, embeddings и neural Linear layer.

## Векторы и размерности

Вектор:

$$
x=
\begin{bmatrix}
x_1\\
\vdots\\
x_d
\end{bmatrix}
\in\mathbb{R}^d.
$$

В tabular ML компоненты могут быть features объекта. В embedding space они являются learned coordinates и не обязаны иметь отдельную человеческую интерпретацию.

Проверка shapes — часть математики, а не только debugging. Если:

$$
X\in\mathbb{R}^{n\times d},
\qquad
w\in\mathbb{R}^{d},
$$

то $Xw\in\mathbb{R}^n$ — один prediction на каждый из $n$ объектов.

## Dot product и угол

$$
x^\top y=\sum_{j=1}^{d}x_jy_j.
$$

Также:

$$
x^\top y=\lVert x\rVert_2\lVert y\rVert_2\cos\theta.
$$

Dot product одновременно:

- суммирует pairwise interactions;
- измеряет alignment;
- задаёт linear score;
- после нормировки превращается в cosine similarity.

Если vectors не нормированы, большой norm может доминировать над направлением.

## Нормы и расстояния

$$
\lVert x\rVert_1=\sum_j|x_j|,
\qquad
\lVert x\rVert_2=\sqrt{\sum_jx_j^2}.
$$

Euclidean distance:

$$
d(x,z)=\lVert x-z\rVert_2.
$$

L1 norm менее чувствительна к отдельной большой coordinate, а L2 особенно штрафует большие deviations. В high-dimensional space distances могут становиться близкими друг к другу; scaling features критичен для distance-based methods.

## Матрица как linear transformation

Для $A\in\mathbb{R}^{m\times d}$:

$$
y=Ax
$$

отображает $d$-dimensional input в $m$-dimensional output. Linear transformation сохраняет сложение и умножение на scalar.

Affine transformation добавляет bias:

$$
y=Ax+b.
$$

Именно affine map реализует dense/Linear layer до activation.

## Rank и identifiability

Rank — число линейно независимых columns или rows. Если design matrix $X$ не имеет полного column rank, существуют разные coefficient vectors с одинаковым $X\beta$; параметры не идентифицируются без дополнительного constraint.

Near multicollinearity не делает rank строго неполным, но ухудшает conditioning: малое изменение данных сильно меняет coefficients.

## Subspace и projection

Projection $p$ вектора $y$ на column space матрицы $X$ — ближайший к $y$ вектор вида $X\beta$ по Euclidean distance:

$$
\widehat{y}=X\widehat{\beta},
$$

$$
\widehat{\beta}
=\arg\min_\beta
\lVert y-X\beta\rVert_2^2.
$$

В optimum residual ортогонален каждому column $X$:

$$
X^\top(y-X\widehat{\beta})=0.
$$

Это normal equations:

$$
X^\top X\widehat{\beta}=X^\top y.
$$

При full column rank:

$$
\widehat{\beta}=(X^\top X)^{-1}X^\top y.
$$

На практике явную inverse обычно не вычисляют: QR или SVD устойчивее.

## Почему centering важен

Centering:

$$
x_i^{(c)}=x_i-\bar{x}.
$$

После centering covariance, projection directions и intercept получают ясную геометрию. PCA без centering ищет directions относительно origin, а не относительно data mean, и может отвечать на другой вопрос.

## Что если предположения нарушены

- Features в разных единицах искажают distance, norm и covariance.
- Near-singular matrix делает coefficients unstable.
- Projection geometry объясняет training fit, но не generalization.
- Линейное subspace не описывает nonlinear manifold без feature map или nonlinear model.

## Связи

- [[Eigenvalues Covariance Matrix and PCA Foundations]] — eigenvectors задают специальные directions linear transformation.
- [[Singular Value Decomposition]] — показывает rank, conditioning и устойчивую least-squares solution.
- [[Gauss-Markov Theorem]] — добавляет statistical assumptions к OLS geometry.
- [[Gradients Chain Rule and Optimization]] — matrix operations дают gradients linear models и neural layers.
