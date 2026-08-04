---
title: Principal Component Analysis
type: concept
area: ml
status: active
aliases:
  - PCA
  - Метод главных компонент
tags:
  - ml/classical
  - ml/dimensionality-reduction
math_depth: 2
id: concept.ml.principal-component-analysis
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Principal Component Analysis

## Идея за 30 секунд

PCA — unsupervised linear dimensionality reduction. Она центрирует data, находит orthogonal directions максимальной variance и проецирует objects на первые components. Через SVD это делается устойчиво. Scaling меняет вопрос: covariance PCA сохраняет absolute variance, standardized PCA работает с correlation structure.

## Зачем нужно

- compression;
- visualization;
- устранение linear redundancy;
- denoising при разумном low-rank assumption;
- preprocessing для distance/linear methods;
- диагностика latent directions.

PCA не использует target и не гарантирует улучшение supervised metric.

## Алгоритм

Пусть $X\in\mathbb{R}^{n\times d}$.

### 1. Center

$$
X_c=X-\mathbf{1}\bar{x}^\top.
$$

Без centering directions могут описывать положение mean относительно origin.

### 2. При необходимости scale

$$
x_{ij}^{(s)}
=\frac{x_{ij}-\bar{x}_j}{s_j}.
$$

Scaling нужен, если units несопоставимы и absolute variance не должна задавать importance.

### 3. Найти directions

Covariance matrix:

$$
S=\frac{1}{n-1}X_c^\top X_c.
$$

Eigenproblem:

$$
Sv_j=\lambda_jv_j.
$$

$v_j$ — component direction, $\lambda_j$ — variance projection.

Практически используют:

$$
X_c=U\Sigma V^\top,
$$

где columns $V$ — principal directions, а:

$$
\lambda_j=\frac{\sigma_j^2}{n-1}.
$$

### 4. Project

$$
Z=X_cV_k.
$$

$Z\in\mathbb{R}^{n\times k}$ — coordinates в component space.

## Explained variance

$$
\operatorname{EVR}_j
=\frac{\lambda_j}{\sum_{\ell=1}^{d}\lambda_\ell}.
$$

Выбор $k$:

- cumulative EVR;
- reconstruction error;
- downstream CV metric;
- latency/memory constraint;
- interpretability.

Порог $95\%$ — heuristic, не закон.

## Почему именно maximum variance

Для centered data и orthogonal projection rank $k$ minimization reconstruction squared error эквивалентна maximization retained variance. Это делает PCA оптимальной в конкретной linear/L2 постановке.

Если важен nonlinear manifold, robust loss или supervised signal, нужны другие objectives.

## Leakage-safe pipeline

На каждом training fold:

```text
fit center/scale на fold-train
→ fit PCA на fold-train
→ transform fold-train и fold-validation
→ fit downstream model
```

Fit PCA на полном dataset использует covariance validation/test features и создаёт leakage, даже без labels.

## Что если предположения нарушены

- Outliers сильно вращают covariance directions.
- High variance может быть nuisance, а low variance — predictive signal.
- Components меняют sign без изменения meaning; близкие eigenvalues дают нестабильные individual directions.
- Sparse matrix после centering становится dense; TruncatedSVD решает другую, не полностью centered задачу.
- New data с shifted mean/scale некорректно представляется старой PCA.

## Интерпретация

Loading $v_{j\ell}$ показывает вклад исходного feature $\ell$ в component $j$, но:

- sign условен;
- correlated features могут распределять weights;
- component не causal factor;
- rotation ради interpretability меняет representation.

## Связи

- [[Eigenvalues Covariance Matrix and PCA Foundations]] — математическое происхождение directions и EVR.
- [[Singular Value Decomposition]] — устойчивое вычисление и low-rank approximation.
- [[Expectation Variance Covariance and Correlation]] — covariance и scaling.
- [[K-Nearest Neighbors]] — PCA может улучшить distance geometry, но только по CV.
- [[K-Means]] — PCA часто используется для visualization, не как обязательный preprocessing.
- [[Validation Splits and Data Leakage]] — transformer fit внутри folds.
