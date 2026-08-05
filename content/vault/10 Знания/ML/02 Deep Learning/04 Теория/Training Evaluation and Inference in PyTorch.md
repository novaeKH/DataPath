---
title: Training Evaluation and Inference in PyTorch
id: concept.dl.training-evaluation-inference-pytorch
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
- PyTorch training loop
tags:
- dl/pytorch
- dl/training
math_depth: 1
---

# Training, Evaluation and Inference in PyTorch

## Полный жизненный цикл

```text
data split → Dataset/DataLoader → model → optimizer/loss
→ train epochs → validation → checkpoint → final test → inference
```

Каждый этап должен быть воспроизводимым и не использовать test для выбора.

## Dataset и DataLoader

Dataset возвращает один example, DataLoader собирает batch, shuffle и workers.

```python
loader = DataLoader(dataset, batch_size=64, shuffle=True, num_workers=4)
```

Validation/test не shuffle для correctness не обязаны, но deterministic order упрощает analysis.

## Train epoch

```python
model.train()
for features, targets in train_loader:
    features = features.to(device)
    targets = targets.to(device)

    optimizer.zero_grad(set_to_none=True)
    logits = model(features)
    loss = criterion(logits, targets)
    loss.backward()
    optimizer.step()
```

## Validation

```python
model.eval()
loss_sum = 0.0
count = 0

with torch.inference_mode():
    for features, targets in valid_loader:
        logits = model(features.to(device))
        loss = criterion(logits, targets.to(device))
        loss_sum += loss.item() * len(targets)
        count += len(targets)

valid_loss = loss_sum / count
```

Average по batch losses может быть неверным при разных batch sizes; агрегируйте по examples.

## Metrics

Собирайте predictions/targets на CPU и вычисляйте metric по всей validation set, особенно AUC/F1. Average batch AUC не равен global AUC.

## Checkpoint

Сохраняйте:

- `model.state_dict()`;
- optimizer/scheduler state для resume;
- epoch/step;
- best metric;
- config;
- label mapping/tokenizer;
- preprocessing.

Best checkpoint выбирается по validation. Test один раз после фиксации.

## Reproducibility

Seed для Python/NumPy/PyTorch, deterministic split, versions и config. Полная bitwise determinism может снижать performance и не всегда доступна.

## AMP

Automatic mixed precision ускоряет GPU и экономит memory. Некоторые operations выполняются в lower precision, scaling защищает small gradients.

Clipping при AMP выполняют после unscale.

## Gradient accumulation

Несколько micro-batches имитируют larger batch. Loss обычно делят на accumulation steps, update/zero_grad выполняют реже. Scheduler/metrics должны учитывать optimizer steps.

## Inference

- `model.eval()`;
- `torch.inference_mode()`;
- тот же preprocessing;
- fixed label mapping;
- batching;
- device management;
- no random augmentation;
- latency/memory measurement.

## Визуализация

Компонент `training-loop-timeline`:

- batch flow;
- forward/backward/update;
- train vs eval switches;
- checkpoint best epoch;
- accumulation;
- inference path.

## Частые ошибки

- test каждый epoch;
- validation с active Dropout;
- average batch metrics;
- last checkpoint вместо best;
- preprocessing differs at inference;
- labels mapping lost;
- storing tensors with graph;
- DataLoader leakage from augmentations/groups.

## Связи

- [[Neural Networks and Backpropagation]]
- [[Optimization and Regularization in Deep Learning]]
- [[DL Debugging and Experiment Design]]
