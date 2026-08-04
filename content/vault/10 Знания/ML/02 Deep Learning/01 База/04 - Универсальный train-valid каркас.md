---
title: "Универсальный train-valid каркас"
type: practice
area: dl
status: active
tags:
  - deep-learning
  - pytorch
  - training-loop
  - early-stopping
  - template
rag: exclude
id: practice.dl.universal-nyi-train-valid-karkas
schema_version: 2
language: ru
app: source
---
# Универсальный train-valid каркас

> [!info] Порядок изучения
> Сначала пройди [[PyTorch Training Loop — Practice]] с явным `zero_grad → forward → loss → backward → step`. Этот файл — следующий advanced layer с abstraction, checkpointing и early stopping.

> [!important]
> Универсален порядок действий, а не формула loss. Функцию `task_step` бери из заметки конкретной задачи.

## 1. Конфигурация, seed и device

```python
from dataclasses import dataclass
import random

import numpy as np
import torch


@dataclass
class Config:
    seed: int = 42
    epochs: int = 20
    patience: int = 4
    min_delta: float = 1e-4
    lr: float = 3e-4
    weight_decay: float = 1e-2


cfg = Config()


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


seed_everything(cfg.seed)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

## 2. Фиксированное ядро одной эпохи

`task_step(model, batch, device)` должен вернуть:

```text
loss, batch_size
```

```python
from contextlib import nullcontext


def run_epoch(
    model,
    data_loader,
    task_step,
    device,
    optimizer=None,
):
    is_train = optimizer is not None
    model.train(is_train)

    total_loss = 0.0
    total_objects = 0

    context = nullcontext() if is_train else torch.inference_mode()

    with context:
        for batch in data_loader:
            if is_train:
                optimizer.zero_grad(set_to_none=True)

            loss, batch_size = task_step(model, batch, device)

            if is_train:
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * batch_size
            total_objects += batch_size

    return total_loss / total_objects
```

## 3. Пример `task_step` для binary

```python
criterion = torch.nn.BCEWithLogitsLoss()


def binary_step(model, batch, device):
    features, targets = batch
    features = features.to(device)
    targets = targets.float().to(device)

    logits = model(features).squeeze(-1)
    loss = criterion(logits, targets)

    return loss, features.size(0)
```

Для другой задачи меняется только `task_step`. Смотри [[10 Знания/ML/02 Deep Learning/02 Шаблоны задач/00 - Карта выбора шаблона]].

## 4. Fit, early stopping и лучшие веса

```python
from copy import deepcopy


optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=cfg.lr,
    weight_decay=cfg.weight_decay,
)

best_valid_loss = float("inf")
best_state = None
epochs_without_improvement = 0
history = []

for epoch in range(1, cfg.epochs + 1):
    train_loss = run_epoch(
        model,
        train_loader,
        task_step,
        device,
        optimizer=optimizer,
    )

    valid_loss = run_epoch(
        model,
        valid_loader,
        task_step,
        device,
    )

    history.append({
        "epoch": epoch,
        "train_loss": train_loss,
        "valid_loss": valid_loss,
    })

    print(
        f"epoch={epoch:02d} "
        f"train={train_loss:.4f} "
        f"valid={valid_loss:.4f}"
    )

    improved = valid_loss < best_valid_loss - cfg.min_delta

    if improved:
        best_valid_loss = valid_loss
        best_state = deepcopy(model.state_dict())
        epochs_without_improvement = 0
    else:
        epochs_without_improvement += 1

    if epochs_without_improvement >= cfg.patience:
        print("Early stopping")
        break

model.load_state_dict(best_state)
```

> [!important] Что считать «лучшей» эпохой
> Шаблон выше останавливается по validation loss. Если главным критерием задачи является macro F1, AP, Recall@K или другая метрика, отдельно считай её на validation и сохраняй checkpoint по заранее выбранному критерию. Не переключай критерий после просмотра результатов.

## 5. Что нужно уметь написать без подсказки

```python
model.train()
for x, y in train_loader:
    optimizer.zero_grad()
    logits = model(x)
    loss = criterion(logits, y)
    loss.backward()
    optimizer.step()
```

И validation:

```python
model.eval()
with torch.inference_mode():
    for x, y in valid_loader:
        logits = model(x)
        loss = criterion(logits, y)
```

## 6. Перед полным запуском

1. Проверь формы одного батча.
2. Проверь один forward и конечный loss.
3. Проверь, что `loss.backward()` создаёт градиенты.
4. Переобучи модель на одном маленьком батче.
5. Только затем запускай полный train.

Диагностика: [[10 Знания/ML/02 Deep Learning/03 Диагностика и ускорение/01 - Диагностика от симптома]].
