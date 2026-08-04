---
title: Likelihood MLE and MAP
type: concept
area: math
status: active
aliases:
  - Likelihood log-likelihood MLE MAP
  - Правдоподобие MLE и MAP
  - Maximum Likelihood Estimation
  - Maximum A Posteriori
tags:
  - math/statistics
  - ml/objectives
math_depth: 2
id: concept.math.likelihood-mle-and-map
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Likelihood MLE and MAP

## Идея за 30 секунд

Probability distribution отвечает, какие данные вероятны при фиксированном параметре. Likelihood рассматривает те же выражения как функцию параметра при уже наблюдённых данных. MLE выбирает параметр, который делает данные наиболее правдоподобными; MAP дополнительно учитывает prior. Negative log-likelihood часто и есть знакомый ML loss.

## Probability и likelihood — разные вопросы

Пусть модель задаёт $p(y\mid x,\theta)$. До наблюдения $y$ это probability model по данным при фиксированном $\theta$. После наблюдения dataset $D=\{(x_i,y_i)\}_{i=1}^{n}$ likelihood:

$$
\mathcal{L}(\theta;D)
=\prod_{i=1}^{n}p(y_i\mid x_i,\theta),
$$

если observations условно независимы при $\theta$.

Данные здесь фиксированы, а $\theta$ меняется. Likelihood не является probability distribution по $\theta$ и не обязана интегрироваться в $1$.

## Почему используют log-likelihood

$$
\ell(\theta;D)
=\log\mathcal{L}(\theta;D)
=\sum_{i=1}^{n}\log p(y_i\mid x_i,\theta).
$$

Логарифм:

- превращает произведение в сумму;
- уменьшает численное underflow;
- сохраняет положение maximum, потому что монотонно возрастает;
- делает вклад наблюдений явным.

В ML обычно минимизируют negative log-likelihood:

$$
\operatorname{NLL}(\theta)=-\ell(\theta;D).
$$

## Maximum Likelihood Estimation

$$
\hat{\theta}_{\text{MLE}}
=\arg\max_\theta \mathcal{L}(\theta;D)
=\arg\min_\theta \operatorname{NLL}(\theta).
$$

MLE не говорит, что выбранный параметр «вероятнее» других без prior. Он выбирает parameter value, при котором наблюдённые данные наиболее compatible с model family.

## Bernoulli likelihood приводит к BCE

Для бинарных $y_i\in\{0,1\}$ и прогнозов $p_i=P(Y_i=1\mid x_i,\theta)$:

$$
p(y_i\mid x_i,\theta)
=p_i^{y_i}(1-p_i)^{1-y_i}.
$$

Log-likelihood:

$$
\ell(\theta)
=\sum_{i=1}^{n}
\left[
y_i\log p_i+(1-y_i)\log(1-p_i)
\right].
$$

Negative average log-likelihood:

$$
\operatorname{BCE}
=-\frac{1}{n}\sum_{i=1}^{n}
\left[
y_i\log p_i+(1-y_i)\log(1-p_i)
\right].
$$

То есть BCE не произвольный штраф: она возникает из Bernoulli observation model и MLE. Если labels noisy или observations зависимы, probabilistic interpretation требует пересмотра.

## Gaussian likelihood приводит к squared error

Пусть:

$$
y_i=f_\theta(x_i)+\varepsilon_i,
\qquad
\varepsilon_i\overset{\text{iid}}{\sim}\mathcal{N}(0,\sigma^2).
$$

Тогда с точностью до constants:

$$
-\ell(\theta)
=\frac{1}{2\sigma^2}
\sum_{i=1}^{n}
\left(y_i-f_\theta(x_i)\right)^2+\text{const}.
$$

При общей фиксированной $\sigma^2$ maximization likelihood эквивалентна minimization sum of squared errors. Если variance различается по объектам, возникает weighted squared error; если noise Laplace, MLE приводит к absolute error.

## MAP и prior

Bayes theorem:

$$
p(\theta\mid D)
\propto p(D\mid\theta)p(\theta).
$$

MAP выбирает mode posterior:

$$
\hat{\theta}_{\text{MAP}}
=\arg\max_\theta p(\theta\mid D)
=\arg\min_\theta
\left[
-\log p(D\mid\theta)-\log p(\theta)
\right].
$$

В отличие от MLE, MAP добавляет информацию или предпочтение через prior.

### Gaussian prior приводит к L2

Если независимо:

$$
\theta_j\sim\mathcal{N}(0,\tau^2),
$$

то:

$$
-\log p(\theta)
=\frac{1}{2\tau^2}\sum_j\theta_j^2+\text{const}.
$$

Это L2 penalty. Чем меньше $\tau^2$, тем сильнее prior стягивает параметры к нулю.

### Laplace prior приводит к L1

Если:

$$
p(\theta_j)\propto
\exp\left(-\frac{|\theta_j|}{b}\right),
$$

то:

$$
-\log p(\theta)
=\frac{1}{b}\sum_j|\theta_j|+\text{const}.
$$

Это L1 penalty. Угол objective в нуле способствует exact zeros, хотя sparsity также зависит от design matrix и optimization.

## Предположения и ограничения

- Product likelihood предполагает conditional independence или корректно заданную joint model.
- MLE/MAP оптимальны только относительно выбранной model family.
- MAP зависит от parameterization: mode может измениться при nonlinear reparameterization.
- Сильный prior полезен при малых данных, но вносит bias.
- Regularization coefficient соответствует отношению noise scale и prior scale; это не просто безразмерная «ручка».

## Связи

- [[Random Variables and Distributions]] — distribution assumption задаёт likelihood.
- [[Conditional Probability and Bayes Theorem]] — MAP использует posterior.
- [[Gradients Chain Rule and Optimization]] — большинство MLE/MAP objectives решается градиентно.
- [[Gauss-Markov Theorem]] — отдельный frequentist результат про linear unbiased estimators, не источник squared loss.
