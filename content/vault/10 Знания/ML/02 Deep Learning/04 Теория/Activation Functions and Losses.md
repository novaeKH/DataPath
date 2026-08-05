---
title: Activation Functions and Losses
id: concept.dl.activations-losses
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
- Активации и функции потерь
tags:
- dl/foundations
- dl/loss
math_depth: 2
---

# Activation Functions and Losses

## Зачем нужна activation

Стек linear layers без nonlinear activation эквивалентен одному linear transformation. Activation позволяет сети представлять nonlinear functions.

## ReLU

$$
\operatorname{ReLU}(x)=\max(0,x).
$$

Плюсы: простая, быстрая, не насыщается для positive values. Минус: neuron может постоянно оказаться в negative region и получать zero gradient.

## Leaky ReLU, GELU, SiLU

Leaky ReLU оставляет малый slope слева. GELU и SiLU плавно gates input и часто используются в Transformers/modern networks.

Выбор activation обычно вторичен относительно data, architecture и optimization, но должен соответствовать проверенной implementation.

## Output layer и loss должны совпадать

### Binary classification

Output: один logit `(B, 1)` или `(B,)`.

```python
criterion = torch.nn.BCEWithLogitsLoss()
loss = criterion(logits, targets.float())
```

`BCEWithLogitsLoss` объединяет sigmoid и BCE численно устойчиво. Не применяйте sigmoid перед loss.

### Multiclass classification

Output: logits `(B, C)`, target class indices `(B,)` типа long.

```python
criterion = torch.nn.CrossEntropyLoss()
loss = criterion(logits, targets)
```

Не применяйте softmax до CrossEntropyLoss.

### Multilabel

Output `(B, C)`, binary target `(B, C)`, `BCEWithLogitsLoss`.

### Regression

Output соответствует target shape. Loss:

- MSE для squared error;
- L1/MAE для robustness;
- SmoothL1/Huber как компромисс.

## Logits, probabilities, predictions

Logit — неограниченный score. Probability:

```python
prob = torch.sigmoid(logit)
probs = torch.softmax(logits, dim=1)
```

Class prediction:

```python
pred = logits.argmax(dim=1)
```

Loss обучается на logits, metrics часто используют probabilities/classes.

## Cross-entropy как likelihood

Для правильного класса $y$:

$$
L=-\log p_y.
$$

Модель сильно штрафуется, если присваивает правильному классу малую probability.

## Class weights

Loss можно взвешивать при imbalance, но это меняет objective и calibration. Weight выбирается на train/validation, test prevalence сохраняется естественной.

## Reduction

Loss может быть mean, sum или per-example. При gradient accumulation нужно понимать scaling, чтобы effective gradient не зависел случайно от micro-batch count.

## Визуализация

Компонент `activation-loss-explorer`:

- graphs ReLU/GELU/Sigmoid;
- draggable logit;
- probability;
- BCE/CE penalty;
- correct vs confident wrong;
- binary/multiclass shape panel.

## Частые ошибки

- sigmoid перед BCEWithLogitsLoss;
- softmax перед CrossEntropyLoss;
- one-hot target для CrossEntropyLoss без нужды;
- неверный axis softmax;
- MSE для classification по probabilities;
- target dtype/shape mismatch;
- сравнивать train loss разных reductions.

## Связи

- [[Tensors Shapes and Linear Layers]]
- [[Neural Networks and Backpropagation]]
- [[Likelihood MLE and MAP]]
