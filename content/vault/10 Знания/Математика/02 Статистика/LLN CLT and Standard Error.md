---
title: LLN CLT and Standard Error
type: concept
area: math
status: active
aliases:
  - Закон больших чисел центральная предельная теорема и standard error
  - Law of Large Numbers
  - Central Limit Theorem
  - CLT
tags:
  - math/statistics
  - math/probability
math_depth: 2
id: concept.math.lln-clt-and-standard-error
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# LLN CLT and Standard Error

## Идея за 30 секунд

Law of Large Numbers объясняет, почему sample average приближается к population expectation при росте выборки. Central Limit Theorem описывает форму ошибки sample average: после нормировки она часто становится приблизительно Gaussian. Standard error измеряет разброс estimator между возможными повторными выборками, а не разброс отдельных наблюдений.

## Зачем нужно

Эти идеи стоят за:

- confidence intervals;
- t-tests и z-tests;
- оценкой uncertainty метрик;
- расчётом sample size;
- bootstrap intuition;
- пониманием, почему большая выборка уменьшает noise, но не устраняет bias.

## Law of Large Numbers

Пусть $X_1,\ldots,X_n$ — iid observations с конечным expectation $\mu$. Sample mean:

$$
\bar{X}_n=\frac{1}{n}\sum_{i=1}^{n}X_i.
$$

Weak LLN утверждает:

$$
\bar{X}_n \xrightarrow{P} \mu.
$$

Это означает, что вероятность заметного отклонения $\bar{X}_n$ от $\mu$ стремится к нулю при $n\to\infty$.

LLN не говорит, что:

- каждый следующий observation близок к $\mu$;
- sample mean монотонно приближается к $\mu$;
- данные автоматически становятся representative;
- systematic bias исчезает от большого $n$.

Большая biased выборка стабильно оценивает не ту population.

## Sampling distribution

Estimator — случайная величина, потому что меняется от выборки к выборке. Sampling distribution — распределение estimator при мысленном повторении sampling procedure.

Для iid observations с variance $\sigma^2$:

$$
\operatorname{Var}(\bar{X}_n)=\frac{\sigma^2}{n}.
$$

Standard error mean:

$$
\operatorname{SE}(\bar{X}_n)=\frac{\sigma}{\sqrt{n}}.
$$

На практике $\sigma$ неизвестна и заменяется sample standard deviation $s$:

$$
\widehat{\operatorname{SE}}(\bar{X}_n)=\frac{s}{\sqrt{n}}.
$$

Чтобы уменьшить standard error вдвое, при прочих равных нужно примерно в четыре раза больше независимых observations.

## Central Limit Theorem

Для iid observations с конечными $\mu$ и $\sigma^2$:

$$
\frac{\sqrt{n}(\bar{X}_n-\mu)}{\sigma}
\xrightarrow{d}
\mathcal{N}(0,1).
$$

Эквивалентная рабочая аппроксимация:

$$
\bar{X}_n
\approx
\mathcal{N}\left(\mu,\frac{\sigma^2}{n}\right)
$$

при достаточно большом $n$.

CLT описывает distribution нормированного **среднего**, а не утверждает, что исходные данные Gaussian.

## Когда «достаточно большое n» не универсально

Скорость convergence зависит от:

- skewness;
- heavy tails;
- редких, но очень больших значений;
- dependence;
- mixture distributions;
- effective sample size.

Для сильно skewed revenue metric даже тысячи observations могут давать плохую normal approximation. Полезны bootstrap, robust estimators или transformation, но каждый метод должен сохранять sampling unit.

## Effective sample size

При grouped или temporal dependence nominal $n$ завышает число независимых единиц. Для положительно autocorrelated time series uncertainty mean выше iid formula.

В A/B test рандомизация по пользователю означает, что clicks одного пользователя нельзя считать независимыми observations для naive standard error. Сначала определяют unit of analysis или применяют cluster-aware estimator.

## Standard deviation и standard error

- Standard deviation: разброс individual observations.
- Standard error: разброс estimator между повторными samples.

Увеличение $n$ обычно уменьшает standard error, но population standard deviation не обязана уменьшаться.

## Что если предположения нарушены

- Dependence требует cluster, block или time-series methods.
- Infinite или крайне нестабильная variance ломает стандартную CLT approximation.
- Non-random sampling создаёт bias, который SE не видит.
- Data leakage может дать маленький empirical SE вокруг неверной оценки.

## Связи

- [[Random Variables and Distributions]] — задаёт distribution и moments observations.
- [[Expectation Variance Covariance and Correlation]] — объясняет variance sample mean.
- [[Hypothesis Testing and Confidence Intervals]] — использует sampling distribution и SE.
- [[Likelihood MLE and MAP]] — у MLE тоже есть sampling distribution и asymptotic uncertainty.
