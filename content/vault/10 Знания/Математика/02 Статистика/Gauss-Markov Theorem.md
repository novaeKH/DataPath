---
title: Gauss-Markov Theorem
type: concept
area: math
status: active
aliases:
  - Теорема Гаусса Маркова
  - BLUE
tags:
  - math/statistics
  - ml/linear-models
math_depth: 2
id: concept.math.gauss-markov-theorem
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Gauss-Markov Theorem

## Идея за 30 секунд

Gauss–Markov theorem утверждает: при линейной модели, exogeneity, полном rank и homoscedastic uncorrelated errors OLS является BLUE — best linear unbiased estimator коэффициентов. «Best» означает минимальную variance среди linear unbiased estimators. Теорема не выводит MSE и не требует Gaussian errors.

## Формальная модель

$$
y=X\beta+\varepsilon,
$$

где:

- $y\in\mathbb{R}^n$ — target;
- $X\in\mathbb{R}^{n\times p}$ — design matrix, включая intercept column при необходимости;
- $\beta\in\mathbb{R}^p$ — неизвестные коэффициенты;
- $\varepsilon\in\mathbb{R}^n$ — ошибки.

OLS:

$$
\widehat{\beta}_{\text{OLS}}
=(X^\top X)^{-1}X^\top y
$$

при полном column rank $X$.

## Предположения теоремы

### Линейность по параметрам

Conditional mean корректно задан как $X\beta$.

### Exogeneity

$$
\mathbb{E}[\varepsilon\mid X]=0.
$$

Признаки не несут систематической информации об omitted error. Нарушение из-за omitted variables, simultaneity или measurement error обычно создаёт bias.

### Full column rank

$$
\operatorname{rank}(X)=p.
$$

Нет exact multicollinearity; коэффициенты идентифицируемы.

### Spherical error covariance

$$
\operatorname{Var}(\varepsilon\mid X)=\sigma^2 I.
$$

Errors имеют общую variance и не коррелируют между observations.

## Что именно гарантируется

Рассмотрим linear estimator $\widetilde{\beta}=Ay$, unbiased при заданном $X$. Gauss–Markov говорит:

$$
\operatorname{Var}(\widetilde{\beta}\mid X)
-\operatorname{Var}(\widehat{\beta}_{\text{OLS}}\mid X)
$$

positive semidefinite. Значит никакой другой linear unbiased estimator не имеет меньшую variance во всех направлениях.

Это свойство coefficient estimation, а не утверждение, что OLS всегда лучший predictive algorithm или causal estimator.

## Почему это отдельная ветка от MSE

Squared error для Linear Regression можно получить из Gaussian likelihood:

$$
\varepsilon_i\overset{\text{iid}}{\sim}\mathcal{N}(0,\sigma^2)
\quad\Rightarrow\quad
\text{MLE}\equiv\text{OLS}.
$$

Gauss–Markov отвечает на другой вопрос: при каких moment assumptions OLS наиболее efficient среди linear unbiased estimators. Gaussianity для BLUE не нужна; она нужна для точного small-sample inference в классической форме.

## Если homoscedasticity нарушена

При:

$$
\operatorname{Var}(\varepsilon\mid X)=\Omega\ne\sigma^2 I
$$

OLS при exogeneity остаётся unbiased/consistent, но обычно уже не BLUE, а naive standard errors неверны.

Варианты:

- heteroscedasticity-robust standard errors для inference;
- cluster-robust SE при group dependence;
- generalized/weighted least squares при известной или хорошо оценённой covariance structure;
- изменение model specification, если variance pattern сигнализирует о неверной форме.

## Если exogeneity нарушена

Robust standard errors не устраняют bias коэффициентов. Нужны:

- дополнительные confounders;
- fixed effects или difference designs;
- instrumental variables;
- randomized experiment;
- другая causal identification strategy.

## Связи

- [[Likelihood MLE and MAP]] — Gaussian likelihood объясняет squared error, но не Gauss–Markov.
- [[Linear Algebra for ML]] — OLS является projection на column space $X$.
- [[Expectation Variance Covariance and Correlation]] — assumptions задаются через conditional mean и covariance errors.
- [[Hypothesis Testing and Confidence Intervals]] — inference зависит от корректного standard error.
