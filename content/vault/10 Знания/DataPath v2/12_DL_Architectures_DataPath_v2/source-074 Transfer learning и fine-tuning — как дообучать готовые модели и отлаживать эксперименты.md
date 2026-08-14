---
title: "Transfer learning и fine-tuning — как дообучать готовые модели и отлаживать эксперименты"
id: concept.datapath-v2.074
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 74
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Transfer learning и fine-tuning: как использовать уже обученные представления

Обучить CNN или Transformer с нуля может потребовать:

- огромный dataset;
- GPU-hours;
- careful optimization.

Но часто существует pretrained model, которая уже научилась полезным representations.

**Перенос обучения (transfer learning)** использует knowledge pretrained model для новой задачи.

**Дообучение (fine-tuning)** обновляет часть или все pretrained parameters на новом dataset.

Это один из самых практичных подходов современного DL.

---

## 1. Почему transfer работает

Early/middle representations часто переиспользуемы.

Vision model может уже знать patterns:

```text
edges
textures
shapes
object parts
```

Language model:

```text
syntax
semantics
contextual patterns
```

Новая задача не обязана учить всё с нуля.

---

## 2. Feature extractor mode

Первый вариант:

```text
pretrained backbone frozen
→ новые features
→ train only new head
```

Например image model:

```text
ResNet backbone
→ 2048-d representation
→ new Linear for 5 classes
```

Backbone parameters:

```python
for p in backbone.parameters():
    p.requires_grad = False
```

Head обучается.

---

## 3. Full fine-tuning

Второй вариант:

```text
load pretrained
→ replace task head
→ update all or most parameters
```

Это позволяет representations адаптироваться к domain.

Но выше:

- compute;
- overfit risk на small data;
- риск разрушить useful pretrained features слишком большим lr.

---

## 4. Gradual unfreezing

Компромисс:

```text
сначала head
→ затем upper backbone layers
→ затем больше layers
```

Это называется gradual unfreezing как general strategy.

Не всегда нужно, но полезно при small data/domain shift.

---

## 5. Learning rate pretrained backbone vs new head

New head:

```text
random initialization
```

может требовать larger lr.

Pretrained layers:

```text
already useful
```

часто fine-tune меньшим lr.

Можно использовать parameter groups.

```python
optimizer = torch.optim.AdamW([
    {"params": backbone.parameters(), "lr": 1e-5},
    {"params": head.parameters(), "lr": 1e-3},
])
```

---

## 6. Frozen parameters и optimizer

Если `requires_grad=False`, gradients для этих parameters не вычисляются обычным образом.

Но важно также не включать unnecessary frozen parameters в optimizer groups для ясности.

После unfreeze optimizer configuration может потребовать update/recreation.

---

## 7. `model.eval()` не значит freeze weights

Это очень частая ошибка.

`model.eval()`:

- меняет Dropout;
- меняет BatchNorm behavior.

Но parameters всё ещё могут иметь:

```text
requires_grad=True
```

и участвовать в backprop.

Freeze:

```python
p.requires_grad = False
```

— другой механизм.

---

## 8. BatchNorm при frozen backbone

Тонкий вопрос.

Даже если weights frozen, `model.train()` заставит BatchNorm обновлять running statistics.

Иногда это desired adaptation, иногда разрушает pretrained stats при tiny batches/domain.

Поэтому transfer learning требует осознанного handling:

- frozen parameters;
- module train/eval states;
- normalization behavior.

Нет одного универсального recipe.

---

## 9. Vision transfer learning

Typical:

```text
pretrained CNN/ViT
→ replace classifier
→ train head
→ optionally fine-tune backbone
```

Preprocessing должен соответствовать pretrained weights.

В torchvision weights objects часто предоставляют recommended transforms.

Это важно: pretrained features ожидают определённое input distribution.

---

## 10. NLP fine-tuning

Transformer pretrained objective может быть:

```text
masked language modeling
next-token prediction
```

Для classification добавляется task head или используется architecture-specific head.

Fine-tuning dataset может быть в тысячи раз меньше pretraining corpus.

---

## 11. Tokenizer нельзя случайно менять

Pretrained Transformer embedding table соответствует конкретному vocabulary/tokenizer.

Если взять другой tokenizer:

```text
ID 123
```

будет означать другой token.

Model получит бессмысленные embeddings.

Поэтому:

> tokenizer/version — часть pretrained model contract.

---

## 12. Sequence length и memory

Fine-tuning Transformer memory сильно зависит от:

```text
batch size
sequence length
hidden size
layers
```

Attention memory растёт примерно quadratically по sequence length.

Иногда уменьшить max length полезнее, чем уменьшить batch не думая.

---

## 13. Parameter-efficient fine-tuning

Большую LLM дорого full fine-tune.

Появились методы **параметрически эффективного дообучения (Parameter-Efficient Fine-Tuning, PEFT)**.

Идея:

```text
base weights mostly frozen
→ train small added/adaptation parameters
```

Один известный подход — LoRA.

---

## 14. LoRA intuition

