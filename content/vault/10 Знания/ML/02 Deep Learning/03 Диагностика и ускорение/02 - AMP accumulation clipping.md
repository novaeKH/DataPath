---
title: "AMP, gradient accumulation и clipping"
tags:
  - deep-learning
  - amp
  - gradient-accumulation
  - gradient-clipping
  - pytorch
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.amp-gradient-accumulation-i-clipping
schema_version: 2
language: ru
app: source
---
# AMP, gradient accumulation и clipping

## Три разные техники

| Техника | Зачем |
|---|---|
| AMP | меньше памяти и быстрее вычисления |
| Gradient accumulation | эффективный batch больше micro-batch |
| Gradient clipping | ограничить слишком большой gradient norm |

```text
effective batch
= micro batch × accumulation steps × число GPU
```

Для LM удобнее считать effective tokens:

```text
tokens/update
= micro batch × sequence length × accumulation steps × GPU
```

## Корректный порядок

```text
zero_grad один раз
→ autocast forward
→ loss / accumulation_steps
→ scaled backward
→ повторить micro-batches
→ unscale
→ clip
→ optimizer step
→ scaler update
→ zero_grad
```

## Шаблон

```python
import torch


accumulation_steps = 4
use_amp = device.type == "cuda"

scaler = torch.amp.GradScaler(
    "cuda",
    enabled=use_amp,
)

optimizer.zero_grad(set_to_none=True)

for step, batch in enumerate(train_loader, start=1):
    with torch.autocast(
        device_type=device.type,
        dtype=torch.float16,
        enabled=use_amp,
    ):
        loss, _ = task_step(model, batch, device)
        scaled_loss = loss / accumulation_steps

    scaler.scale(scaled_loss).backward()

    should_update = (
        step % accumulation_steps == 0
        or step == len(train_loader)
    )

    if should_update:
        scaler.unscale_(optimizer)

        grad_norm = torch.nn.utils.clip_grad_norm_(
            model.parameters(),
            max_norm=1.0,
        )

        scaler.step(optimizer)
        scaler.update()
        optimizer.zero_grad(set_to_none=True)
```

> [!note]
> Если последний accumulation-group неполный, деление на полный `accumulation_steps` немного уменьшает вклад последних micro-batches. Для строгой эквивалентности используй полный group, `drop_last=True` или скорректируй divisor последней группы.

## Scheduler

Scheduler, рассчитанный на optimizer updates, вызывается только после реального `optimizer.step()`, а не после каждого micro-batch.

## Частые ошибки

- `zero_grad()` вызывается после каждого micro-batch;
- loss не делится на `accumulation_steps`;
- gradient clipping выполняется до `scaler.unscale_`;
- scheduler делает шаг на каждом micro-batch;
- effective batch посчитан без числа GPU;
- accumulation считают способом уменьшить память одного forward — память уменьшает именно меньший micro-batch.

Официальная сверка: [PyTorch Automatic Mixed Precision examples](https://docs.pytorch.org/docs/stable/notes/amp_examples.html).
