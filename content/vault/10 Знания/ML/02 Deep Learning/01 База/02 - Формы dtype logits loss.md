---
title: "Формы, dtype, logits и loss"
tags:
  - deep-learning
  - tensor-shapes
  - loss
  - pytorch
  - cheatsheet
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.formy-dtype-logits-i-loss
schema_version: 2
language: ru
app: source
---
# Формы, dtype, logits и loss

> [!summary] Четыре вопроса перед train loop
> **Какая форма logits? Какая форма target? Какой dtype target? Какой loss?**

Обозначения: `B` — batch, `C` — классы, `T` — длина, `V` — словарь, `D` — embedding dimension, `H×W` — изображение.

## Главная таблица

| Задача | Logits / output | Target | dtype target | Loss | Прогноз |
|---|---|---|---|---|---|
| Binary | `[B]` | `[B]` 0/1 | `float32` | `BCEWithLogitsLoss` | `sigmoid → threshold` |
| Multiclass | `[B,C]` | `[B]` id класса | `long` | `CrossEntropyLoss` | `argmax` |
| Multilabel | `[B,C]` | `[B,C]` 0/1 | `float32` | `BCEWithLogitsLoss` | `sigmoid → C thresholds` |
| Regression | `[B]` или `[B,K]` | такая же | `float32` | `MSE/L1/Huber` | сами числа |
| Image classification | `[B,C]` | `[B]` | `long` | `CrossEntropyLoss` | `argmax` |
| Text classification | `[B,C]` | `[B]` | `long` | `CrossEntropyLoss` | `argmax` |
| NER | `[B,T,C]` | `[B,T]` | `long` | CE, `ignore_index=-100` | `argmax(-1)` |
| Retrieval | embeddings `[B,D]` | пары | — | contrastive / InfoNCE | similarity + top-k |
| Reranking binary | `[B]` | `[B]` 0/1 | `float32` | `BCEWithLogitsLoss` | score |
| Causal LM | `[B,T,V]` | `[B,T]` token ids | `long` | CE по следующему токену | sampling |
| Segmentation multiclass | `[B,C,H,W]` | `[B,H,W]` | `long` | CE + Dice | `argmax(1)` |

## Правило logits

```text
Модель возвращает сырые logits.
Sigmoid/softmax применяем для интерпретации после loss.
```

Нельзя:

```python
# Ошибка: двойная численно менее стабильная операция
probabilities = torch.sigmoid(logits)
loss = torch.nn.BCEWithLogitsLoss()(probabilities, targets)
```

Правильно:

```python
loss = torch.nn.BCEWithLogitsLoss()(logits, targets)
probabilities = torch.sigmoid(logits)
```

Для multiclass:

```python
loss = torch.nn.CrossEntropyLoss()(logits, targets.long())
predictions = logits.argmax(dim=1)
probabilities = torch.softmax(logits, dim=1)  # только если нужны вероятности
```

## Безопасная работа с размерностью

```python
logits = model(features).squeeze(-1)
```

Используй `.squeeze(-1)`, а не `.squeeze()`: при `batch_size=1` общий `squeeze()` может удалить размерность батча.

## Проверка одного батча

```python
batch = next(iter(train_loader))

print("features:", batch[0].shape, batch[0].dtype)
print("targets: ", batch[1].shape, batch[1].dtype)

with torch.no_grad():
    logits = model(batch[0].to(device))

print("logits:  ", logits.shape, logits.dtype)
```

Для словаря:

```python
for key, value in batch.items():
    print(key, value.shape, value.dtype)
```

## Мини-проверка

- Binary: `1 logit → BCE → sigmoid → threshold`.
- Multiclass: `C logits → CE → argmax`.
- Multilabel: `C независимых logits → BCE → C порогов`.
- NER: класс для каждого токена; padding и лишние subtoken labels игнорируются.
- Causal LM: позиция `t` предсказывает токен `t+1`.

Дальше: [[10 Знания/ML/02 Deep Learning/01 База/03 - Dataset и DataLoader]].
