---
title: "Найди ошибку в PyTorch"
tags:
  - deep-learning
  - practice
  - interview
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.naidi-oshibku-v-pytorch
schema_version: 2
language: ru
app: source
---
# Найди ошибку в PyTorch

## C. Найди ошибку в PyTorch — 20 баллов

За каждую задачу: 1 балл за ошибку, 1 за корректное исправление.

### C1. Двойной sigmoid

```python
probabilities = torch.sigmoid(model(x))
loss = nn.BCEWithLogitsLoss()(probabilities, y)
```

<details>
<summary><b>Ошибка и исправление</b></summary>

`BCEWithLogitsLoss` ожидает logits. Правильно:

```python
logits = model(x)
loss = criterion(logits, y)
```

Sigmoid применяем только для интерпретации/threshold на inference.

</details>

### C2. Неверный target для multiclass

```python
logits = model(x)        # (32, 10)
y = y.float()            # (32,)
loss = nn.CrossEntropyLoss()(logits, y)
```

<details>
<summary><b>Ошибка и исправление</b></summary>

Target должен быть индексом класса `torch.long`:

```python
y = y.long()
```

Значения — от 0 до 9, форма `(32,)`.

</details>

### C3. Накопление по ошибке

```python
for x, y in loader:
    loss = criterion(model(x), y)
    loss.backward()
    optimizer.step()
```

<details>
<summary><b>Ошибка и исправление</b></summary>

Нет очистки градиентов:

```python
optimizer.zero_grad()
loss = criterion(model(x), y)
loss.backward()
optimizer.step()
```

</details>

### C4. Нестабильная validation

```python
with torch.no_grad():
    valid_logits = model(X_valid)
```

    В модели есть Dropout и BatchNorm.

<details>
<summary><b>Ошибка и исправление</b></summary>

Не вызван `model.eval()`. `no_grad()` не переключает режим модулей:

```python
model.eval()
with torch.inference_mode():
    valid_logits = model(X_valid)
```

Перед продолжением обучения вернуть `model.train()`.

</details>

### C5. Утечка через scaler

```python
scaler.fit(X)
X_train = scaler.transform(X_train)
X_valid = scaler.transform(X_valid)
```

<details>
<summary><b>Ошибка и исправление</b></summary>

Scaler увидел validation. Fit только по train:

```python
scaler.fit(X_train)
X_train = scaler.transform(X_train)
X_valid = scaler.transform(X_valid)
```

</details>

### C6. Опасный `squeeze`

```python
logits = model(x).squeeze()
```

    Последний batch может иметь один объект.

<details>
<summary><b>Ошибка и исправление</b></summary>

`squeeze()` удалит все размерности размера 1 и может превратить `(1, 1)` в скаляр. Для удаления только выхода:

```python
logits = model(x).squeeze(1)
```

</details>

### C7. Dropout всегда работает

```python
class Model(nn.Module):
    def forward(self, x):
        return torch.nn.functional.dropout(x, p=0.5)
```

<details>
<summary><b>Ошибка и исправление</b></summary>

У functional dropout параметр `training=True` по умолчанию, поэтому `eval()` его не отключит. Использовать:

```python
F.dropout(x, p=0.5, training=self.training)
```

или создать `self.dropout = nn.Dropout(0.5)`.

</details>

### C8. «Лучшие» веса меняются дальше

```python
if valid_loss < best_loss:
    best_state = model.state_dict()
```

<details>
<summary><b>Ошибка и исправление</b></summary>

Нужна независимая копия:

```python
best_state = copy.deepcopy(model.state_dict())
```

Иначе сохранённые tensor references могут изменяться при последующих шагах.

</details>

### C9. Неверное accumulation

```python
for _ in range(8):
    loss = criterion(model(x), y)
    loss.backward()
optimizer.step()
```

<details>
<summary><b>Ошибка и исправление</b></summary>

Перед циклом нужен `zero_grad()`, а loss обычно делят на 8, чтобы получить средний, а не увеличенный в восемь раз градиент:

```python
optimizer.zero_grad()
for _ in range(8):
    loss = criterion(model(x), y) / 8
    loss.backward()
optimizer.step()
```

</details>

### C10. Device mismatch

```python
model = model.to("cuda")
logits = model(x)
```

    `x` остался на CPU.

<details>
<summary><b>Ошибка и исправление</b></summary>

Модель и все входные тензоры должны находиться на одном устройстве:

```python
x = x.to(device)
y = y.to(device)
logits = model(x)
```

</details>

### C11. Мини-задачи по коду

Запусти setup, затем сначала напиши функции самостоятельно в новых ячейках.

```python
import math
import copy
import torch
from torch import nn

torch.manual_seed(42)
print(torch.__version__)
```

**Задание 1.** Напиши `count_trainable_parameters(model)`.

**Задание 2.** Создай boolean causal mask `(T, T)`, где `True` означает запрещённую будущую позицию.

**Задание 3.** Напиши функцию, которая получает logits `(B, T, V)` и targets `(B, T)` и возвращает cross-entropy.

```python
def count_trainable_parameters(model: nn.Module) -> int:
    return sum(
        parameter.numel()
        for parameter in model.parameters()
        if parameter.requires_grad
    )


def make_causal_mask(
    sequence_length: int,
    device: torch.device | str = "cpu",
) -> torch.Tensor:
    return torch.triu(
        torch.ones(
            sequence_length,
            sequence_length,
            dtype=torch.bool,
            device=device,
        ),
        diagonal=1,
    )


def causal_lm_loss(
    logits: torch.Tensor,
    targets: torch.Tensor,
) -> torch.Tensor:
    return nn.functional.cross_entropy(
        logits.reshape(-1, logits.size(-1)),
        targets.reshape(-1),
    )


test_model = nn.Linear(5, 3)
test_mask = make_causal_mask(4)
test_logits = torch.randn(2, 3, 7)
test_targets = torch.randint(0, 7, (2, 3))

assert count_trainable_parameters(test_model) == 18
assert test_mask.shape == (4, 4)
assert test_mask.sum().item() == 6
assert causal_lm_loss(test_logits, test_targets).ndim == 0
print("Все проверки пройдены.")
```

Вернуться: [[10 Знания/ML/02 Deep Learning/05 Тренажер/00 - Карта тренажера]].
