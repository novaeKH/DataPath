---
title: Tensors Shapes and Linear Layers
id: concept.dl.tensors-shapes-linear-layers
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
- Тензоры формы и линейные слои
tags:
- dl/foundations
- pytorch/tensors
math_depth: 1
---

# Tensors, Shapes and Linear Layers

## Почему всё начинается с shape

Tensor — многомерный массив. В Deep Learning большинство runtime-ошибок возникает из-за неверной формы, dtype или device, а не из-за сложной математики.

Примеры:

- tabular batch: `(batch, features)`;
- image batch: `(batch, channels, height, width)`;
- token batch: `(batch, sequence, hidden)`;
- logits classification: `(batch, classes)`.

## Создание Tensor

```python
import torch

x = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
zeros = torch.zeros(32, 10)
random = torch.randn(32, 10)
```

Проверяйте:

```python
x.shape
x.dtype
x.device
x.requires_grad
```

## Dtype

- features обычно `float32`;
- class labels для CrossEntropyLoss — `long`;
- binary targets для BCEWithLogitsLoss — float;
- token IDs/indices — `long`;
- mixed precision использует float16/bfloat16 в части операций.

Неверный dtype может дать ошибку или silent loss of precision.

## Device

Model и input должны быть на одном device:

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
x = x.to(device)
```

Не вызывайте `.to(device)` внутри каждой маленькой операции без необходимости.

## Reshape

```python
x = x.reshape(batch_size, -1)
x = x.unsqueeze(1)
x = x.squeeze(1)
x = x.permute(0, 2, 1)
```

- `reshape` меняет представление при сохранении числа элементов;
- `unsqueeze` добавляет axis;
- `squeeze` удаляет axis размера 1;
- `permute` переставляет axes.

`squeeze()` без номера может случайно удалить batch dimension при batch size 1. Лучше `squeeze(1)`.

## Linear layer

```python
layer = torch.nn.Linear(in_features=10, out_features=4)
logits = layer(x)
```

Математика:

$$
y=xW^\top+b.
$$

Для input `(B, 10)` и weight `(4, 10)` output имеет `(B, 4)`.

Parameter count:

$$
10\cdot4+4=44.
$$

## Batch dimension

Model обычно ожидает batch, даже для одного объекта:

```python
single = torch.randn(10)
batched = single.unsqueeze(0)  # (1, 10)
prediction = model(batched)
```

## Broadcasting

PyTorch использует правила, похожие на NumPy. Это удобно для bias/mask, но неправильная форма иногда не вызывает ошибку, а broadcast делает не то.

Всегда записывайте expected shapes рядом со сложной операцией.

## Contiguous memory

После `permute` tensor может быть non-contiguous. `view` требует подходящие strides, `reshape` может создать копию. Используйте `.contiguous()` только когда действительно требуется.

## Визуализация

Компонент `tensor-shape-tracer`:

- блоки dimensions;
- операции reshape/unsqueeze/permute;
- linear matrix multiplication;
- parameter count;
- показ ошибки incompatible shapes;
- batch size 1 squeeze trap.

## Частые ошибки

- забыть batch dimension;
- class labels float для CrossEntropyLoss;
- logits/targets разной формы;
- model и tensor на разных devices;
- перепутать `(B,T,H)` и `(T,B,H)`;
- использовать `squeeze()` без axis;
- делать `view` после `permute`;
- хранить derived shape в hard-coded constant.

## Связи

- [[Activation Functions and Losses]]
- [[Neural Networks and Backpropagation]]
- [[NumPy Foundations]]
