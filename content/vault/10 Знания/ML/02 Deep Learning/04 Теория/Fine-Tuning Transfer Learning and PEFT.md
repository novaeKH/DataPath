---
title: Fine-Tuning Transfer Learning and PEFT
id: concept.dl.fine-tuning-transfer-peft
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
- Transfer learning
- LoRA
- QLoRA
tags:
- dl/fine-tuning
- llm/peft
math_depth: 1
---

# Fine-Tuning, Transfer Learning and PEFT

## Transfer learning

Pretrained model уже выучила general representations. Мы адаптируем её к новой задаче вместо обучения с нуля. Это особенно полезно при малых данных.

## Feature extractor

Backbone frozen, обучается только head. Быстро и стабильно, но representation не адаптируется полностью.

## Full fine-tuning

Обновляются все weights. Требует больше memory/data и меньшего learning rate. Риск catastrophic forgetting и overfit.

## Gradual unfreezing

Сначала head, затем часть верхних layers. Это практическая strategy, не универсальный закон.

## LoRA

Большая weight matrix остаётся frozen, обучается low-rank update:

$$
W'=W+BA,
$$

где rank $r$ мал. Trainable parameters и optimizer memory уменьшаются.

## QLoRA

Base weights хранятся quantized, LoRA adapters обучаются в higher precision. Экономит memory, но implementation и numerical stability требуют внимания.

## Data format и loss mask

Для instruction tuning template определяет prompt/response. Часто loss считают только на response tokens. Неверная mask учит model предсказывать prompt или раскрывает answer.

## Evaluation

Нужны:

- held-out tasks;
- domain segments;
- regression of base abilities;
- factuality/safety where relevant;
- latency/memory;
- human evaluation rubric;
- exact prompt and decoding config.

## Что именно обучается

В feature-extractor режиме gradient не хранится для frozen backbone, поэтому training быстрее и требует меньше memory. При full fine-tuning gradient и optimizer states нужны для всех parameters. LoRA оставляет base matrix frozen и добавляет две маленькие matrices ранга $r$.

Например, для слоя $4096\times4096$ полная matrix содержит около 16.8 млн parameters. LoRA с rank 8 добавляет:

$$
4096\cdot 8 + 8\cdot 4096 = 65\,536
$$

parameters, то есть примерно в 256 раз меньше для этого update. Это не означает такое же ускорение inference: base model всё равно выполняет основное matrix multiplication.

## Выбор режима

- Мало данных и простая target task: frozen backbone + head.
- Достаточно данных и model должна сильно адаптироваться: partial/full fine-tuning.
- Большая language model и ограниченная memory: LoRA/QLoRA.
- Нужны разные domain adapters: отдельные LoRA adapters удобнее нескольких полных copies.

Выбор зависит от memory, latency, licence, data quality и допустимого regression base capabilities.

## Training pipeline

1. Зафиксировать base-model baseline.
2. Очистить и дедуплицировать train/validation prompts.
3. Зафиксировать tokenizer и template.
4. Решить, на каких tokens считать loss.
5. Настроить learning rate, effective batch и gradient clipping.
6. Сравнить checkpoints на held-out tasks.
7. Проверить catastrophic forgetting и unsafe regressions.
8. Сохранить adapter вместе с точной версией base model.

## Loss mask на примере

Для instruction `Объясни precision` и response `Precision — доля...` часто prompt tokens получают mask 0, response tokens — mask 1. Тогда model оптимизируется на ответе. Но для pretraining-style objectives или некоторых chat templates правило может отличаться — mask должна соответствовать цели обучения.

## Мини-проверка

Training loss LoRA падает, а validation answers становятся хуже. Возможные причины: слишком высокий learning rate, duplicated prompts, mismatch template, overfit на style или неверная evaluation rubric. Само уменьшение числа trainable parameters не защищает от overfit.

## Визуализация

Компонент `fine-tuning-parameter-budget`:

- model layers;
- frozen/trainable weights;
- full vs head vs LoRA;
- memory bars;
- rank slider;
- loss-mask tokens.

## Частые ошибки

- train/test prompts overlap;
- template mismatch inference;
- learning rate too high;
- no base-model comparison;
- LoRA target modules chosen blindly;
- quantization assumed free;
- evaluate only training loss;
- tokenizer special tokens inconsistent.

## Связи

- [[Transformer and Language Modeling]]
- [[Training Evaluation and Inference in PyTorch]]
- [[Optimization and Regularization in Deep Learning]]

## Код: staged fine-tuning

```python
for parameter in model.backbone.parameters():
    parameter.requires_grad = False

optimizer = torch.optim.AdamW(model.head.parameters(), lr=1e-3)
# train head, validate, затем разморозить последние blocks
for parameter in model.backbone[-2:].parameters():
    parameter.requires_grad = True

optimizer = torch.optim.AdamW([
    {"params": model.backbone[-2:].parameters(), "lr": 1e-5},
    {"params": model.head.parameters(), "lr": 1e-4},
])
```

Backbone получает меньший learning rate, чтобы не разрушить pretrained features;
новая head обучается быстрее. После разморозки optimizer создаётся заново.
