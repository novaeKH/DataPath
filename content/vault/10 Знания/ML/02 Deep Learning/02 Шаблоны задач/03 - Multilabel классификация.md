---
title: "Шаблон — multilabel классификация"
tags:
  - deep-learning
  - multilabel
  - classification
  - pytorch
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.shablon-multilabel-klassifikatsiia
schema_version: 2
language: ru
app: source
---
# Шаблон — multilabel классификация

У объекта может быть несколько меток одновременно: например, обращение одновременно относится к «карте», «комиссии» и «жалобе».

## Формула

```text
logits [B,C]
target [B,C] float, каждая ячейка 0/1
→ BCEWithLogitsLoss
→ sigmoid для каждого класса
→ отдельный или общий threshold
```

## Модель и loss

```python
class MultilabelMLP(torch.nn.Module):
    def __init__(self, input_dim: int, num_labels: int):
        super().__init__()
        self.network = torch.nn.Sequential(
            torch.nn.Linear(input_dim, 128),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(128, num_labels),
        )

    def forward(self, features):
        return self.network(features)


model = MultilabelMLP(num_features, num_labels).to(device)
criterion = torch.nn.BCEWithLogitsLoss()
```

## `task_step`

```python
def multilabel_step(model, batch, device):
    features, targets = batch
    features = features.to(device)
    targets = targets.float().to(device)  # [B,C]

    logits = model(features)              # [B,C]
    loss = criterion(logits, targets)

    return loss, features.size(0)
```

## Прогноз

```python
probabilities = torch.sigmoid(logits)     # [B,C]

thresholds = torch.tensor(
    thresholds,
    device=probabilities.device,
)                                       # [C]

predictions = (probabilities >= thresholds).long()
```

Начни с одного порога `0.5`. Отдельные пороги подбирай на validation только если данных на каждый класс достаточно.

## Метрики

```python
from sklearn.metrics import average_precision_score, f1_score


macro_f1 = f1_score(
    y_true,
    y_pred,
    average="macro",
    zero_division=0,
)

micro_f1 = f1_score(
    y_true,
    y_pred,
    average="micro",
    zero_division=0,
)

macro_ap = average_precision_score(
    y_true,
    y_score,
    average="macro",
)
```

```text
macro → каждый label одинаково важен
micro → каждое решение по label одинаково важно
```

## Дисбаланс по меткам

`pos_weight` имеет форму `[C]`:

```python
criterion = torch.nn.BCEWithLogitsLoss(
    pos_weight=positive_weights.to(device)
)
```

## Типовые ошибки

- использовать `CrossEntropyLoss`;
- хранить target как один id класса;
- применять `argmax`, теряя остальные метки;
- подбирать `C` порогов на маленькой validation;
- считать только micro F1 и не замечать провал редких меток.
