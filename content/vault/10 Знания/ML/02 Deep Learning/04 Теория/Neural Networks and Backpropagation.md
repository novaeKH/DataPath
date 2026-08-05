---
title: Neural Networks and Backpropagation
id: concept.dl.neural-networks-and-backpropagation
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
- Нейронные сети и backpropagation
- Backprop
tags:
- dl/foundations
math_depth: 2
---

# Neural Networks and Backpropagation

## Нейронная сеть с нуля

Neural network — композиция differentiable transformations. Простой MLP:

$$
h=\phi(XW_1^\top+b_1),
\qquad
z=hW_2^\top+b_2.
$$

$X$ — batch features, $h$ — hidden representation, $z$ — logits/output.

## Forward pass

Forward pass вычисляет prediction и loss на текущих parameters.

```python
logits = model(features)
loss = criterion(logits, targets)
```

PyTorch одновременно строит computational graph: запоминает operations, нужные для derivatives.

## Gradient

Gradient показывает локальное изменение loss при малом изменении parameter:

$$
\nabla_\theta L.
$$

Optimizer делает шаг примерно в направлении `-gradient`.

## Chain rule

Для композиции:

$$
L=f(g(h(x)))
$$

derivative является произведением local derivatives. Backpropagation эффективно проходит graph в обратном порядке и переиспользует intermediate results.

## Маленький пример

$$
y=wx,\quad L=(y-t)^2.
$$

$$
\frac{\partial L}{\partial w}
=2(wx-t)x.
$$

Если prediction выше target и $x>0$, gradient положительный, gradient descent уменьшит $w$.

## Training step

```python
optimizer.zero_grad(set_to_none=True)
logits = model(features)
loss = criterion(logits, targets)
loss.backward()
optimizer.step()
```

Порядок важен:

1. очистить старые gradients;
2. forward;
3. loss;
4. backward;
5. update.

Gradients по умолчанию накапливаются, поэтому забытый `zero_grad` меняет optimization.

## Epoch, batch, iteration

- sample — один объект;
- batch — группа объектов;
- iteration/step — один update;
- epoch — проход по training dataset.

Batch size влияет на noise gradient, memory и normalization.

## `train()` и `eval()`

```python
model.train()
model.eval()
```

Они переключают Dropout/BatchNorm behavior, но не отключают gradient graph.

Для inference:

```python
model.eval()
with torch.inference_mode():
    logits = model(features)
```

## Vanishing и exploding gradients

Deep composition может уменьшать/увеличивать gradient. Помогают:

- initialization;
- ReLU/GELU;
- normalization;
- residual connections;
- gradient clipping;
- подходящий learning rate;
- gated recurrent units.

## Initialization

Weights не должны быть одинаковыми: иначе neurons учат одно и то же. Xavier/He initialization учитывают fan-in/fan-out и activation.

## Autograd traps

- `.detach()` разрывает graph;
- `.item()` превращает scalar tensor в Python number;
- in-place operation может уничтожить saved value;
- NumPy conversion требует CPU и detach;
- хранение loss tensors в list без `.item()` держит graphs и память.

## Визуализация

Компонент `backprop-computation-graph`:

- nodes forward values;
- local derivatives;
- reverse gradient flow;
- learning-rate step;
- gradient accumulation toggle;
- detach/in-place error examples.

## Минимальный MLP

```python
model = torch.nn.Sequential(
    torch.nn.Linear(20, 64),
    torch.nn.ReLU(),
    torch.nn.Linear(64, 1),
)
```

Parameter count и shapes должны быть понятны до запуска.

## Частые ошибки

- забыть zero_grad;
- validation в `train()`;
- loss на probabilities вместо logits;
- неправильный target dtype;
- accidental detach;
- вычислять metrics с активным graph;
- сохранять не лучший checkpoint;
- сравнивать models на разных splits.

## Связи

- [[Tensors Shapes and Linear Layers]]
- [[Activation Functions and Losses]]
- [[Optimization and Regularization in Deep Learning]]
- [[Training Evaluation and Inference in PyTorch]]
