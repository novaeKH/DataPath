---
title: "Шаблон — классификация текста через Transformer"
tags:
  - deep-learning
  - nlp
  - transformer
  - text-classification
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.shablon-klassifikatsiia-teksta-cherez-transformer
schema_version: 2
language: ru
app: source
---
# Шаблон — классификация текста через Transformer

Пример: определение тематики банковского обращения.

## Формы

```text
input_ids      [B,T] long
attention_mask [B,T]
labels         [B] long
logits         [B,C]
loss           CrossEntropyLoss
```

## 1. Baseline

До Transformer обучи `TF-IDF + Logistic Regression`. Если Transformer не превосходит baseline честно, сначала проверь данные и validation.

## 2. Tokenizer, Dataset и dynamic padding

```python
from torch.utils.data import DataLoader
from transformers import AutoTokenizer, DataCollatorWithPadding


MODEL_NAME = "distilbert-base-multilingual-cased"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

train_dataset = TextDataset(
    texts=train_texts,
    labels=train_labels,
    tokenizer=tokenizer,
    max_length=256,
)

collator = DataCollatorWithPadding(tokenizer=tokenizer)

train_loader = DataLoader(
    train_dataset,
    batch_size=16,
    shuffle=True,
    collate_fn=collator,
)
```

Класс `TextDataset` есть в [[10 Знания/ML/02 Deep Learning/01 База/03 - Dataset и DataLoader]].

## 3. Модель

```python
from transformers import AutoModelForSequenceClassification


model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=num_classes,
    id2label=id2label,
    label2id=label2id,
).to(device)

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=2e-5,
    weight_decay=0.01,
)
```

## 4. `task_step`

Если в `batch` есть `labels`, Hugging Face-модель вернёт loss:

```python
def text_classification_step(model, batch, device):
    batch = {
        key: value.to(device)
        for key, value in batch.items()
    }

    outputs = model(**batch)
    loss = outputs.loss

    return loss, batch["labels"].size(0)
```

Для собственного взвешенного loss:

```python
outputs = model(
    input_ids=batch["input_ids"],
    attention_mask=batch["attention_mask"],
)

logits = outputs.logits
loss = weighted_criterion(logits, batch["labels"])
```

## 5. Прогноз

```python
model.eval()

with torch.inference_mode():
    outputs = model(
        input_ids=input_ids.to(device),
        attention_mask=attention_mask.to(device),
    )
    predictions = outputs.logits.argmax(dim=1)
```

## 6. Метрики

- `macro F1` — основная при несбалансированных тематиках;
- per-class Precision/Recall;
- confusion matrix;
- ошибки по длине текста;
- ошибки на новых формулировках и опечатках.

## 7. Что настраивать в первую очередь

```text
max_length
learning rate
batch size
число эпох
class weights / sampling
заморозка первых слоёв при очень малых данных
```

Не начинай с перебора десятков моделей. Сначала получи честный baseline и стабильный pipeline.

## Типовые ошибки

- fit tokenizer на всех данных, если tokenizer обучается с нуля;
- padding до глобального max length вместо dynamic padding;
- не передать `attention_mask`;
- один диалог попал и в train, и в valid;
- считать только Accuracy;
- слишком высокий lr для pretrained Transformer;
- забыть восстановить лучший checkpoint.

Официальный рецепт: [Hugging Face — Text classification](https://huggingface.co/docs/transformers/tasks/sequence_classification).
