---
title: "Векторные представления текста и семантический поиск"
id: concept.datapath-v2.086
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 86
canonical_course: "LLM и RAG"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Векторные представления текста и семантический поиск

Классический поиск по словам хорошо находит literal overlap.

Query:

```text
"как вернуть деньги за двойное списание"
```

Document:

```text
"возврат средств при повторном списании операции"
```

Words частично different, meaning близкий.

**Векторное представление (embedding)** отображает text в dense vector:

\[
f(text)\in\mathbb R^d
\]

так, чтобы semantic similarity можно было приближённо измерять distance/similarity vectors.

Это foundation dense retrieval и RAG.

---

## 1. Embedding — не список keywords

Embedding:

```text
[-0.12, 0.38, ..., 0.07]
```

обычно сотни/тысячи dimensions.

Отдельная dimension редко имеет human-readable meaning.

Useful information distributed across vector.

---

## 2. Sentence/document embedding

Token embeddings — vectors tokens.

Для retrieval нужен usually one vector:
- sentence;
- paragraph;
- chunk;
- document.

Embedding model учится создавать representation whole text suitable for similarity tasks.

Это не автоматически любой `[CLS]` hidden state arbitrary Transformer.

Training objective matters.

---

## 3. Cosine similarity

Один common measure:

\[
cos(a,b)=
\frac{a\cdot b}
{\|a\|\|b\|}.
\]

Range theoretically:
\[
[-1,1].
\]

Larger cosine → directions more similar.

If vectors normalized:
\[
\|a\|=\|b\|=1,
\]
then:
\[
cos(a,b)=a\cdot b.
\]

---

## 4. Dot product

Some embedding models/search indexes use raw inner product:

\[
a^Tb.
\]

If vector norms vary, dot product and cosine rankings can differ.

Therefore:
> similarity metric must match how embedding model/index was designed.

Do not normalize blindly if model documentation expects raw dot product.

---

## 5. Euclidean distance

\[
d(a,b)=\|a-b\|_2.
\]

For unit-normalized vectors, cosine and Euclidean ranking closely related:

\[
\|a-b\|^2=2-2cos(a,b).
\]

So for normalized vectors one can convert between geometric interpretations.

---

## 6. Semantic neighborhood

Suppose vector space places:

```text
"refund card payment"
near
"return money after card charge"
```

and far from:
```text
"weather in Moscow"
```

Then query vector can retrieve nearest chunks without exact word overlap.

This is **семантический поиск (semantic search)**.

---

## 7. How embedding models are trained

Common broad idea:
- positive pairs should be close;
- negative pairs farther.

Pairs may be:
- query/document;
- paraphrases;
- sentence pairs;
- contrastive batches.

Exact loss differs by model.

Contrastive training is crucial: generic language-model representations are not necessarily optimal retrieval embeddings.

---

## 8. Contrastive objective intuition

Anchor:
```text
"как сменить пароль"
```

Positive:
```text
"инструкция по изменению пароля"
```

Negative:
```text
"как оформить кредит"
```

Training pushes:
\[
sim(anchor,positive)
>
sim(anchor,negative).
\]

---

## 9. Symmetric vs asymmetric retrieval

### Symmetric

Sentence similarity:
```text
text ↔ text
```

### Asymmetric

Search:
```text
short query → longer document
```

Some models use special query/document prefixes/instructions:
```text
query: ...
passage: ...
```

Ignoring those may hurt retrieval.

---

## 10. Multilingual embeddings

A multilingual embedding model can place semantically similar texts from different languages near each other.

Example:
```text
"возврат денег"
"money refund"
```

This enables cross-language retrieval.

But quality can vary strongly by language/domain.

---

## 11. Domain adaptation

General embedding model may not understand:
- internal acronyms;
- medical codes;
- company product names.

Options:
- better domain model;
- fine-tuning on query-document pairs;
- hybrid lexical+dense search;
- metadata filters.

Do not assume embedding automatically solves domain vocabulary.

---

## 12. Vector database mental model

A vector index stores:

```text
id
embedding
metadata
original text/reference
```

At query:
```text
query text
→ query embedding
→ nearest neighbors
→ top-k chunks
```

The index does not generate answer.

It only returns candidates.

---

## 13. Exact nearest-neighbor search

For N vectors:

```text
compute similarity query to every vector
→ sort
```

Accurate but O(Nd) per query.

Fine for small corpora.

Millions/billions vectors need approximate methods.

---

## 14. Approximate Nearest Neighbor

**Приближённый поиск ближайших соседей (Approximate Nearest Neighbor, ANN)** trades tiny retrieval accuracy for large speed gains.

Examples:
- HNSW;
- IVF;
- product quantization;
- FAISS index families.

Choice depends:
- corpus size;
- memory;
- latency;
- recall target;
- update pattern.

---

## 15. HNSW intuition

**Hierarchical Navigable Small World (HNSW)** builds multi-layer proximity graph.

Search:
```text
start high sparse layer
→ move toward closer nodes
→ descend
→ refine locally
```

