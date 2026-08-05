---
title: Optimization and Regularization in Deep Learning
id: concept.dl.optimization-and-regularization-in-deep-learning
type: concept
area: dl
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Оптимизация и регуляризация DL
tags:
- dl/optimization
- dl/regularization
math_depth: 2
---

# Optimization and Regularization in Deep Learning

## Gradient descent

Update:

$$
\theta_{t+1}=\theta_t-\eta\nabla_\theta L.
$$

Learning rate $\eta$ слишком мал — training медленный; слишком велик — loss oscillates/diverges.

## Mini-batch SGD

Gradient по batch является noisy estimate full gradient. Noise может помогать exploration, но делает curves неровными.

## Momentum

$$
v_t=\beta v_{t-1}+g_t,
\qquad
\theta_{t+1}=\theta_t-\eta v_t.
$$

Momentum сглаживает direction и ускоряет движение по устойчивому gradient.

## Adam и AdamW

Adam хранит exponential averages first/second moments и адаптирует шаг по parameters. AdamW отделяет weight decay от gradient update, поэтому чаще является правильным default для Transformers.

Adam не гарантирует лучшую generalization и не устраняет необходимость tuning learning rate.

## Learning-rate schedules

- step/exponential decay;
- cosine decay;
- warmup;
- ReduceLROnPlateau;
- one-cycle.

Warmup уменьшает риск нестабильных первых steps. Scheduler step должен вызываться в правильной частоте: per batch или per epoch согласно implementation.

## Weight decay

Штрафует большие weights, но не все parameters одинаково. Bias и normalization parameters часто исключают из decay в Transformer setups.

## Dropout

Во время train случайно зануляет activations и масштабирует оставшиеся. В eval отключается. Dropout не должен работать при validation/inference.

## Normalization

BatchNorm использует batch statistics и running estimates; зависит от batch size и режима. LayerNorm нормализует features внутри sample/token и не зависит от batch statistics.

## Early stopping

Сохраняйте checkpoint с лучшей validation metric, а не последнюю epoch. Patience задаёт число epochs без улучшения.

## Gradient clipping

```python
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
```

Полезен при exploding gradients, особенно RNN. Он лечит symptom, поэтому всё равно проверяйте learning rate/data.

## Data augmentation

Для images: crops, flips, color transforms с сохранением label. Для text/табличных данных augmentation сложнее и легко меняет смысл.

## Диагностика curves

- train loss не падает → bug, lr, capacity, data;
- train падает, val нет → overfit/shift;
- обе oscillate → lr/batch/normalization;
- sudden NaN → overflow, invalid input, exploding gradients;
- val лучше train → active dropout/augmentation или difference modes.

## Визуализация

Компонент `optimizer-landscape-lab`:

- 2D loss landscape;
- SGD/momentum/Adam paths;
- learning-rate slider;
- weight decay;
- train/val curves;
- scheduler timeline.

## Частые ошибки

- AdamW weight_decay как обычный L2 в коде без понимания;
- scheduler вызван не там;
- no warmup при unstable large model;
- BatchNorm in eval forgotten;
- early stopping по test;
- clipping до unscale в AMP;
- regularization вместо исправления leakage.

## Связи

- [[Neural Networks and Backpropagation]]
- [[Training Evaluation and Inference in PyTorch]]
- [[DL Debugging and Experiment Design]]
