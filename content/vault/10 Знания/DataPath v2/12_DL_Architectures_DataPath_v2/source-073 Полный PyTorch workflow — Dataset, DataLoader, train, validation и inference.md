---
title: "Полный PyTorch workflow — Dataset, DataLoader, train, validation и inference"
id: concept.datapath-v2.073
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 73
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Полный PyTorch workflow: от Dataset до inference

Знать `nn.Linear` и backprop недостаточно, чтобы решить реальную DL-задачу.

Нужен воспроизводимый pipeline:

```text
raw data
→ Dataset
→ DataLoader
→ model
→ optimizer
→ train loop
→ validation
→ checkpoint
→ test
→ inference
```

Этот урок собирает всё в один рабочий каркас.

---

## 1. Разделение responsibilities

Хороший project не превращает один notebook cell в 500 строк.

Conceptual components:

```text
data preparation
Dataset
DataLoader
model
loss
optimizer
training step
validation
metrics
checkpoint
inference
config
```

Разделение делает debugging проще.

---

## 2. Dataset

PyTorch map-style `Dataset` обычно определяет:

```python
__len__()
__getitem__(index)
```

Пример:

```python
from torch.utils.data import Dataset

class TabularDataset(Dataset):
    def __init__(self, X, y):
        self.X = X
        self.y = y

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]
```

Dataset отвечает:

> как получить один training example.

---

## 3. DataLoader

`DataLoader` отвечает за batching/loading:

```python
from torch.utils.data import DataLoader

loader = DataLoader(
    dataset,
    batch_size=128,
    shuffle=True,
)
```

Он формирует batches и может использовать worker processes, pinned memory и другие mechanisms.

---

## 4. Shuffle

Training:

```text
shuffle=True
```

обычно помогает менять batch composition между epochs.

Validation/test:

```text
shuffle=False
```

чаще проще и reproducible.

Для time-series sequence задачи нельзя автоматически shuffle temporal samples, если это разрушает training semantics.

---

## 5. Custom collate

Если examples имеют variable length:

```text
text sequences
audio
objects per image
```

обычный stacking не работает.

Можно определить `collate_fn`, который:

- pads;
- builds masks;
- packs sequences;
- объединяет variable-size labels.

DataLoader отвечает за batch construction, не обязательно Dataset.

---

## 6. Device transfer

Batch от DataLoader обычно появляется на CPU.

В loop:

```python
x = x.to(device)
y = y.to(device)
```

Model:

```python
model.to(device)
```

Device transfer — часть performance path.

Нельзя случайно копировать tensors CPU↔GPU много раз внутри inner operations.

---

## 7. Train mode

Перед train:

```python
model.train()
```

Это включает training behavior layers вроде:

- Dropout;
- BatchNorm.

Затем:

```text
zero gradients
forward
loss
backward
step
```

---

## 8. Validation mode

Перед validation:

```python
model.eval()
```

И:

```python
with torch.no_grad():
    for xb, yb in valid_loader:
        logits = model(xb)
        valid_loss += loss_fn(logits, yb).item()
```

`eval()` меняет layer behavior.

`no_grad()` отключает autograd tracking.

Нужны по разным причинам.

---

## 9. Полный training epoch

```python
def train_one_epoch(
    model,
    loader,
    loss_fn,
    optimizer,
    device,
):
    model.train()

    total_loss = 0.0

    for x, y in loader:
        x = x.to(device)
        y = y.to(device)

        optimizer.zero_grad()

        logits = model(x)
        loss = loss_fn(logits, y)

        loss.backward()
        optimizer.step()

        total_loss += loss.item() * x.size(0)

    return total_loss / len(loader.dataset)
```

Почему умножаем loss на batch size?

Если loss averaged per batch, последний batch может иметь другой size. Weighted accumulation даёт корректнее average per sample.

---

## 10. Validation epoch

```python
def evaluate(
    model,
    loader,
    loss_fn,
    device,
):
    model.eval()

    total_loss = 0.0

    with torch.no_grad():
        for x, y in loader:
            x = x.to(device)
            y = y.to(device)

            logits = model(x)
            loss = loss_fn(logits, y)

            total_loss += loss.item() * x.size(0)

    return total_loss / len(loader.dataset)
```

Metrics могут потребовать accumulate predictions/targets.

---

## 11. Не считать metric по среднему batch score без понимания

Некоторые metrics decomposable, другие нет.

