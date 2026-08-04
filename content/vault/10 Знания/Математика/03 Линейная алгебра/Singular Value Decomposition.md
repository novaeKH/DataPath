---
title: Singular Value Decomposition
type: concept
area: math
status: active
aliases:
  - SVD
  - Сингулярное разложение
tags:
  - math/linear-algebra
  - ml/dimensionality-reduction
math_depth: 2
id: concept.math.singular-value-decomposition
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Singular Value Decomposition

## Идея за 30 секунд

SVD раскладывает любую прямоугольную матрицу на orthogonal input directions, non-negative scales и orthogonal output directions. Оно показывает rank и conditioning, даёт best low-rank approximation и позволяет вычислять PCA устойчиво без явного формирования covariance matrix.

## Разложение и shapes

Для $X\in\mathbb{R}^{n\times d}$:

$$
X=U\Sigma V^\top.
$$

В reduced SVD при rank $r$:

- $U\in\mathbb{R}^{n\times r}$ — left singular vectors;
- $\Sigma\in\mathbb{R}^{r\times r}$ — diagonal matrix singular values;
- $V\in\mathbb{R}^{d\times r}$ — right singular vectors.

Singular values:

$$
\sigma_1\ge\sigma_2\ge\cdots\ge\sigma_r>0.
$$

Геометрически $V^\top$ поворачивает input coordinates, $\Sigma$ масштабирует axes, $U$ поворачивает result.

## Связь с eigen decomposition

$$
X^\top X
=V\Sigma^2V^\top,
$$

$$
XX^\top
=U\Sigma^2U^\top.
$$

Columns $V$ — eigenvectors $X^\top X$, columns $U$ — eigenvectors $XX^\top$, eigenvalues равны $\sigma_j^2$.

## PCA через SVD

Для centered data $X_c$:

$$
S=\frac{1}{n-1}X_c^\top X_c.
$$

Если:

$$
X_c=U\Sigma V^\top,
$$

то principal directions — columns $V$, а covariance eigenvalues:

$$
\lambda_j=\frac{\sigma_j^2}{n-1}.
$$

Scores первых $k$ components:

$$
Z=X_cV_k=U_k\Sigma_k.
$$

SVD обычно предпочтительнее explicit eigendecomposition covariance matrix: формирование $X_c^\top X_c$ квадратит condition number и может усиливать numerical error.

## Low-rank approximation

Truncated SVD:

$$
X_k=U_k\Sigma_kV_k^\top.
$$

Eckart–Young theorem говорит, что $X_k$ — best rank-$k$ approximation по Frobenius norm:

$$
X_k
=\arg\min_{\operatorname{rank}(A)\le k}
\lVert X-A\rVert_F.
$$

Это объясняет compression, latent semantic analysis и low-rank embeddings. «Best» относится к выбранной norm, а не автоматически к downstream metric.

## Rank и conditioning

Число non-zero singular values равно rank. Condition number:

$$
\kappa(X)=\frac{\sigma_{\max}}{\sigma_{\min}}.
$$

Большая $\kappa$ означает: небольшие perturbations данных могут сильно изменить solution least squares. Малые singular values соответствуют плохо идентифицируемым directions.

Pseudoinverse:

$$
X^+=V\Sigma^+U^\top,
$$

где reciprocal берётся только для non-zero или сохранённых singular values. Она даёт minimum-norm least-squares solution.

## Scaling и sparse data

SVD не отменяет preprocessing:

- PCA требует centering;
- feature units влияют на directions;
- для sparse text explicit centering уничтожает sparsity, поэтому используют TruncatedSVD и интерпретируют его не как точную PCA centered matrix;
- randomized SVD полезна для больших matrices, но добавляет approximation error.

## Что если предположения нарушены

SVD существует без probabilistic assumptions. Однако interpretation как signal/noise или latent factors требует дополнительных предположений. Low singular value может быть noise, редкий signal или важная minority direction; решение о truncation должно учитывать downstream task.

## Связи

- [[Linear Algebra for ML]] — rank, projection и least squares.
- [[Eigenvalues Covariance Matrix and PCA Foundations]] — PCA directions и explained variance.
- [[Expectation Variance Covariance and Correlation]] — covariance matrix связывает SVD с variation.
- [[Gradients Chain Rule and Optimization]] — differentiable SVD требует осторожности при повторяющихся singular values.
