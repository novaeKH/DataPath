---
title: "Dataset и DataLoader"
tags:
  - deep-learning
  - pytorch
  - dataset
  - dataloader
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.dataset-i-dataloader
schema_version: 2
language: ru
app: source
---
# Dataset и DataLoader

```text
Dataset    → знает, как получить один объект
DataLoader → собирает объекты в батчи, перемешивает и загружает
```

## Вариант 1. Готовые числовые тензоры

```python
import torch
from torch.utils.data import DataLoader, TensorDataset


train_dataset = TensorDataset(
    torch.as_tensor(X_train, dtype=torch.float32),
    torch.as_tensor(y_train, dtype=torch.float32),  # long для multiclass
)

train_loader = DataLoader(
    train_dataset,
    batch_size=64,
    shuffle=True,
    num_workers=0,
    pin_memory=torch.cuda.is_available(),
)
```

Validation/test:

```python
valid_loader = DataLoader(
    valid_dataset,
    batch_size=128,
    shuffle=False,
    num_workers=0,
    pin_memory=torch.cuda.is_available(),
)
```

## Вариант 2. Обработка каждого объекта

```python
from torch.utils.data import Dataset


class CustomDataset(Dataset):
    def __init__(self, objects, targets, transform=None):
        self.objects = objects
        self.targets = targets
        self.transform = transform

    def __len__(self):
        return len(self.objects)

    def __getitem__(self, index):
        x = self.objects[index]
        y = self.targets[index]

        if self.transform is not None:
            x = self.transform(x)

        return x, y
```

## Вариант 3. Словарь для Transformer

```python
class TextDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=256):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, index):
        item = self.tokenizer(
            self.texts[index],
            truncation=True,
            max_length=self.max_length,
        )
        item["labels"] = int(self.labels[index])
        return item
```

Для текстов выгоднее делать **dynamic padding** до максимальной длины внутри текущего батча:

```python
from transformers import DataCollatorWithPadding


collator = DataCollatorWithPadding(tokenizer=tokenizer)

train_loader = DataLoader(
    train_dataset,
    batch_size=16,
    shuffle=True,
    collate_fn=collator,
)
```

## `collate_fn` для последовательностей разной длины

`DataLoader` не сможет обычным `stack` собрать разные длины. `collate_fn` должен:

1. определить максимальную длину в батче;
2. добавить padding;
3. создать mask;
4. вернуть тензоры одинаковой формы.

## Что применять только к train

- случайные аугментации изображений;
- oversampling;
- шум и случайные искажения;
- статистики scaler/normalizer, вычисляемые по текущему датасету;
- построение собственного словаря/tokenizer.

Pretrained tokenizer уже зафиксирован заранее и сам по себе не обучается на valid/test.

## Sanity check DataLoader

```python
batch = next(iter(train_loader))

if isinstance(batch, dict):
    for key, value in batch.items():
        print(key, value.shape, value.dtype)
else:
    for index, value in enumerate(batch):
        print(index, value.shape, value.dtype)
```

Проверь:

- [ ] первый размер всех полей равен `B`;
- [ ] target имеет нужный `dtype`;
- [ ] padding mask соответствует padding;
- [ ] train перемешивается, valid/test — нет;
- [ ] аугментации valid детерминированы;
- [ ] один и тот же объект не попал в разные split.

Дальше: [[10 Знания/ML/02 Deep Learning/01 База/04 - Универсальный train-valid каркас]].
