---
title: Logistic Regression
type: concept
area: ml
status: active
aliases:
  - Логистическая регрессия
  - Logit model
tags:
  - ml/classical
  - ml/linear-models
  - ml/classification
math_depth: 2
id: concept.ml.logistic-regression
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Logistic Regression

## Идея за 30 секунд

Logistic Regression задаёт linear model для log-odds положительного класса. Sigmoid переводит score в число от $0$ до $1$. При Bernoulli target maximum likelihood приводит ровно к Binary Cross-Entropy / LogLoss. Threshold не обучается внутри этой likelihood-модели: его выбирают отдельно по costs и validation data.

## Формальная модель

Linear score:

$$
z_i=w^\top x_i+b.
$$

Sigmoid:

$$
p_i
=P(Y_i=1\mid x_i)
=\sigma(z_i)
=\frac{1}{1+e^{-z_i}}.
$$

Log-odds:

$$
\log\frac{p_i}{1-p_i}=w^\top x_i+b.
$$

Поэтому boundary $p=0.5$ эквивалентна $w^\top x+b=0$ и линейна в исходном feature space.

## Почему Bernoulli приводит к LogLoss

Для $y_i\in\{0,1\}$:

$$
P(Y_i=y_i\mid x_i)
=p_i^{y_i}(1-p_i)^{1-y_i}.
$$

При условной независимости observations:

$$
\mathcal{L}(w,b)
=\prod_{i=1}^{n}
p_i^{y_i}(1-p_i)^{1-y_i}.
$$

Log-likelihood:

$$
\ell(w,b)
=\sum_{i=1}^{n}
\left[
y_i\log p_i+(1-y_i)\log(1-p_i)
\right].
$$

MLE максимизирует $\ell$; эквивалентно minimization:

$$
\operatorname{LogLoss}
=-\frac{1}{n}\sum_{i=1}^{n}
\left[
y_i\log p_i+(1-y_i)\log(1-p_i)
\right].
$$

Так появляется BCE: Bernoulli distribution → likelihood → MLE → log-likelihood → negative average → LogLoss.

## Почему sigmoid удобна

Производная loss по logit особенно проста:

$$
\frac{\partial \ell_i^{\text{BCE}}}{\partial z_i}
=p_i-y_i.
$$

Prediction выше label толкает score вниз, ниже label — вверх. С fused implementation вроде `BCEWithLogitsLoss` вычисления делают через stable log-sum-exp, не через отдельный sigmoid и `log`.

## Interpretation coefficients

При фиксированных остальных features:

$$
e^{w_j}
$$

— multiplicative change odds при увеличении $x_j$ на единицу. Это зависит от units, specification и correlations; causal interpretation требует отдельного identification.

Scaling не обязателен для самой sigmoid, но важен для:

- optimization conditioning;
- сопоставимого regularization;
- интерпретации magnitude coefficients.

## Threshold и costs

Probability model и decision rule — разные уровни:

$$
\widehat{y}
=\mathbb{1}[p\ge t].
$$

Threshold $t$ выбирают на validation:

- по business cost false positive/false negative;
- под constraint precision или recall;
- по expected utility;
- с учётом capacity downstream process.

Threshold $0.5$ оптимален только при конкретных symmetric costs и корректно calibrated probabilities.

## Assumptions и failure modes

- Log-odds должен быть примерно linear в выбранных features; nonlinear effects требуют transformations/splines/interactions.
- Perfect separation уводит unregularized coefficients к бесконечности.
- Multicollinearity делает coefficients unstable.
- Class weights/resampling меняют effective training distribution; raw score может потребовать calibration.
- Dataset shift меняет calibration и optimal threshold.
- Independent-row likelihood неверно отражает uncertainty при grouped/temporal dependence.

## Когда модель сильна

- небольшой или средний dataset;
- sparse text/OHE;
- нужен быстрый baseline;
- важны latency и explainability;
- relationship близка к linear in log-odds;
- сложная model даёт малый incremental gain.

## Связи

- [[Random Variables and Distributions]] — Bernoulli observation model.
- [[Likelihood MLE and MAP]] — полный вывод BCE и regularized MAP.
- [[Gradients Chain Rule and Optimization]] — gradient по logit и optimization.
- [[Regularization]] — L1/L2 стабилизируют coefficients.
- [[ML Metrics and Threshold Selection]] — ranking, calibration и threshold metrics.
- [[ML Basics and Linear Models — Interview]] — короткие вопросы и ответы.
