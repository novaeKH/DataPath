---
title: Linear Regression
type: concept
area: ml
status: active
aliases:
  - Линейная регрессия
  - OLS
  - Ordinary Least Squares
tags:
  - ml/classical
  - ml/linear-models
math_depth: 2
id: concept.ml.linear-regression
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Linear Regression

## Идея за 30 секунд

Linear Regression моделирует conditional mean target как affine function признаков. При Gaussian additive noise maximum likelihood приводит к minimization squared residuals — поэтому возникает MSE/OLS. Отдельно Gauss–Markov объясняет, когда OLS является наиболее efficient linear unbiased estimator; это не источник squared loss.

## Зачем нужно

- сильный и быстрый baseline;
- интерпретируемая additive specification;
- работа с sparse/high-dimensional data;
- foundation для regularization, generalized linear models и causal regression;
- диагностика качества данных и feature construction.

## Формальная модель

Добавим intercept как column единиц в design matrix:

$$
y=X\beta+\varepsilon,
$$

где:

- $X\in\mathbb{R}^{n\times p}$ — features и intercept column;
- $y\in\mathbb{R}^n$ — target;
- $\beta\in\mathbb{R}^p$ — coefficients;
- $\varepsilon$ — unexplained errors.

Prediction:

$$
\widehat{y}=X\widehat{\beta}.
$$

Coefficient $\beta_j$ — постоянное ceteris-paribus изменение conditional mean при увеличении $x_j$ на единицу внутри выбранной linear specification. Это не автоматически causal effect.

## Почему именно squared error

Предположим independent Gaussian noise с общей variance:

$$
\varepsilon_i\overset{\text{iid}}{\sim}\mathcal{N}(0,\sigma^2).
$$

Тогда:

$$
y_i\mid x_i
\sim
\mathcal{N}(x_i^\top\beta,\sigma^2).
$$

Likelihood:

$$
\mathcal{L}(\beta,\sigma^2)
=\prod_{i=1}^{n}
\frac{1}{\sqrt{2\pi\sigma^2}}
\exp\left(
-\frac{(y_i-x_i^\top\beta)^2}{2\sigma^2}
\right).
$$

Negative log-likelihood с точностью до terms, не зависящих от $\beta$:

$$
-\ell(\beta)
=\frac{1}{2\sigma^2}
\sum_{i=1}^{n}
(y_i-x_i^\top\beta)^2+\text{const}.
$$

При фиксированной общей $\sigma^2$ MLE:

$$
\widehat{\beta}_{\text{MLE}}
=\arg\min_\beta
\sum_{i=1}^{n}
(y_i-x_i^\top\beta)^2.
$$

MSE отличается от SSE только положительным factor $1/n$, поэтому имеет тот же optimum.

## Что меняется при другой noise model

- Heteroscedastic Gaussian noise с известными $\sigma_i^2$ приводит к weighted least squares:

$$
\min_\beta
\sum_{i=1}^{n}
\frac{(y_i-x_i^\top\beta)^2}{\sigma_i^2}.
$$

- Laplace noise приводит к absolute error / median-oriented estimation.
- Heavy-tailed noise мотивирует Huber или robust regression.
- Nonlinear conditional mean требует features, splines, trees или другой family.

Loss следует из того, какую observation model мы считаем разумной, а не из названия алгоритма.

## OLS solution и геометрия

Objective:

$$
J(\beta)=\lVert y-X\beta\rVert_2^2.
$$

Gradient:

$$
\nabla_\beta J
=-2X^\top(y-X\beta).
$$

В optimum:

$$
X^\top(y-X\widehat{\beta})=0.
$$

Residual ортогонален column space $X$; prediction — projection $y$ на это subspace. При полном column rank:

$$
\widehat{\beta}
=(X^\top X)^{-1}X^\top y.
$$

На практике используют QR/SVD или iterative solver, а не explicit inverse.

## Предположения

Для корректной интерпретации coefficients и classical inference важны:

- linear conditional mean;
- exogeneity $\mathbb{E}[\varepsilon\mid X]=0$;
- отсутствие exact multicollinearity;
- корректная sampling/dependence structure;
- homoscedasticity и uncorrelated errors для классической Gauss–Markov efficiency;
- Gaussianity главным образом для exact small-sample inference, не для существования OLS.

Для prediction некоторые assumptions можно нарушить, но результат, uncertainty и transferability меняются.

## Что если предположения нарушены

- Heteroscedasticity: point estimator может оставаться consistent при exogeneity, но standard errors нужны robust/weighted.
- Correlated errors: cluster/time-aware inference.
- Multicollinearity: predictions могут быть стабильнее coefficients; помогает regularization или redesign features.
- Omitted variable correlated with features: coefficients biased; robust SE не исправляет bias.
- Outliers/high leverage: проверить data quality, influence и robust alternatives.
- Extrapolation: linear function продолжает тренд за train range и может давать бессмысленные values.

## Связи

- [[Random Variables and Distributions]] — Gaussian noise и альтернативные observation models.
- [[Likelihood MLE and MAP]] — формальный мост от Gaussian likelihood к MSE.
- [[Gauss-Markov Theorem]] — отдельная ветка BLUE.
- [[Linear Algebra for ML]] — projection и normal equations.
- [[Regularization]] — Ridge, Lasso и Elastic Net.
- [[ML Basics and Linear Models — Interview]] — короткий формат собеседования.