Вместо полного update большой matrix:

\[
W'=W+\Delta W,
\]

LoRA parameterizes update low-rank factors:

\[
\Delta W=BA,
\]

где rank \(r\) намного меньше full dimension.

Training updates A/B, base W может оставаться frozen.

Плюсы:

- меньше trainable parameters;
- меньше optimizer state memory;
- удобно хранить adapters.

---

## 15. LoRA не уменьшает все memory costs

Хотя trainable parameters меньше, forward activations base model всё равно существуют.

Поэтому:

> LoRA делает fine-tuning легче, но не превращает огромную model в бесплатную.

Memory также тратится на:

- weights;
- activations;
- attention;
- KV/cache depending setting.

---

## 16. Catastrophic forgetting

При aggressive fine-tuning на узком/small dataset model может потерять часть pretrained capabilities.

Это **катастрофическое забывание (catastrophic forgetting)**.

Mitigation ideas:

- smaller lr;
- freeze more layers;
- shorter training;
- mixed data;
- adapters/LoRA.

Но степень проблемы зависит от task.

---

## 17. Domain shift

ImageNet-pretrained CNN → medical microscopy.

Representation transfer может быть хуже, чем:

```text
ImageNet → everyday objects
```

потому что visual domain отличается.

Но pretrained low-level features всё равно иногда помогают.

Transfer usefulness нужно измерять, не предполагать.

---

## 18. Baseline: pretrained vs scratch

Обязательно сравнить:

```text
small model from scratch
pretrained frozen
pretrained fine-tuned
```

Иногда pretrained model dramatically wins.

Иногда domain/size делает simpler approach competitive.

---

# Отладка fine-tuning

## 19. Сначала проверить head

Если frozen backbone:

```text
train loss вообще снижается?
```

Если нет:

- head shapes;
- labels;
- loss;
- optimizer;
- features;
- dtype.

Не надо сразу unfreeze всю model.

---

## 20. Проверить trainable parameter count

```python
trainable = sum(
    p.numel()
    for p in model.parameters()
    if p.requires_grad
)
```

Очень полезно вывести:

```text
total params
trainable params
```

Так сразу видно, действительно ли freeze сработал.

---

## 21. Проверить optimizer groups

Можно accidentally:

- не добавить new head;
- забыть unfrozen layer;
- использовать одинаковый lr, хотя планировали differential.

Печать optimizer param group sizes/lrs — простой sanity check.

---

## 22. Overfit tiny subset

Как и раньше:

```text
взять 20–100 samples
→ попытаться почти memorise
```

Если fine-tuning pipeline не может overfit tiny clean subset, full dataset запускать рано.

---

## 23. Train loss падает, validation нет

Возможны:

- overfit;
- label noise;
- domain mismatch;
- bad split;
- leakage inverse issue;
- threshold/metric mismatch.

Actions:

```text
more regularization
less unfreezing
smaller lr
early stopping
augmentation
better data
```

Но сначала error analysis.

---

## 24. Validation лучше frozen, хуже full fine-tune

Это частый result на small data.

Interpretation:

```text
pretrained features useful
full updates overfit / destroy useful representation
```

Можно попробовать:

- lower backbone lr;
- partial unfreeze;
- stronger regularization;
- fewer epochs.

---

## 25. Learning rate finder intuition

Если lr явно неясен, можно провести короткий experiment, постепенно increasing lr и смотреть loss behavior.

Но автоматический LR finder — heuristic.

Главнее:

- reasonable range;
- validation;
- training curves.

---

## 26. Checkpoint pretrained fine-tune

Сохраняем:

```text
base model identifier/version
tokenizer / preprocessing version
adapter/head state
optimizer if resume
config
metrics
```

Если LoRA adapter зависит от конкретного base checkpoint, это должно быть явно записано.

---

## 27. Reproducibility и model hub

Если pretrained model загружается по mutable alias вроде:

```text
latest
```

через год weights могут отличаться.

Для serious experiment полезно фиксировать:

- exact model revision/checkpoint;
- library version;
- tokenizer revision.

---

## 28. Data quality важнее architecture

Большая pretrained model может быстро overfit:

- duplicate examples;
- wrong labels;
- leakage;
- shortcut features.

Fine-tuning не исправляет bad dataset.

Напротив, powerful representation может эксплуатировать shortcuts ещё эффективнее.

---

## 29. Fine-tuning LLM: instruction data

Для generative model training example может иметь structure:

```text
system/instruction
user input
assistant target
```

Loss часто считают по target tokens according to training setup, иногда masks exclude prompt tokens.

Очень важно понимать data collator/trainer semantics: на каких tokens реально считается loss.

Не копировать instruction fine-tuning script без проверки labels mask.

---

## 30. Evaluation generative models

Loss/perplexity не всегда достаточно.

Нужны task-specific checks:

- exact match;
- F1;
- factuality;
- format adherence;
- human evaluation;
- safety constraints.

Generative evaluation сложнее simple classification.

---

## 31. Transfer learning и leakage

