---
title: Gradient Boosting
type: concept
area: ml
status: active
aliases:
  - Градиентный бустинг
  - Gradient Boosted Trees
  - GBDT
tags:
  - ml/classical
  - ml/ensembles
math_depth: 2
id: concept.ml.gradient-boosting
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Gradient Boosting

## Идея за 30 секунд

Gradient Boosting строит additive model последовательно. На каждом шаге новый weak learner приближает negative gradient текущего loss по predictions — pseudo-residuals. Затем его contribution добавляется с learning rate. Для squared error pseudo-residual совпадает с обычным residual; для других losses это уже gradient signal.

## Additive model

$$
F_M(x)
=F_0(x)
+\sum_{m=1}^{M}
\eta\,\gamma_m h_m(x),
$$

где:

- $F_0$ — initial constant prediction;
- $h_m$ — base learner, обычно shallow tree;
- $\gamma_m$ — step/leaf values;
- $\eta$ — learning rate;
- $M$ — number of iterations.

## От loss к pseudo-residuals

Для differentiable loss $L(y,F(x))$ на iteration $m$:

$$
r_{im}
=-
\left.
\frac{\partial L(y_i,F(x_i))}
{\partial F(x_i)}
\right|_{F=F_{m-1}}.
$$

Это direction, который локально сильнее всего уменьшает loss в prediction space.

Алгоритм:

1. вычислить current predictions $F_{m-1}(x_i)$;
2. посчитать pseudo-residuals $r_{im}$;
3. fit tree $h_m(x)$ на pairs $(x_i,r_{im})$;
4. оценить leaf values/step $\gamma_m$;
5. update:

$$
F_m(x)
=F_{m-1}(x)
+\eta\gamma_mh_m(x).
$$

6. повторять до early stopping/limit.

## Squared error

$$
L(y,F)=\frac{1}{2}(y-F)^2.
$$

Тогда:

$$
-\frac{\partial L}{\partial F}
=y-F.
$$

Pseudo-residual равен обычному residual. Отсюда популярная, но неполная формулировка «каждое дерево учится на ошибках». Общий метод учится на negative gradients выбранного loss.

## Binary LogLoss

Если $F$ — logit и $p=\sigma(F)$:

$$
L(y,F)
=-\left[
y\log p+(1-y)\log(1-p)
\right],
$$

$$
-\frac{\partial L}{\partial F}
=y-p.
$$

Tree исправляет probability error в logit space.

## Почему обучение последовательное

Gradient следующего step зависит от current ensemble. Trees нельзя обучить независимо и просто усреднить, как в bagging.

Это цепочка:

```text
loss
→ gradient по current prediction
→ pseudo-residual
→ tree approximation
→ sequential correction
```

## Tree complexity и interactions

Depth base tree ограничивает interaction order:

- stumps моделируют mainly additive effects;
- deeper trees ловят higher-order interactions;
- слишком deep trees быстро снижают train loss и повышают variance.

Boosting не требует каждому tree быть сильным; важна серия small corrections.

## Learning rate и iterations

Small $\eta$ требует больше iterations и часто даёт smoother generalization. Large $\eta$ быстрее fit, но может overshoot/overfit.

Связка `learning_rate × best_iteration` важнее каждого parameter отдельно. Используют большое upper bound iterations и early stopping на validation metric.

## Row/feature subsampling

Stochastic boosting обучает steps на subsample rows/features. Это:

- снижает correlation successive corrections;
- ускоряет fit;
- добавляет regularization;
- увеличивает stochastic noise.

Sampling strategy должна сохранять group/time logic и не исправляет leakage.

## Loss, training metric и business metric

Differentiable loss нужен optimization. Business metric может быть non-differentiable: F1, precision@k, expected profit.

Правильный порядок:

1. выбрать loss, согласованный с prediction semantics;
2. monitor validation metric;
3. отдельно выбрать threshold/ranking policy по business objective.

## Failure modes

- tuning по test;
- слишком complex trees при малых data;
- early stopping по noisy/неподходящей metric;
- интерпретировать raw score как calibrated probability;
- target encoding до folds;
- extrapolation ожидать как у linear model;
- считать feature importance causal;
- говорить, что pseudo-residual всегда равен $y-\widehat{y}$.

## Связи

- [[Gradients Chain Rule and Optimization]] — negative gradient и curvature.
- [[Decision Trees]] — base learner.
- [[Bagging and Random Forest]] — parallel averaging vs sequential correction.
- [[XGBoost LightGBM and CatBoost]] — инженерные и regularized реализации.
- [[Likelihood MLE and MAP]] — loss часто является NLL.
- [[Gradient Boosting — Interview]] — краткая проверка.
