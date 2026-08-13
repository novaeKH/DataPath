---
title: "Reranking и многоступенчатый retrieval pipeline"
id: concept.datapath-v2.088
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 88
canonical_course: "LLM и RAG"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Reranking: почему первый поиск не обязан быть идеальным

Fast retriever must search thousands/millions chunks.

It uses compressed relevance signal:
- BM25 lexical score;
- embedding vector similarity.

A **переранжировщик (reranker)** can spend more compute on small candidate set.

Architecture:

```text
query
→ fast retrieval top 50
→ reranker
→ top 5
→ LLM
```

This is classic multi-stage information retrieval.

---

## 1. Bi-encoder vs cross-encoder

Dense retriever usually **bi-encoder**:

```text
query → vector
document → vector
similarity
```

Document embeddings precomputed.

Fast.

---

## 2. Cross-encoder

A **CrossEncoder** reads query and document together:

```text
[query ; document]
→ Transformer
→ relevance score
```

Because tokens can interact directly, relevance modeling richer.

But cannot precompute one universal document vector for every future query.

Expensive for entire corpus.

---

## 3. Why two-stage works

Stage 1:
```text
cheap + high recall
```

Stage 2:
```text
expensive + high precision
```

If candidate relevant document never appears in stage 1, reranker cannot rescue it.

Therefore:
> retrieval recall is upper bound reranking success.

---

## 4. Candidate size

Retrieve:
```text
20
50
100
```

Rerank:
```text
top 3–10 final
```

Too few candidates:
- miss evidence.

Too many:
- reranking latency/cost.

Tune on retrieval evaluation.

---

## 5. Pairwise relevance

Cross-encoder input:
```text
query: "как удалить аккаунт"
doc: "Инструкция по закрытию профиля..."
```

Model outputs relevance score.

It sees exact relationship between query tokens and document tokens.

This can distinguish:
- same topic but wrong operation;
- semantically nearby but irrelevant chunk.

---

## 6. Reranking long chunks

Cross-encoder has max sequence length.

If query+chunk exceed limit:
- truncate;
- chunk smaller;
- use specialized long model.

Silent truncation may remove relevant evidence.

---

## 7. LLM reranking

An LLM can rerank candidates by prompt:
```text
rank these passages by relevance
```

Pros:
- flexible;
- can apply instructions.

Cons:
- expensive;
- slower;
- output parsing;
- position/order biases;
- less stable.

Dedicated rerankers often better retrieval component when available.

---

## 8. Pointwise vs listwise

### Pointwise
Score each document independently.

### Pairwise
Compare document pairs.

### Listwise
Consider list jointly/rank positions.

Different reranking models/training objectives exist.

For system designer core idea:
> relevance model operates after candidate generation.

---

## 9. Diversity

Top five reranked chunks might all repeat same paragraph.

Need diversity/coverage:
- dedup;
- one per parent section;
- maximal marginal relevance-like selection;
- subtopic coverage.

Relevance alone may not maximize answer evidence.

---

## 10. MMR intuition

**Maximal Marginal Relevance (MMR)** balances:
```text
relevance to query
vs
novelty relative to already selected docs
```

Concept:
\[
score=
\lambda relevance
-(1-\lambda) redundancy.
\]

Useful when top results near-duplicates.

---

## 11. Multi-hop queries

Question:
```text
"Кто руководит компанией, разработавшей продукт X?"
```

May require:
1. retrieve doc mapping product→company;
2. second retrieval company→leader.

Single-pass reranking cannot create missing second-hop query automatically.

Need query decomposition/agentic retrieval.

---

## 12. Query decomposition

Complex query:
```text
compare policy A and policy B on refunds
```

Can split:
```text
retrieve A refund policy
retrieve B refund policy
```

Then combine evidence.

This increases recall/coverage.

---

## 13. Metadata-aware reranking

Reranker semantic score may prefer obsolete doc.

