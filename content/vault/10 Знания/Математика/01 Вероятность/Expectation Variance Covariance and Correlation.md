---
title: Expectation Variance Covariance and Correlation
type: concept
area: math
status: active
aliases:
  - Математическое ожидание дисперсия ковариация корреляция
  - Moments and covariance
tags:
  - math/probability
  - math/statistics
math_depth: 2
id: concept.math.expectation-variance-covariance-and-correlation
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Expectation Variance Covariance and Correlation

## Идея за 30 секунд

Expectation описывает центр распределения, variance — типичный квадрат отклонения от центра, covariance — совместное линейное изменение двух величин, correlation — нормированную covariance. Эти величины нужны не только для EDA: они определяют sampling uncertainty, Gaussian models, PCA и поведение линейных estimators.

## Математическое ожидание

Для дискретной величины:

$$
\mathbb{E}[X]=\sum_x x\,P(X=x).
$$

Для непрерывной:

$$
\mathbb{E}[X]=\int_{-\infty}^{\infty}x f_X(x)\,dx.
$$

Expectation — долгосрочный средний результат мысленного повторения эксперимента. Он не обязан быть возможным наблюдением: среднее броска кубика равно $3.5$.

Линейность expectation не требует независимости:

$$
\mathbb{E}[aX+bY+c]
=a\mathbb{E}[X]+b\mathbb{E}[Y]+c.
$$

## Variance и standard deviation

$$
\operatorname{Var}(X)
=\mathbb{E}\left[(X-\mu)^2\right]
=\mathbb{E}[X^2]-\mu^2,
\qquad \mu=\mathbb{E}[X].
$$

Variance измеряется в квадрате исходных единиц, поэтому для интерпретации чаще используют:

$$
\operatorname{SD}(X)=\sqrt{\operatorname{Var}(X)}.
$$

Для констант $a,b$:

$$
\operatorname{Var}(aX+b)=a^2\operatorname{Var}(X).
$$

Сдвиг не меняет разброс, масштаб умножает standard deviation на $|a|$.

## Covariance

$$
\operatorname{Cov}(X,Y)
=\mathbb{E}\left[(X-\mu_X)(Y-\mu_Y)\right].
$$

- положительная covariance: большие значения $X$ обычно сопровождаются большими $Y$;
- отрицательная: большие $X$ сопровождаются меньшими $Y$;
- около нуля: нет выраженной **линейной** совместной вариации.

Нулевая covariance не означает независимость. Независимость обычно влечёт zero covariance при существующих moments, но обратное неверно.

Variance линейной комбинации показывает, почему covariance важна:

$$
\operatorname{Var}(aX+bY)
=a^2\operatorname{Var}(X)
+b^2\operatorname{Var}(Y)
+2ab\operatorname{Cov}(X,Y).
$$

## Correlation

$$
\rho_{X,Y}
=\frac{\operatorname{Cov}(X,Y)}
{\sigma_X\sigma_Y},
\qquad \sigma_X>0,\;\sigma_Y>0.
$$

Correlation безразмерна и лежит между $-1$ и $1$. Она сравнима между парами признаков, но по-прежнему измеряет только линейную зависимость и чувствительна к выбросам.

Correlation не доказывает causal effect. Общая причина, selection bias или временной тренд могут породить сильную связь без прямого влияния.

## Выборочные оценки

Для sample $x_1,\ldots,x_n$:

$$
\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i,
$$

$$
s^2=\frac{1}{n-1}\sum_{i=1}^{n}(x_i-\bar{x})^2.
$$

Деление на $n-1$ компенсирует потерю одной degree of freedom после оценки $\bar{x}$ и делает $s^2$ unbiased estimator population variance при iid sampling. Для prediction или maximum likelihood Gaussian variance может использоваться другой denominator; важно назвать цель оценки.

Sample covariance:

$$
s_{xy}=\frac{1}{n-1}
\sum_{i=1}^{n}(x_i-\bar{x})(y_i-\bar{y}).
$$

## Covariance matrix

Для вектора признаков $X\in\mathbb{R}^d$:

$$
\Sigma
=\mathbb{E}\left[(X-\mu)(X-\mu)^\top\right].
$$

Диагональ $\Sigma$ содержит variances признаков, внедиагональные элементы — pairwise covariances. Матрица симметрична и positive semidefinite:

$$
v^\top\Sigma v\ge 0
$$

для любого $v$. Это выражение равно variance projection $v^\top X$, поэтому не может быть отрицательным.

## Условные expectation и variance

Law of total expectation:

$$
\mathbb{E}[X]=\mathbb{E}\left[\mathbb{E}[X\mid Y]\right].
$$

Law of total variance:

$$
\operatorname{Var}(X)
=\mathbb{E}\left[\operatorname{Var}(X\mid Y)\right]
+\operatorname{Var}\left(\mathbb{E}[X\mid Y]\right).
$$

Общая variance раскладывается на среднюю variability внутри групп и variability групповых средних. Это полезная модель для сегментации, random effects и диагностики Simpson's paradox.

## Что если предположения нарушены

- При temporal, grouped или clustered data обычные sample formulas могут недооценивать uncertainty.
- Heavy tails делают mean и covariance нестабильными; помогают robust statistics или transformations.
- Для nonlinear dependence Pearson correlation может быть около нуля; нужны scatter plot, rank correlation или mutual information.
- Covariance зависит от масштаба, correlation — нет; но scaling не удаляет multicollinearity.

## Связи

- [[Random Variables and Distributions]] — distribution определяет существование и смысл moments.
- [[Conditional Probability and Bayes Theorem]] — conditioning лежит в основе total expectation/variance.
- [[Eigenvalues Covariance Matrix and PCA Foundations]] — PCA ищет направления максимальной variance covariance matrix.
- [[LLN CLT and Standard Error]] — sample mean и variance становятся estimators с sampling distribution.
