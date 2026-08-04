---
title: "Метрики, checkpoint и final test"
tags:
  - deep-learning
  - metrics
  - checkpoint
  - test
  - inference
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.metriki-checkpoint-i-final-test
schema_version: 2
language: ru
app: source
---
# Метрики, checkpoint и final test

## 1. Loss и метрика — не одно и то же

```text
loss    → по нему считаются градиенты
метрика → по ней оценивается полезное качество
```

| Задача | Частая главная метрика |
|---|---|
| Binary с дисбалансом | AP/PR-AUC, Recall, Precision, F1 |
| Multiclass | macro F1 + per-class Recall |
| Multilabel | macro/micro F1, per-label AP |
| Regression | MAE/RMSE |
| NER | entity-level F1 |
| Retrieval | Recall@K, MRR, nDCG@K |
| Reranking | MRR, nDCG@K |
| Causal LM | valid loss/perplexity + генеративные evals |

## 2. Собрать прогнозы на validation

Пример для binary:

```python
def predict_binary(model, data_loader, device):
    all_probabilities = []
    all_targets = []

    model.eval()
    with torch.inference_mode():
        for features, targets in data_loader:
            logits = model(features.to(device)).squeeze(-1)
            probabilities = torch.sigmoid(logits)

            all_probabilities.append(probabilities.cpu())
            all_targets.append(targets.cpu())

    return (
        torch.cat(all_probabilities).numpy(),
        torch.cat(all_targets).numpy(),
    )
```

## 3. Threshold выбирается только на valid

```python
import numpy as np
from sklearn.metrics import precision_recall_curve


precision, recall, thresholds = precision_recall_curve(
    valid_targets,
    valid_probabilities,
)

f1 = (
    2 * precision[:-1] * recall[:-1]
    / (precision[:-1] + recall[:-1] + 1e-12)
)

best_index = np.argmax(f1)
best_threshold = float(thresholds[best_index])
```

Порог можно выбирать по:

- максимуму F1;
- минимально допустимому Recall;
- минимально допустимому Precision;
- стоимости FP/FN;
- ограничению top-k.

> [!danger]
> Нельзя подбирать threshold, эпоху или архитектуру по final test.

## 4. Сохранить полный checkpoint

```python
checkpoint = {
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "config": vars(cfg),
    "best_valid_loss": best_valid_loss,
    "threshold": best_threshold,
    "class_to_id": class_to_id,
}

torch.save(checkpoint, "model_checkpoint.pt")
```

Также сохрани:

- tokenizer;
- scaler/normalizer;
- mapping классов;
- параметры архитектуры;
- версию данных и кода;
- выбранный threshold.

## 5. Final test — один раз

Перед test должны быть зафиксированы:

- split и preprocessing;
- архитектура;
- гиперпараметры;
- stopping rule;
- threshold;
- главная метрика.

После просмотра test не возвращайся к настройке модели. Иначе test стал частью разработки.

## 6. Анализ ошибок

Не ограничивайся одной метрикой:

- confusion matrix;
- ошибки по классам;
- ошибки по длине текста/последовательности;
- ошибки по сегментам клиентов;
- самые уверенные неверные ответы;
- пропуски редких классов;
- ошибки на новых периодах;
- latency и расход памяти.

## 7. Проверить inference на одном новом объекте

```python
model.eval()

with torch.inference_mode():
    logits = model(new_features.to(device)).squeeze(-1)
    probability = torch.sigmoid(logits)
    prediction = (probability >= best_threshold).long()
```

Финальный чек-лист: [[10 Знания/ML/02 Deep Learning/06 Рабочие шаблоны/02 - Чек-лист DL проекта]].
