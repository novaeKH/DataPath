---
title: "Шаблон — NER и token classification"
tags:
  - deep-learning
  - nlp
  - ner
  - token-classification
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.shablon-ner-i-token-classification
schema_version: 2
language: ru
app: source
---
# Шаблон — NER и token classification

NER присваивает класс каждому токену: `B-PER`, `I-PER`, `B-ORG`, `O` и т.д.

## Формы

```text
input_ids [B,T]
labels    [B,T] long
logits    [B,T,C]
loss      CrossEntropyLoss, ignore_index=-100
```

## Главная сложность: слово может разбиться на subtokens

```text
"перевыпустить" → ["пере", "##выпустить"]
один word label → несколько tokenizer tokens
```

Нужно выровнять labels с `word_ids()`.

## Выравнивание labels

```python
def tokenize_and_align_labels(examples):
    tokenized = tokenizer(
        examples["tokens"],
        truncation=True,
        is_split_into_words=True,
    )

    aligned_labels = []

    for batch_index, word_labels in enumerate(examples["ner_tags"]):
        word_ids = tokenized.word_ids(batch_index=batch_index)
        previous_word_id = None
        token_labels = []

        for word_id in word_ids:
            if word_id is None:
                token_labels.append(-100)
            elif word_id != previous_word_id:
                token_labels.append(word_labels[word_id])
            else:
                token_labels.append(-100)

            previous_word_id = word_id

        aligned_labels.append(token_labels)

    tokenized["labels"] = aligned_labels
    return tokenized
```

`-100` исключает специальные токены, padding и повторные subtokens из loss.

## Collator и модель

```python
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    DataCollatorForTokenClassification,
)


tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

collator = DataCollatorForTokenClassification(
    tokenizer=tokenizer
)

model = AutoModelForTokenClassification.from_pretrained(
    MODEL_NAME,
    num_labels=num_labels,
    id2label=id2label,
    label2id=label2id,
).to(device)
```

## `task_step`

```python
def ner_step(model, batch, device):
    batch = {
        key: value.to(device)
        for key, value in batch.items()
    }

    outputs = model(**batch)
    return outputs.loss, batch["labels"].size(0)
```

## Метрика

Не считать обычный token Accuracy основной метрикой: класс `O` может доминировать. Используй entity-level F1 через `seqeval`.

Перед метрикой убери позиции `labels == -100`:

```python
predictions = logits.argmax(dim=-1)

true_predictions = []
true_labels = []

for pred_row, label_row in zip(predictions, labels):
    current_pred = []
    current_true = []

    for pred_id, label_id in zip(pred_row, label_row):
        if label_id != -100:
            current_pred.append(id2label[int(pred_id)])
            current_true.append(id2label[int(label_id)])

    true_predictions.append(current_pred)
    true_labels.append(current_true)
```

## Split

Разбивай по документу/диалогу, а не по отдельным предложениям, если предложения связаны.

## Типовые ошибки

- labels не выровнены после subword tokenization;
- padding участвует в loss;
- special tokens получают обычный класс;
- macro/token Accuracy выдаётся вместо entity-level F1;
- нарушена BIO-последовательность;
- части одного документа разнесены по split.

Официальный рецепт: [Hugging Face — Token classification](https://huggingface.co/docs/transformers/tasks/token_classification).
