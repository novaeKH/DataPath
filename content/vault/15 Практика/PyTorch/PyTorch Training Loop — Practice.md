---
title: PyTorch Training Loop — Practice
type: practice
area: dl
status: active
aliases:
  - Явный training loop PyTorch
  - PyTorch train validation loop
tags:
  - practice/pytorch
  - dl/training
rag: include
id: practice.dl.pytorch-training-loop-practice
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# PyTorch Training Loop — Practice

## Цель

Обучить маленький binary classifier и явно увидеть порядок:

```text
zero_grad
→ forward
→ loss
→ backward
→ optimizer.step
```

Пример самодостаточен: imports, data, model, train и validation находятся в одной note.

## Полная прямая реализация

```python
import math
import random

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset


SEED = 42

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

features = torch.randn(600, 4)
true_weights = torch.tensor([1.2, -0.8, 0.5, 0.3])
logits = features @ true_weights - 0.2
targets = (logits > 0).float()

train_features = features[:480]
train_targets = targets[:480]
valid_features = features[480:]
valid_targets = targets[480:]

train_dataset = TensorDataset(
    train_features,
    train_targets,
)
valid_dataset = TensorDataset(
    valid_features,
    valid_targets,
)

train_loader = DataLoader(
    train_dataset,
    batch_size=64,
    shuffle=True,
)
valid_loader = DataLoader(
    valid_dataset,
    batch_size=128,
    shuffle=False,
)

model = nn.Sequential(
    nn.Linear(4, 16),
    nn.ReLU(),
    nn.Linear(16, 1),
).to(device)

loss_function = nn.BCEWithLogitsLoss()
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-2,
    weight_decay=1e-4,
)


for epoch in range(10):
    model.train()
    train_loss_sum = 0.0
    train_examples = 0

    for batch_features, batch_targets in train_loader:
        batch_features = batch_features.to(device)
        batch_targets = batch_targets.to(device)

        optimizer.zero_grad()

        batch_logits = model(batch_features).squeeze(1)
        loss = loss_function(
            batch_logits,
            batch_targets,
        )

        loss.backward()
        optimizer.step()

        batch_size = batch_features.size(0)
        train_loss_sum += loss.item() * batch_size
        train_examples += batch_size

    train_loss = train_loss_sum / train_examples

    model.eval()
    valid_loss_sum = 0.0
    valid_correct = 0
    valid_examples = 0

    with torch.no_grad():
        for batch_features, batch_targets in valid_loader:
            batch_features = batch_features.to(device)
            batch_targets = batch_targets.to(device)

            batch_logits = model(batch_features).squeeze(1)
            loss = loss_function(
                batch_logits,
                batch_targets,
            )

            batch_probability = torch.sigmoid(batch_logits)
            batch_prediction = (
                batch_probability >= 0.5
            ).float()

            batch_size = batch_features.size(0)
            valid_loss_sum += loss.item() * batch_size
            valid_correct += (
                batch_prediction == batch_targets
            ).sum().item()
            valid_examples += batch_size

    valid_loss = valid_loss_sum / valid_examples
    valid_accuracy = valid_correct / valid_examples

    assert math.isfinite(train_loss)
    assert math.isfinite(valid_loss)

    print(
        f"epoch={epoch + 1:02d} "
        f"train_loss={train_loss:.4f} "
        f"valid_loss={valid_loss:.4f} "
        f"valid_accuracy={valid_accuracy:.3f}"
    )
```

Ожидаем finite losses и validation accuracy заметно выше random baseline. Точное число зависит от device/library, поэтому проверяем invariant, а не одну строку output.

## Что делает каждая строка ядра

```python
optimizer.zero_grad()
batch_logits = model(batch_features)
loss = loss_function(batch_logits, batch_targets)
loss.backward()
optimizer.step()
```

- `zero_grad`: gradients в PyTorch накапливаются; очищаем прошлый batch.
- `model(...)`: forward pass и computational graph.
- `loss_function`: scalar objective.
- `backward`: chain rule и `.grad`.
- `step`: optimizer изменяет parameters.

## Почему loss умножается на batch size

`BCEWithLogitsLoss` по default возвращает mean batch loss. Для epoch mean при последнем неполном batch:

$$
\operatorname{loss}_{epoch}
=
\frac{
\sum_b
\operatorname{loss}_b\cdot n_b
}{
\sum_b n_b
}.
$$

Простое среднее batch means дало бы последнему малому batch такой же вес, как полному.

## Train и eval

- `model.train()` включает training behavior Dropout/BatchNorm.
- `model.eval()` включает inference behavior.
- `torch.no_grad()` не строит graph и экономит memory.

Они решают разные задачи и нужны вместе.

## Следующий advanced шаг

Только после понимания baseline добавить:

- function `run_epoch`;
- checkpoint best validation state;
- early stopping;
- AMP;
- gradient accumulation;
- scheduler;
- callbacks/logging.

Каждая abstraction должна сохранять видимый порядок core steps.

## Типичные ошибки

- sigmoid перед `BCEWithLogitsLoss`;
- softmax перед `CrossEntropyLoss`;
- shape `(B, 1)` против `(B,)` без осознанного squeeze;
- `optimizer.step()` до `backward()`;
- validation без `eval()`/`no_grad()`;
- average batch means без weights;
- test используется каждый epoch;
- external variables/imports из «предыдущей note».

## Связанные знания

- [[Neural Networks and Backpropagation]] — forward, loss, graph и gradients.
- [[Optimization and Regularization in Deep Learning]] — AdamW, weight decay и modes.
- [[Validation Splits and Data Leakage]] — validation принимает решения, test остаётся untouched.
- [[Deep Learning — карта]] — templates и diagnostics.