Например ROC-AUC нельзя корректно получить просто:

```text
mean(batch_auc)
```

в общем случае.

Нужно собрать predictions для всего validation set и посчитать metric globally.

---

## 12. Checkpoint

Сохранять entire Python model object возможно, но рекомендуемый robust pattern обычно связан с `state_dict`.

```python
torch.save(
    model.state_dict(),
    "model.pt",
)
```

Load:

```python
model = MyModel(...)
state = torch.load(
    "model.pt",
    map_location=device,
)
model.load_state_dict(state)
```

Architecture/config должны быть известны отдельно.

---

## 13. Training checkpoint больше model weights

Чтобы продолжить training точно с определённого step, полезно сохранять:

```text
model_state_dict
optimizer_state_dict
scheduler_state_dict
epoch
best_metric
config
```

Например:

```python
torch.save({
    "model": model.state_dict(),
    "optimizer": optimizer.state_dict(),
    "epoch": epoch,
}, path)
```

---

## 14. Best checkpoint

Если validation metric:

```text
epoch 5  = 0.81
epoch 10 = 0.85
epoch 20 = 0.82
```

финальная model не должна автоматически быть epoch 20.

Сохраняем best validation checkpoint.

Early stopping и best checkpoint связаны.

---

## 15. Test set

Test не используется:

- для lr;
- для architecture;
- для stopping;
- для threshold iteration.

После freeze model:

```text
load best config/checkpoint
→ one final evaluation
```

Это те же principles Classic ML.

---

## 16. Reproducibility

Seeds:

```python
import random
import numpy as np
import torch

seed = 42
random.seed(seed)
np.random.seed(seed)
torch.manual_seed(seed)
```

Но exact determinism зависит от device/backend/operators.

Seeds нужны, но не являются absolute guarantee identical results across hardware/software.

---

## 17. Data leakage в DL

DL не отменяет leakage.

Примеры:

- image duplicates across train/test;
- same patient both splits;
- augment validation with training-only stochastic transforms;
- normalization statistics whole dataset;
- future tokens/time windows;
- fine-tune on test labels.

Сильная network ещё эффективнее exploits leakage.

---

## 18. Normalization data

Image normalization constants должны fit/come from training recipe.

Если pretrained model ожидает known normalization, используем соответствующий preprocessing.

Если statistics свои — считаем их по training data.

---

## 19. Mixed precision

Modern GPU training часто использует lower precision.

Идея:

```text
FP16/BF16 for many operations
→ speed/memory gains
```

PyTorch предоставляет automatic mixed precision mechanisms.

Exact API depends device/version, но conceptual flow:

```text
autocast forward/loss
→ scaled or appropriate backward
→ optimizer
```

BF16 имеет larger exponent range, часто более stable, но hardware support важна.

---

## 20. Gradient accumulation

Если desired effective batch:

```text
256
```

но GPU вмещает 64:

```text
4 mini-batches
→ accumulate gradients
→ one optimizer step
```

Нужно корректно scale loss, если хотим average equivalent behavior.

---

## 21. Gradient clipping

Optional:

```python
loss.backward()

torch.nn.utils.clip_grad_norm_(
    model.parameters(),
    max_norm=1.0,
)

optimizer.step()
```

Не вставлять blindly. Нужен при diagnostic reason.

---

## 22. Scheduler

Scheduler может update lr:

- per epoch;
- per optimizer step.

Нужно читать contract конкретного scheduler.

Ошибочное место `scheduler.step()` может изменить training schedule.

---

## 23. Logging

Минимум:

```text
epoch
train loss
validation loss
primary metric
learning rate
time
```

Advanced:

```text
gradient norm
GPU memory
throughput
weight norm
```

Без logs невозможно сравнивать experiments.

---

## 24. Experiment config

Не прятать hyperparameters в 20 cells.

Config:

```yaml
batch_size: 128
lr: 0.001
weight_decay: 0.01
hidden_size: 256
epochs: 50
seed: 42
```

Так experiment можно воспроизвести и сравнить.

---

## 25. Model summary / parameter count

Перед training проверить:

```text
input shapes
output shapes
parameter count
```

Очень полезно сделать один dummy forward:

```python
x = torch.randn(...)
with torch.no_grad():
    y = model(x)
print(y.shape)
```

Это ловит shape errors до часов training.

---

## 26. Overfit one batch

До full training:

```text
взять один tiny batch
→ train many steps
→ model должна почти memorise it
```

