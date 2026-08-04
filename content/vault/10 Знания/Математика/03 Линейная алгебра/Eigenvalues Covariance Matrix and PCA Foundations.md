---
title: Eigenvalues Covariance Matrix and PCA Foundations
type: concept
area: math
status: active
aliases:
  - Eigenvectors eigenvalues and covariance matrix
  - Собственные векторы собственные значения и PCA
  - PCA foundations
tags:
  - math/linear-algebra
  - ml/dimensionality-reduction
math_depth: 2
id: concept.math.eigenvalues-covariance-matrix-and-pca-foundations
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Eigenvalues Covariance Matrix and PCA Foundations

## Идея за 30 секунд

Eigenvector матрицы не меняет направление после linear transformation, а eigenvalue показывает масштаб изменения. Для covariance matrix eigenvectors задают ортогональные направления variation, eigenvalues — variance вдоль них. PCA центрирует данные, выбирает направления с крупнейшими eigenvalues и проецирует объекты на них.

## Eigenvectors и eigenvalues

Для квадратной матрицы $A$ ненулевой vector $v$ является eigenvector, если:

$$
Av=\lambda v.
$$

$\lambda$ — eigenvalue. Transformation $A$ растягивает или сжимает $v$, но не поворачивает его в другое направление.

У symmetric real matrix:

- eigenvalues вещественны;
- eigenvectors для разных eigenvalues ортогональны;
- существует orthonormal eigenbasis.

Covariance matrix symmetric, поэтому её spectral decomposition особенно удобна.

## Covariance matrix

Пусть centered dataset:

$$
X_c=X-\mathbf{1}\bar{x}^\top,
\qquad
X_c\in\mathbb{R}^{n\times d}.
$$

Sample covariance matrix:

$$
S=\frac{1}{n-1}X_c^\top X_c.
$$

Для unit vector $v$ projection каждого объекта:

$$
z=X_cv.
$$

Variance этой projection:

$$
\operatorname{Var}(z)
=v^\top S v.
$$

PCA ищет unit direction с максимальной projected variance:

$$
v_1
=\arg\max_{\lVert v\rVert_2=1}
v^\top S v.
$$

Решение — eigenvector $S$ с наибольшим eigenvalue $\lambda_1$.

## PCA по шагам

1. **Center** каждый feature.
2. При необходимости **scale**, если единицы измерения несопоставимы.
3. Оценить covariance matrix или сразу выполнить SVD centered data.
4. Отсортировать directions по eigenvalues.
5. Выбрать первые $k$ components.
6. Проецировать:

$$
Z=X_cV_k,
$$

где $V_k\in\mathbb{R}^{d\times k}$ содержит top-$k$ eigenvectors.

7. При необходимости приблизительно восстановить:

$$
\widehat{X}=ZV_k^\top+\bar{x}.
$$

## Explained variance

Если eigenvalues отсортированы $\lambda_1\ge\cdots\ge\lambda_d\ge0$, доля объяснённой variance component $j$:

$$
\operatorname{EVR}_j
=\frac{\lambda_j}{\sum_{\ell=1}^{d}\lambda_\ell}.
$$

Cumulative explained variance помогает выбрать $k$, но threshold вроде $95\%$ не является универсальным. Небольшая-variance direction может быть важна для target, anomaly или minority group.

## Почему scaling меняет PCA

Covariance зависит от units. Feature в тысячах может доминировать feature в долях. Standardization:

$$
x_{ij}^{(s)}
=\frac{x_{ij}-\bar{x}_j}{s_j}
$$

делает PCA эквивалентной работе с correlation matrix.

Scaling полезен, когда features измеряют сопоставимые по смыслу явления в разных единицах. Он может быть вреден, если absolute variance сама несёт смысл или noise-dominated feature искусственно получает равный вес.

## PCA не является feature selection

Каждая principal component обычно смешивает исходные features. PCA снижает dimension через новые coordinates, но усложняет интерпретацию. Supervised signal не входит в objective: maximized variance не обязана быть predictive.

## Что если предположения нарушены

- Без centering первая component может отражать положение mean относительно origin.
- Outliers сильно меняют covariance и directions.
- Nonlinear manifold не обязательно хорошо описывается linear subspace.
- Data leakage возникает, если center/scale/PCA fit выполняется до train/validation split.
- При близких eigenvalues отдельные eigenvectors нестабильны, хотя их общий subspace может быть устойчив.

## Связи

- [[Expectation Variance Covariance and Correlation]] — определяет covariance matrix и projected variance.
- [[Linear Algebra for ML]] — projection, orthogonality и rank.
- [[Singular Value Decomposition]] — практический способ вычислить PCA без явной covariance matrix.
- [[Gradients Chain Rule and Optimization]] — constrained maximization даёт eigenvalue problem.
