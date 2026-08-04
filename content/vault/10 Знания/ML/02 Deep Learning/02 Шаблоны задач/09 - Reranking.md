---
title: "Шаблон — cross-encoder reranking"
tags:
  - deep-learning
  - nlp
  - reranking
  - retrieval
  - rag
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.shablon-cross-encoder-reranking
schema_version: 2
language: ru
app: source
---
# Шаблон — cross-encoder reranking

Retrieval быстро находит кандидатов. Reranker медленнее, но читает `query` и `document` вместе и точнее меняет их порядок.

```text
query + document → Transformer → relevance score
```

## 1. Данные

Одна строка:

```text
query, document, relevance
```

`relevance` может быть:

- `0/1` → binary ranking;
- вещественной/порядковой оценкой → regression/listwise подход;
- выбором лучшего среди кандидатов → group/listwise loss.

## 2. Токенизация пары

```python
encoded = tokenizer(
    queries,
    documents,
    padding=True,
    truncation=True,
    max_length=384,
    return_tensors="pt",
)
```

## 3. Binary cross-encoder

```python
from transformers import AutoModelForSequenceClassification


model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=1,
).to(device)

criterion = torch.nn.BCEWithLogitsLoss()
```

```python
def reranker_step(model, batch, device):
    labels = batch["labels"].float().to(device)
    inputs = {
        key: value.to(device)
        for key, value in batch.items()
        if key != "labels"
    }

    logits = model(**inputs).logits.squeeze(-1)
    loss = criterion(logits, labels)

    return loss, labels.size(0)
```

Для ранжирования нужны сами logits/scores, threshold обычно не нужен.

## 4. Pipeline

```text
query
→ BM25/dense retrieval: top-100
→ cross-encoder: пересчитать 100 scores
→ вернуть top-5/top-10
```

## 5. Negatives

Обучай на кандидатах, которые реально приходят от retrieval. Случайные документы слишком лёгкие и не отражают production.

## 6. Метрики

- MRR;
- nDCG@K;
- Recall@K после полного pipeline;
- latency на один запрос;
- доля запросов без хорошего кандидата.

Reranker не может вернуть документ, который retrieval не включил в кандидаты. Поэтому отдельно измеряй retrieval recall.

## Типовые ошибки

- оценивать пары случайным split, когда один query встречается везде;
- учить на случайных negatives, а тестировать на hard negatives;
- считать Accuracy вместо ranking metrics;
- подавать слишком длинный документ и отрезать полезный фрагмент;
- запускать cross-encoder по всему корпусу.

Сверка готового API: [Sentence Transformers — CrossEncoder Training](https://sbert.net/docs/cross_encoder/training_overview.html).
