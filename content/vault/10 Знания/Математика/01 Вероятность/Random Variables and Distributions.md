---
title: Random Variables and Distributions
type: concept
area: math
status: active
aliases:
  - Случайные величины и распределения
  - Probability distributions
tags:
  - math/probability
  - ml/foundations
math_depth: 2
id: concept.math.random-variables-and-distributions
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Random Variables and Distributions

## Идея за 30 секунд

Случайная величина переводит случайный исход в число, а распределение описывает, какие значения возможны и насколько они вероятны. В ML распределение связывает наблюдаемые данные с предположениями модели: Bernoulli естественно описывает бинарный target, Gaussian — непрерывный шум, Poisson — число событий за интервал. Выбор распределения определяет likelihood и тем самым часто определяет loss.

## Зачем нужно

Без языка распределений трудно объяснить:

- почему Logistic Regression приводит к Binary Cross-Entropy;
- почему Gaussian noise приводит к squared error;
- что именно моделирует variance;
- чем вероятность события отличается от density;
- какие предположения стоят за estimator и confidence interval.

## Случайная величина

Случайная величина $X$ — функция, которая каждому исходу эксперимента ставит в соответствие число. Она бывает:

- **дискретной**: принимает конечное или счётное множество значений;
- **непрерывной**: принимает значения на интервале.

Для дискретной величины probability mass function:

$$
p_X(x)=P(X=x), \qquad \sum_x p_X(x)=1.
$$

Для непрерывной величины probability density function:

$$
P(a \le X \le b)=\int_a^b f_X(x)\,dx,
\qquad
\int_{-\infty}^{\infty}f_X(x)\,dx=1.
$$

Здесь $p_X(x)$ — вероятность конкретного дискретного значения, а $f_X(x)$ — density. Для непрерывной величины обычно $P(X=x)=0$, хотя $f_X(x)$ может быть больше нуля.

CDF объединяет оба случая:

$$
F_X(x)=P(X\le x).
$$

Она монотонно растёт от $0$ до $1$ и удобна для квантилей, p-values и проверки распределения.

## Совместное, marginal и conditional distribution

Joint distribution описывает пару величин:

$$
p_{X,Y}(x,y)=P(X=x,Y=y).
$$

Marginal distribution получается суммированием или интегрированием по другой величине:

$$
p_X(x)=\sum_y p_{X,Y}(x,y).
$$

Conditional distribution фиксирует информацию о другой величине:

$$
p_{X\mid Y}(x\mid y)=\frac{p_{X,Y}(x,y)}{p_Y(y)},
\qquad p_Y(y)>0.
$$

Это не просто обозначения: supervised learning обычно моделирует $p(y\mid x)$ или некоторую характеристику этого условного распределения.

## Bernoulli distribution

Если $Y\in\{0,1\}$ и $P(Y=1)=p$, то:

$$
P(Y=y)=p^y(1-p)^{1-y}, \qquad y\in\{0,1\}.
$$

$p$ — вероятность положительного класса. Среднее и variance:

$$
\mathbb{E}[Y]=p,
\qquad
\operatorname{Var}(Y)=p(1-p).
$$

Bernoulli — probabilistic owner бинарного наблюдения. Если модель выдаёт $p_i=P(Y_i=1\mid x_i)$, произведение Bernoulli probabilities по объектам даёт likelihood, а отрицательный log-likelihood — BCE.

## Binomial distribution

Если провести $n$ независимых Bernoulli trials с одинаковой вероятностью успеха $p$, число успехов $K$ имеет:

$$
P(K=k)=\binom{n}{k}p^k(1-p)^{n-k}.
$$

Предположения важны: фиксированное $n$, независимость trials и общий $p$. При heterogeneity или зависимости variance может оказаться выше binomial expectation.

## Gaussian distribution и Gaussian noise

Нормальное распределение:

$$
X\sim\mathcal{N}(\mu,\sigma^2),
$$

$$
f(x)=\frac{1}{\sqrt{2\pi\sigma^2}}
\exp\left(
-\frac{(x-\mu)^2}{2\sigma^2}
\right).
$$

$\mu$ задаёт центр, $\sigma^2$ — variance. Gaussian часто возникает как приближение суммы многих малых эффектов и как модель аддитивного шума:

$$
Y=f(X)+\varepsilon,
\qquad
\varepsilon\sim\mathcal{N}(0,\sigma^2).
$$

При независимом шуме с одинаковой variance maximum likelihood для среднего приводит к minimization суммы квадратов residuals. Если variance зависит от объекта, естественным становится weighted least squares; при тяжёлых хвостах squared error может быть неустойчив.

## Poisson и Exponential

Poisson моделирует число событий за фиксированный exposure:

$$
P(K=k)=\frac{\lambda^k e^{-\lambda}}{k!},
\qquad
\mathbb{E}[K]=\operatorname{Var}(K)=\lambda.
$$

Если наблюдаемая variance намного выше mean, простой Poisson недооценивает uncertainty; возможны overdispersion и Negative Binomial.

Exponential distribution часто моделирует время до события при постоянной hazard rate:

$$
f(t)=\lambda e^{-\lambda t}, \qquad t\ge 0.
$$

Memoryless property удобна, но сильна: реальный hazard часто меняется со временем.

## Что если предположения нарушены

- Неверное distribution family даёт неверный loss или некалиброванную uncertainty.
- Зависимые observations делают произведение individual likelihoods некорректным.
- Heavy tails увеличивают влияние выбросов при Gaussian assumption.
- Heteroscedasticity не обязательно портит point prediction, но меняет efficiency и standard errors.
- Class imbalance не отменяет Bernoulli model; оно влияет на sampling, threshold и интерпретацию metrics.

## Связи

- [[Expectation Variance Covariance and Correlation]] — summary characteristics распределения и зависимостей.
- [[Conditional Probability and Bayes Theorem]] — как обновлять вероятности при новой информации.
- [[Likelihood MLE and MAP]] — как из distribution assumption получается objective модели.
- [[LLN CLT and Standard Error]] — как распределение выборки связано с uncertainty estimator.