Если не может:

- wrong loss;
- labels;
- gradients;
- optimizer;
- architecture;
- dtype/shape.

Это один из самых сильных debugging tools.

---

## 27. Baseline

Даже в DL нужен baseline.

Image:

```text
simple CNN
```

Text:

```text
TF-IDF + Logistic Regression
```

Time series:

```text
last value / boosting lag features
```

Если huge Transformer barely beats TF-IDF, это важный result.

---

## 28. Inference

```python
model.eval()

with torch.no_grad():
    logits = model(x)
```

Затем task-specific postprocessing:

Classification:

```text
softmax/sigmoid
threshold/argmax
```

Regression:

```text
raw numeric output
```

---

## 29. Batch inference

Даже production inference часто быстрее batches, если latency constraints allow.

GPU плохо используется при tiny one-object calls relative to its parallel capacity.

Но online low-latency serving требует trade-off batch delay vs throughput.

---

## 30. Input contract

DL model особенно чувствительна к exact preprocessing:

- image size;
- normalization;
- tokenizer version;
- max length;
- vocabulary;
- channel order;
- dtype.

Model artifact без preprocessing metadata неполон.

---

## 31. TorchScript / compile / export — не foundation goal

PyTorch ecosystem имеет mechanisms optimization/export:

- `torch.compile`;
- ONNX/export paths;
- deployment runtimes.

Но foundation project сначала должен быть correct.

Не надо prematurely optimize deployment, пока training/evaluation не stable.

---

## 32. Интерактивная визуализация DataPath

### Training state machine

```text
Dataset
→ DataLoader
→ batch
→ device
→ train()
→ forward
→ backward
→ optimizer
```

### Train vs Eval

Dropout/BatchNorm behavior shown.

### Checkpoint timeline

Epoch metrics и selected best checkpoint.

### Leakage challenge

Пользователь отмечает:
- normalization before split;
- duplicate patient;
- test tuning;
- augmentation validation.

---

## 33. Типичные ошибки

**«Dataset сам обязательно делает batching».**\
Обычно batching — DataLoader/collate.

**«Validation тоже `model.train()`».**\
Нет.

**«`eval()` заменяет `no_grad()`».**\
Нет.

**«Среднее batch ROC-AUC = dataset ROC-AUC».**\
Нет.

**«Последний epoch = лучший».**\
Нет.

**«`state_dict` хранит architecture class code».**\
Нет, главным образом parameter/buffer states.

**«DL split rules отличаются от ML и leakage не страшен».**\
Нет.

---

## 34. Проверка понимания

1. Dataset vs DataLoader?
2. Что делает shuffle?
3. Когда нужен collate_fn?
4. `train()` vs `eval()`?
5. `eval()` vs `no_grad()`?
6. Почему global metric нельзя всегда average by batch?
7. Что сохраняет state_dict?
8. Что входит resume checkpoint?
9. Зачем overfit one batch?
10. Что такое gradient accumulation?
11. Зачем mixed precision?
12. Что обязательно хранить про preprocessing?

---

## 35. Capstone skeleton

Напишите structure project:

```text
data.py
model.py
train.py
evaluate.py
config.yaml
checkpoints/
```

И опишите responsibility каждого.

Затем задайте lifecycle:

```text
split
→ train loader
→ valid loader
→ model
→ optimizer
→ epochs
→ best checkpoint
→ test
→ inference
```

---

## 36. Что нужно унести

1. DL project — pipeline, не только architecture.
2. Dataset даёт examples, DataLoader — batches.
3. Train/eval modes обязательны.
4. `no_grad` отключает gradient tracking.
5. Validation metrics считаются корректно на whole validation where needed.
6. Best checkpoint выбирается validation.
7. Test остаётся untouched.
8. Resume checkpoint включает optimizer/scheduler state.
9. Input preprocessing — часть model contract.
10. One-batch overfit и dummy forward — базовые debugging tests.
11. Logs/config нужны для reproducibility.
12. Mixed precision/accumulation — engineering tools, а не замена корректности.

## Куда дальше

Последний урок блока отвечает на практический вопрос:

> **зачем обучать большую сеть с нуля, если кто-то уже выучил полезные representations на миллионах объектов?**

Следующая тема — transfer learning и fine-tuning.

## Источники
- PyTorch DataLoader/Dataset documentation.
- PyTorch saving/loading models tutorial.
- PyTorch training recipes.
