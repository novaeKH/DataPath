---
title: "Шаблон — embeddings и retrieval"
tags:
  - deep-learning
  - nlp
  - embeddings
  - retrieval
  - rag
  - template
type: practice
area: dl
status: active
rag: exclude
id: practice.dl.shablon-embeddings-i-retrieval
schema_version: 2
language: ru
app: source
---
# Шаблон — embeddings и retrieval

Задача: по запросу найти релевантные документы, кандидатов или похожие объекты.

```text
query → embedding q [D]
document → embedding d [D]
similarity(q,d) → top-k
```

## 1. Baseline

Сравни:

1. BM25;
2. pretrained embedding-модель без обучения;
3. fine-tuned dual encoder;
4. hybrid BM25 + dense retrieval.

## 2. Mean pooling

```python
import torch
import torch.nn.functional as F


def mean_pool(last_hidden_state, attention_mask):
    mask = attention_mask.unsqueeze(-1).float()
    summed = (last_hidden_state * mask).sum(dim=1)
    counts = mask.sum(dim=1).clamp_min(1e-9)
    return summed / counts


def encode(encoder, input_ids, attention_mask):
    outputs = encoder(
        input_ids=input_ids,
        attention_mask=attention_mask,
    )

    embeddings = mean_pool(
        outputs.last_hidden_state,
        attention_mask,
    )

    return F.normalize(embeddings, p=2, dim=1)
```

## 3. In-batch contrastive loss

Batch должен содержать пары `query_i ↔ positive_document_i`.

```python
temperature = 0.05


def retrieval_step(model, batch, device):
    q_ids = batch["query_input_ids"].to(device)
    q_mask = batch["query_attention_mask"].to(device)
    d_ids = batch["doc_input_ids"].to(device)
    d_mask = batch["doc_attention_mask"].to(device)

    query_embeddings = encode(model, q_ids, q_mask)  # [B,D]
    doc_embeddings = encode(model, d_ids, d_mask)    # [B,D]

    scores = (
        query_embeddings @ doc_embeddings.T
    ) / temperature                                  # [B,B]

    labels = torch.arange(scores.size(0), device=device)

    loss_q_to_d = F.cross_entropy(scores, labels)
    loss_d_to_q = F.cross_entropy(scores.T, labels)
    loss = 0.5 * (loss_q_to_d + loss_d_to_q)

    return loss, scores.size(0)
```

Диагональная пара считается положительной, остальные документы батча — negatives.

## 4. Hard negatives

Полезные negatives:

- BM25 находит похожий, но неверный документ;
- текущая embedding-модель высоко ранжирует неверный документ;
- документ из близкой тематики.

Плохой negative слишком лёгкий и почти не даёт градиента.

> [!warning]
> In-batch negative может случайно быть релевантным. Проверяй false negatives.

## 5. Retrieval на inference

```python
corpus_embeddings = encode_corpus(corpus)
query_embedding = encode_query(query)

scores = query_embedding @ corpus_embeddings.T
top_scores, top_indices = scores.topk(k=10)
```

Для большого корпуса используй ANN-индекс.

## 6. Метрики

| Метрика | Что проверяет |
|---|---|
| Recall@K | попал ли релевантный документ в top-k |
| MRR | насколько рано появился первый релевантный |
| nDCG@K | качество порядка с учётом graded relevance |

Оценивай на уровне запросов, а не отдельных пар.

## 7. Split

Выбери, что должно обобщаться:

- новые запросы;
- новые документы;
- новая предметная область;
- новый временной период.

Не допускай почти одинаковые запросы из одного шаблона в train и test.

## Типовые ошибки

- cosine similarity без нормализации embeddings;
- случайные лёгкие negatives;
- false negatives в batch;
- метрика классификации пар вместо retrieval-метрики;
- весь корпус кодируется заново для каждого запроса;
- retrieval оценивается на обучающих документах без честного сценария.

Для готовой библиотеки сверяй API с [Sentence Transformers Training Overview](https://sbert.net/docs/sentence_transformer/training_overview.html).
