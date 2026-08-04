---
title: "Сниппеты PyTorch"
tags:
  - deep-learning
  - pytorch
  - snippets
  - cheatsheet
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.snippety-pytorch
schema_version: 2
language: ru
app: source
---
# Сниппеты PyTorch

## Число параметров

```python
trainable_parameters = sum(
    parameter.numel()
    for parameter in model.parameters()
    if parameter.requires_grad
)

all_parameters = sum(
    parameter.numel()
    for parameter in model.parameters()
)

print(f"Trainable: {trainable_parameters:,}")
print(f"All:       {all_parameters:,}")
```

## Проверить batch

```python
batch = next(iter(train_loader))

if isinstance(batch, dict):
    for key, tensor in batch.items():
        print(key, tensor.shape, tensor.dtype)
else:
    for index, tensor in enumerate(batch):
        print(index, tensor.shape, tensor.dtype)
```

## Проверить trainable layers

```python
for name, parameter in model.named_parameters():
    if parameter.requires_grad:
        print(name, tuple(parameter.shape))
```

## Gradient norm

```python
total_squared_norm = 0.0

for parameter in model.parameters():
    if parameter.grad is not None:
        total_squared_norm += parameter.grad.norm(2).item() ** 2

grad_norm = total_squared_norm ** 0.5
print("Grad norm:", grad_norm)
```

## Сохранить и загрузить weights

```python
torch.save(model.state_dict(), "model.pt")

model.load_state_dict(
    torch.load(
        "model.pt",
        map_location=device,
        weights_only=True,
    )
)
```

## Заморозить и разморозить

```python
for parameter in model.backbone.parameters():
    parameter.requires_grad = False

for parameter in model.backbone.layer4.parameters():
    parameter.requires_grad = True
```

## Learning rate

```python
current_lr = optimizer.param_groups[0]["lr"]
print(current_lr)
```

## Peak GPU memory

```python
torch.cuda.reset_peak_memory_stats()

# train step

print(
    torch.cuda.max_memory_allocated() / 1024**3,
    "GB",
)
```

## Безопасный inference

```python
model.eval()

with torch.inference_mode():
    outputs = model(inputs.to(device))
```

## Очистить gradients эффективно

```python
optimizer.zero_grad(set_to_none=True)
```

## Проверить finite

```python
assert torch.isfinite(loss)
assert torch.isfinite(logits).all()
```
