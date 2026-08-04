---
title: Optimization and Regularization in Deep Learning
type: concept
area: dl
status: active
aliases:
  - Оптимизация и регуляризация нейросетей
  - SGD Momentum Adam AdamW
tags:
  - dl/optimization
  - dl/training
math_depth: 2
id: concept.dl.optimization-and-regularization-in-deep-learning
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Optimization and Regularization in Deep Learning

## Идея за 30 секунд

Backprop вычисляет gradients; optimizer решает, как ими обновлять parameters. SGD следует noisy gradient, Momentum сглаживает направление, Adam нормирует updates по running moments, AdamW отдельно применяет weight decay. Initialization, normalization, residual paths, dropout и early stopping управляют gradient flow и generalization.

## SGD

Для mini-batch gradient $g_t$:

$$
\theta_{t+1}
=\theta_t-\eta g_t.
$$

$\eta$ — learning rate. Mini-batch noise делает update дешёвым и stochastic.

- слишком большой $\eta$ → divergence/oscillation;
- слишком маленький → slow training/plateau;
- schedule меняет optimization phase, поэтому best learning rate не отделим от batch size и duration.

## Momentum

$$
v_t=\mu v_{t-1}+g_t,
$$

$$
\theta_{t+1}
=\theta_t-\eta v_t.
$$

Momentum накапливает consistent direction и сглаживает batch noise. В narrow curved valley он уменьшает zig-zag, но может overshoot при плохом learning rate.

## Adam

First and second raw moments:

$$
m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,
$$

$$
v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2.
$$

После bias correction:

$$
\widehat{m}_t=\frac{m_t}{1-\beta_1^t},
\qquad
\widehat{v}_t=\frac{v_t}{1-\beta_2^t}.
$$

Update:

$$
\theta_{t+1}
=\theta_t
-\eta
\frac{\widehat{m}_t}
{\sqrt{\widehat{v}_t}+\varepsilon}.
$$

Adam адаптирует scale update по coordinates. Это помогает sparse/noisy gradients, но не устраняет необходимость schedule, validation и weight-decay policy.

## AdamW и weight decay

Naive L2 добавляет $\lambda\theta$ к gradient loss. В adaptive optimizer это не эквивалентно одинаковому multiplicative shrinkage parameters.

AdamW decouples:

$$
\theta
\leftarrow
(1-\eta\lambda)\theta
-\eta\cdot\operatorname{AdamUpdate}.
$$

Bias и normalization scale часто исключают из weight decay; policy должна быть явной.

## Initialization

Цель — сохранить reasonable variance activations/gradients по depth.

### Xavier/Glorot

Для symmetric activations:

$$
\operatorname{Var}(W)
\approx
\frac{2}{d_{\text{in}}+d_{\text{out}}}.
$$

### He/Kaiming

Для ReLU-like:

$$
\operatorname{Var}(W)
\approx
\frac{2}{d_{\text{in}}}.
$$

Это variance heuristics при assumptions про independent activations/weights. Residual, normalization и modern architectures меняют точную dynamics.

## Normalization

### Batch Normalization

Нормирует по batch statistics для channel/feature:

$$
\widehat{x}
=\frac{x-\mu_B}
{\sqrt{\sigma_B^2+\varepsilon}},
\qquad
y=\gamma\widehat{x}+\beta.
$$

Training использует batch stats и обновляет running stats; eval — running stats. Small/non-iid batches могут быть проблемой.

### Layer Normalization

Нормирует features внутри одного token/object. Не зависит от других samples batch и стандартна в Transformers.

Normalization не просто «борется с covariate shift»: она меняет parameterization, scale gradients и optimization geometry.

## Dropout

Training:

$$
\widetilde{h}
=\frac{m\odot h}{1-p},
\qquad
m_j\sim\operatorname{Bernoulli}(1-p).
$$

Inverted scaling сохраняет expectation activations. В eval dropout выключен.

Dropout добавляет noise/regularization, но:

- не всегда полезен вместе с сильной normalization/data augmentation;
- слишком большой $p$ создаёт underfit;
- stochastic predictions в eval часто означают забытый `model.eval()`.

## Early stopping

Выбирает checkpoint по validation metric. Это regularization через ограничение optimization trajectory.

Правила:

- monitor metric согласована с task;
- best weights сохраняются;
- patience учитывает noise;
- final test не участвует;
- после изменения split/metric best iteration оценивается заново.

## Gradient clipping

Global norm clipping:

$$
g
\leftarrow
g\cdot
\min\left(1,\frac{c}{\lVert g\rVert_2}\right).
$$

Полезно для rare spikes/RNN, но постоянно active clipping может скрывать слишком высокий learning rate, unstable loss или bad data.

## Диагностика

Смотреть:

- train/validation loss curves;
- gradient norms;
- activation/weight statistics;
- learning rate;
- fraction zero/saturated activations;
- best checkpoint, not last;
- per-segment metrics;
- NaN/Inf location.

## Связи

- [[Neural Networks and Backpropagation]] — откуда берутся gradients.
- [[Gradients Chain Rule and Optimization]] — conditioning, curvature и stochastic gradients.
- [[Regularization]] — priors, shrinkage и bias–variance.
- [[Transformer and Language Modeling]] — LayerNorm, residuals и AdamW.
- [[Deep Learning — Interview]] — короткие ответы.