Instead of comparing all vectors, traverse promising graph neighbors.

Parameters trade index size/build cost/search recall.

---

## 16. FAISS

FAISS is a library for efficient similarity search/clustering dense vectors.

It offers multiple index types:
- exact;
- inverted-file;
- quantized;
- graph-like options depending integrations.

Important:
> "use FAISS" is not architecture decision enough. Need select index/metric/config.

---

## 17. Metadata filters

Pure semantic nearest neighbor may retrieve wrong product/version.

Store metadata:
```text
language
department
date
product
access_level
document_type
```

Filter:
```text
product = "Takt"
language = "ru"
```

before/with vector search.

This often improves retrieval more than another embedding model.

---

## 18. Access control

In enterprise/private RAG:
> filter permissions **before context reaches LLM**.

Do not retrieve forbidden documents and hope prompt says:
```text
"don't mention them"
```

Authorization belongs to retrieval/data layer.

---

## 19. Top-k

Retriever returns top-k neighbors.

Small k:
- may miss evidence.

Large k:
- more recall;
- more noise;
- context cost.

Top-k is a system hyperparameter, not universal `5`.

---

## 20. Similarity threshold

Can require:
```text
similarity >= threshold
```

But raw similarity scale varies by embedding model/index.

Threshold must be calibrated on evaluation data.

A score 0.75 has no universal meaning.

---

## 21. Retrieval recall

For evaluation set with known relevant docs:
\[
Recall@k=
\frac{\text{relevant docs retrieved in top k}}
{\text{all relevant docs}}
\]
or query-level variants.

Before blaming LLM answer, measure whether retriever actually returned evidence.

---

## 22. Embedding batch creation

Embedding millions chunks should be batched and cached.

Pipeline:
```text
document changed?
→ re-embed only changed chunks
```

This is **инкрементальное обновление (incremental update)**.

Re-embedding whole corpus on every edit is wasteful.

---

## 23. Versioning

Store:
```text
embedding_model_version
chunker_version
vector_dimension
normalization/metric
document_version
```

Changing embedding model usually requires rebuilding compatible vectors/index.

Do not mix vectors from unrelated embedding spaces.

---

## 24. Query rewriting

User query:
```text
"а как это починить?"
```

without conversation context poor standalone retrieval query.

A system can rewrite:
```text
"как исправить ошибку запуска DataPath на macOS"
```

Then embed rewritten query.

But rewriting can distort intent, so evaluate.

---

## 25. Multiple query retrieval

Another approach:
- generate several search queries;
- retrieve for each;
- merge results.

Increases recall but:
- cost;
- duplicate/noisy candidates.

Reranking later helps.

---

## 26. Интерактивная визуализация DataPath

### Vector space

Toy 2D embeddings:
```text
refund
double charge
weather
```

Move query and observe nearest neighbors.

### Similarity

Switch:
```text
cosine
dot product
L2
```

### Exact vs ANN

10k points:
- brute-force comparisons;
- HNSW graph traversal.

### Metadata

Toggle product filter and show irrelevant semantic neighbor disappearing.

---

## 27. Типичные ошибки

**«Embedding vector dimensions have clear meanings».**\
Usually no.

**«Cosine always correct metric».**\
Depends model.

**«Vector database understands text».**\
It indexes vectors.

**«ANN gives guaranteed exact nearest neighbors».**\
Approximate by design.

**«Similarity score is probability relevance».**\
No universal calibration.

**«More top-k always better».**\
More noise/context.

**«Mix embeddings from two models in same index».**\
Usually invalid.

---

## 28. Проверка понимания

1. What is document embedding?
2. Cosine formula?
3. Dot vs cosine?
4. Why retrieval-specific training matters?
5. Symmetric vs asymmetric search?
6. Exact vs ANN?
7. HNSW intuition?
8. Why metadata filters?
9. Why version embeddings?
10. What does Recall@k measure?

---

## 29. Мини-практика

Corpus:
```text
100k internal documents
RU/EN
multiple products
access by team
```

Design:
1. embedding strategy;
2. metadata;
3. cosine/dot based on model docs;
4. top-k evaluation;
5. permission filtering;
6. incremental update.

---

## Что нужно унести

1. Embedding maps text to dense retrieval space.
2. Semantic similarity is geometric approximation.
3. Metric must match model/index design.
4. Retrieval embedding requires suitable training objective.
5. ANN makes large vector search practical.
6. HNSW/FAISS are retrieval infrastructure, not answer generators.
7. Metadata and permissions are core retrieval features.
8. Similarity thresholds/top-k need evaluation.
9. Embedding/index versions must be consistent.
10. Dense search is only one retrieval signal.

## Куда дальше

Dense retrieval finds semantic similarity.

But exact terms, IDs and rare names are often better handled by lexical search.

Next lesson combines:
- chunking;
- BM25;
- dense retrieval;
- hybrid search.

## Источники
- Dense retrieval / contrastive embedding literature.
- FAISS documentation and ANN/HNSW primary references.