Final scoring can incorporate:
```text
semantic relevance
authority
freshness
permissions
source quality
```

Not all ranking should be neural.

---

## 14. Context packing

After rerank, selected chunks must fit context.

Packing strategy:
- preserve source/title;
- avoid duplicates;
- order logically;
- reserve output tokens.

Can choose:
```text
top until token budget
```
but small relevant chunks may deserve priority over one huge chunk.

---

## 15. Citation mapping

Each context block should carry stable source ID:
```text
[DOC_17_CHUNK_4]
```

Then generated citations can map answer claims back to source.

Do not rely on model inventing file names from text.

---

## 16. Retrieval trace

For debugging store:
```text
query
rewritten query
BM25 candidates
dense candidates
fusion rank
reranker score
selected chunks
```

Without trace, RAG failure appears as one opaque bad answer.

---

## 17. Latency budget

Example:
```text
query embedding       20 ms
vector/BM25 retrieval 30 ms
rerank 50 docs       150 ms
LLM generation       800 ms
```

Optimization target depends bottleneck.

Reducing vector search 30→20 ms irrelevant if LLM 2 seconds.

---

## 18. Cache

Can cache:
- query embeddings;
- retrieval results;
- reranking results;
- final responses if safe/current.

But document updates/permissions require cache invalidation.

---

## 19. Evaluate stage-by-stage

Measure each stage separately: a high-quality generator cannot recover evidence lost before reranking.

### Retriever
Recall@k.

### Reranker
nDCG/MRR/Recall in top final.

### Generator
answer correctness/faithfulness.

This localization tells where improvement needed.

---

## 20. Интерактивная визуализация DataPath

### Bi vs cross encoder

Show separate encoding vs joint token interaction.

### Candidate funnel

```text
100k chunks
→ 50 retrieve
→ 5 rerank
→ 3 context
```

### Failure

Relevant doc rank 70 when retriever top50:
reranker never sees it.

### Diversity

Duplicate chunks replaced by distinct supporting evidence.

---

## 21. Типичные ошибки

**«Reranker can fix missing candidate».**\
No.

**«Cross-encoder should score entire million-doc corpus».**\
Usually too expensive.

**«Higher reranker score universally means probability relevance».**\
Not necessarily calibrated.

**«Top chunks can be sent without dedup».**\
Wasteful.

**«Reranking only neural score matters».**\
Freshness/authority can matter.

**«One RAG metric enough».**\
Need stage-level evaluation.

---

## 22. Проверка понимания

1. Bi-encoder vs cross-encoder?
2. Why two-stage?
3. What limits final recall?
4. Candidate size trade-off?
5. Why long chunk problem?
6. What is MMR?
7. Why multi-hop needs decomposition?
8. Why retrieval trace?
9. What stage metrics?
10. Why source IDs needed?

---

## 23. Мини-практика

System:
```text
1 million chunks
latency SLA 1.5 sec
```

Design:
1. retrieve candidate count;
2. BM25+dense;
3. reranker;
4. final context count;
5. dedup;
6. trace/logging;
7. metrics.

---

## Что нужно унести

1. Fast retrieval and precise reranking solve different scales.
2. Bi-encoder precomputes document vectors.
3. Cross-encoder jointly reads query/document and is slower but richer.
4. Reranker cannot recover missing candidates.
5. Candidate count balances recall and latency.
6. Diversity prevents context redundancy.
7. Complex queries may need decomposition/multi-hop retrieval.
8. Context packing/citation IDs are explicit system stages.
9. Log retrieval trace for debugging.
10. Evaluate retrieval and reranking separately.

## Куда дальше

We now have:
```text
query
→ candidates
→ reranked evidence
```

Next step:
> feed evidence to LLM and constrain answer around it.

This full architecture is RAG.

## Источники
- Neural reranking / cross-encoder retrieval literature.
- Multi-stage information retrieval practice.