Pretrained model уже видела огромные datasets.

Если benchmark examples могли входить в pretraining, это contamination concern.

Для ordinary company dataset это часто менее критично, но для benchmark claims важно.

Также нельзя fine-tune on validation/test.

---

## 32. Полный practical decision tree

```text
Есть pretrained model close to task?
│
├─ нет → train reasonable baseline from scratch
│
└─ да
   ↓
   freeze backbone + train head
   ↓
   enough quality?
   ├─ да → stop/simple solution
   └─ нет
      ↓
      partial/full fine-tune
      ↓
      compare validation
      ↓
      consider PEFT if model huge
```

---

## 33. Интерактивная визуализация DataPath

### Freeze/unfreeze

Network layers с lock icons.

Показать trainable parameter count.

### Differential LR

Head red arrow bigger step, backbone smaller.

### LoRA

Full weight matrix + low-rank A/B adapter.

Slider rank показывает trainable parameters.

### Experiment curves

Compare:

```text
scratch
frozen
full fine-tune
LoRA
```

Train/validation curves на toy task.

---

## 34. Типичные ошибки

**«`eval()` замораживает weights».**\
Нет.

**«Fine-tuning = обязательно обновлять все parameters».**\
Нет.

**«Pretrained model всегда лучше scratch».**\
Нет.

**«LoRA обучает всю weight matrix».**\
Нет, обычно low-rank adapters при frozen/mostly frozen base.

**«Tokenizer можно заменить, если vocab size такой же».**\
Нет.

**«Frozen BatchNorm автоматически ведёт себя как eval».**\
Не обязательно: module mode отдельный.

**«Большая model исправит маленький bad dataset».**\
Нет.

---

## 35. Проверка понимания

1. Transfer learning vs fine-tuning?
2. Feature extractor mode?
3. Почему pretrained backbone часто использует smaller lr?
4. `eval()` vs freeze?
5. Почему BatchNorm transfer tricky?
6. Что такое PEFT?
7. Что делает LoRA?
8. Почему tokenizer part of model contract?
9. Что такое catastrophic forgetting?
10. Почему tiny-subset overfit test полезен?
11. Что фиксировать в checkpoint metadata?
12. Почему full fine-tune может быть хуже frozen?

---

## 36. Capstone-практика

Задача:

```text
15 000 изображений
5 классов
Apple Silicon laptop для прототипа
есть pretrained ResNet
```

План:

1. baseline;
2. preprocessing;
3. freeze strategy;
4. new head;
5. optimizer/lr groups;
6. augmentation;
7. validation split;
8. early stopping;
9. checkpoint;
10. criteria for partial unfreeze;
11. inference preprocessing.

Вторая задача:

```text
50 000 текстовых примеров
binary classification
pretrained Transformer
```

Сравните:

```text
TF-IDF + Logistic Regression
frozen embeddings/head
full fine-tune
PEFT
```

по quality, memory, speed и complexity.

---

## 37. Как объяснить на собеседовании

### Transfer learning

Используем representations model, обученной на большой исходной задаче, для новой downstream task.

### Fine-tuning

Продолжаем gradient-based training части или всех pretrained parameters на downstream data.

### LoRA

Представляет update некоторых large matrices через low-rank factors, уменьшая число trainable parameters и optimizer-state cost.

### Как начать small dataset?

С strong simple baseline, затем pretrained frozen backbone/head, и только если нужно — постепенно fine-tune с меньшим lr и validation control.

---

## 38. Что нужно унести

1. Pretraining позволяет переиспользовать learned representations.
2. Frozen feature extraction — самый простой transfer regime.
3. Fine-tuning обновляет pretrained parameters.
4. Head и backbone могут иметь разные learning rates.
5. `eval()` и freezing — разные механизмы.
6. Normalization behavior при transfer нужно контролировать.
7. Tokenizer/preprocessing must match pretrained model.
8. PEFT уменьшает trainable parameter budget.
9. LoRA использует low-rank updates.
10. Fine-tuning может вызвать overfit/catastrophic forgetting.
11. Scratch/frozen/fine-tuned approaches надо сравнивать.
12. Tiny-subset overfit, parameter-count и optimizer-group checks критичны.
13. Model/data/checkpoint revisions — часть reproducibility.
14. Большая pretrained model не исправляет leakage и плохие labels.

---

## Куда дальше: от Deep Learning к NLP

Теперь архитектурная линия Deep Learning выглядит цельно:

```text
MLP
→ CNN
→ pooling / residual hierarchy
→ RNN
→ LSTM / GRU
→ embeddings
→ attention
→ Transformer
→ PyTorch project workflow
→ transfer learning / fine-tuning
```

Следующий естественный крупный блок — **NLP**:

- текстовая предобработка и токенизация;
- TF-IDF baseline;
- embeddings;
- sequence classification;
- Transformer-based NLP;
- оценка NLP models.

## Источники
- PyTorch transfer learning tutorials.
- torchvision pretrained weights/transforms documentation.
- Hugging Face fine-tuning documentation.
- Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models".
