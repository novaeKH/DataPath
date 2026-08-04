---
title: "CUDA OOM и ускорение DL"
tags:
  - deep-learning
  - cuda
  - performance
  - oom
  - pytorch
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.cuda-oom-i-uskorenie-dl
schema_version: 2
language: ru
app: source
---
# CUDA OOM и ускорение DL

## Если CUDA out of memory

Пробуй по порядку:

1. уменьшить micro-batch;
2. уменьшить sequence length / image resolution;
3. включить AMP;
4. использовать gradient accumulation для сохранения effective batch;
5. включить gradient checkpointing;
6. заморозить backbone или использовать LoRA/QLoRA;
7. выбрать меньшую модель;
8. для inference включить KV-cache/батчирование с учётом задачи.

> [!important]
> Gradient accumulation сам по себе не уменьшает память одного forward. Он позволяет уменьшить micro-batch и накопить градиент до update.

## Найти пик памяти

```python
torch.cuda.reset_peak_memory_stats()

# forward + backward

peak_gb = (
    torch.cuda.max_memory_allocated()
    / 1024**3
)

print(f"Peak allocated: {peak_gb:.2f} GB")
```

## Ускорить DataLoader

```python
train_loader = DataLoader(
    train_dataset,
    batch_size=batch_size,
    shuffle=True,
    num_workers=4,
    pin_memory=True,
    persistent_workers=True,
)
```

Подбирай `num_workers` измерением. В Windows/ноутбуках иногда стабильнее начать с `0`.

Перенос:

```python
features = features.to(
    device,
    non_blocking=True,
)
```

## Ускорить последовательности

- dynamic padding;
- bucket batches по похожей длине;
- уменьшить `max_length`;
- pack несколько коротких LM-примеров в блок;
- не токенизировать одни и те же тексты каждую эпоху без необходимости.

## Где тратится память

```text
параметры
+ gradients
+ optimizer states
+ activations
+ temporary buffers
```

LoRA уменьшает обучаемые параметры и optimizer states, но base activations всё ещё занимают память.

## Измерять, а не угадывать

Логируй:

- examples/s или tokens/s;
- время DataLoader;
- время forward/backward;
- peak GPU memory;
- GPU utilization;
- среднюю длину batch;
- latency p50/p95 на inference.

## Не делать первым действием

- `torch.cuda.empty_cache()` после каждого batch;
- переходить на огромную distributed-схему;
- уменьшать модель до потери смысла без профилирования;
- увеличивать batch только потому, что GPU ещё не заполнена.
