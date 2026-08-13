---
title: "Chunking, BM25, dense retrieval и гибридный поиск"
id: concept.datapath-v2.087
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 87
canonical_course: "LLM и RAG"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Chunking, BM25 и гибридный поиск: почему retrieval начинается до embedding

RAG often fails before LLM sees anything.

Reason:
> knowledge base was cut and indexed badly.

Document:
```text
80-page manual
```

Embedding whole manual into one vector loses local details.

Cut every sentence separately:
- loses context;
- returns fragments without definition.

**Разбиение на фрагменты (chunking)** controls unit retrieval.

Then we must choose retrieval signals:
- lexical BM25;
- dense embeddings;
- hybrid.

---

## 1. What is chunk

Chunk is retrievable unit:
```text
paragraph
section
several paragraphs
table fragment
code function
```

RAG context typically constructed from top chunks, not full documents.

---

## 2. Too large chunks

Pros:
- preserve context.

Cons:
- embedding averages multiple topics;
- irrelevant tokens consume context;
- reranker/generator reads noise;
- exact evidence buried.

---

## 3. Too small chunks

Pros:
- precise matching.

Cons:
- missing definitions/context;
- pronouns without referents;
- fragments nonsensical;
- many near-duplicates.

Optimal size depends document type and questions.

---

## 4. Overlap

Sliding chunk:
```text
chunk 1: tokens 1–300
chunk 2: 251–550
```

50-token overlap prevents important sentence split exactly at boundary.

But overlap:
- increases index size;
- creates duplicate retrieval.

Use only enough to preserve continuity.

---

## 5. Structure-aware chunking

Better than fixed tokens when document has:
```text
H1
H2
paragraphs
lists
code blocks
tables
```

Keep semantic sections together within max size.

For Markdown:
```text
split by headings
→ recursively split oversized sections
```

For code:
- function/class boundaries.

---

## 6. Parent-child retrieval

Index small child chunks for precise search.

Return larger parent section for context.

Pipeline:
```text
query
→ retrieve child
→ map to parent
→ send parent/neighbor context
```

Combines precision and context.

---

## 7. Metadata per chunk

Store:
```text
document_id
title
section
page
chunk_index
date
source
permissions
```

This supports:
- citations;
- filtering;
- neighboring chunks;
- deduplication.

---

# BM25

## 8. Why lexical search still matters

Query:
```text
ERR_CONNECTION_REFUSED
```

Dense embedding may semantically approximate, but exact token match is extremely valuable.

Product IDs:
```text
ABC-1049
```

Names/acronyms:
```text
NT-proBNP
```

Lexical methods excel.

---

## 9. TF-IDF limitation for retrieval

TF-IDF is baseline, but BM25 adds useful document-length and term-frequency saturation behavior.

A term appearing 20 times should not necessarily be 20x stronger than once.

---

## 10. BM25 intuition

A common BM25 score sums query-term contributions:

\[
score(D,Q)=
\sum_{q\in Q}
IDF(q)\cdot
\frac{
f(q,D)(k_1+1)
}{
f(q,D)+k_1(1-b+b\frac{|D|}{avgdl})
}.
\]

You do not need memorize formula perfectly.

Understand three ideas:
1. rare terms weighted higher;
2. term frequency saturates;
3. document length normalized.

---

## 11. `k1`

Controls term-frequency saturation.

Large `k1`:
- repeated term keeps adding value longer.

Small:
- fast saturation.

---

## 12. `b`

Controls document-length normalization.

```text
b=0
→ no length normalization

b≈1
→ stronger normalization
```

Defaults vary library; tune/evaluate only when needed.

---

## 13. BM25 tokenization matters

Lexical search quality depends:
- case normalization;
- stemming/lemmatization;
- language analyzer;
- handling punctuation/IDs.

For Russian, morphological processing can improve some queries but harm exact names.

Hybrid strategies help.

---

# Dense retrieval

## 14. Dense strength

Query:
```text
"как отменить перевод"
```

Document:
```text
"возврат банковской операции"
```

No exact words, but semantic model may connect them.

---

## 15. Dense weakness

Rare exact identifiers:
```text
error 0x80070005
```

or:
```text
function `calculate_gain_v2`
```

may not be represented precisely enough.

Lexical BM25 catches exact overlap.

---

# Hybrid search

## 16. Why hybrid

Combine candidate lists:
```text
BM25
+
dense
```

One catches exact terminology.
One catches semantic paraphrases.

Hybrid often improves recall.

---

## 17. Score normalization problem

BM25 score:
```text
12.8
```

cosine:
```text
0.73
```

Can't just add raw scores naively.

Options:
- normalize scores;
- learn fusion;
- rank-based fusion.

---

## 18. Reciprocal Rank Fusion

**Reciprocal Rank Fusion (RRF)** combines ranks rather than incomparable scores.

\[
RRF(d)
=
\sum_r
\frac1{k+rank_r(d)}.
\]

Document ranked high in either retriever gains score.

`k` is a smoothing constant; exact choice empirical.

RRF simple and robust.

---

## 19. Candidate recall vs final precision

Retriever stage often optimizes:
> do not miss relevant chunks.

So retrieve broader candidate set:
```text
top 20–100
```

Then reranker narrows to:
```text
top 3–10
```

This separates recall and precision responsibilities.

---

## 20. Neighbor expansion

If top chunk 17 retrieved, answer may depend on chunk 16 definition.

Can expand:
```text
chunk 16
17
18
```

But uncontrolled expansion wastes context.

Useful if document structure sequential.

---

## 21. Deduplication

Overlap causes:
```text
chunk A
chunk A' 90% same
chunk A'' same sentence
```

If all fill top context, model sees repeated evidence instead of diverse information.

Deduplicate by:
- chunk ID/parent;
- similarity;
- overlap-aware grouping.

---

## 22. Freshness

Knowledge changes.

Metadata:
```text
updated_at
version
valid_from
```

Can filter/boost current docs.

Do not let obsolete manual outrank current policy only because wording matches better.

---

## 23. Source authority

Not all sources equal.

Company policy > old chat message.

Retrieval rank can incorporate:
- authority tier;
- document status;
- official source;
- recency.

This is system design beyond semantic similarity.

---

## 24. Query expansion

Lexical query:
```text
"refund"
```

Could expand:
```text
refund reimbursement возврат
```

But generated expansions can introduce drift.

Hybrid dense retrieval often provides semantic expansion implicitly.

---

## 25. Evaluation dataset

For each representative query record:
```text
relevant chunk IDs/doc IDs
```

Then evaluate:
- Recall@k;
- MRR;
- nDCG;
- hit rate.

Without retrieval labels, tuning chunk size/top-k is mostly guesswork.

---

## 26. MRR

Mean Reciprocal Rank emphasizes position first relevant result:

\[
RR=
\frac1{\text{rank first relevant}}.
\]

If first relevant at rank 1:
```text
1.0
```

rank 5:
```text
0.2
```

Average over queries → MRR.

---

## 27. nDCG

Useful when relevance graded:
```text
highly relevant
partially relevant
irrelevant
```

Rewards relevant docs near top with logarithmic position discount.

Exact formula less important than use case.

---

## 28. Интерактивная визуализация DataPath

### Chunk size

One document, slider:
```text
100
300
800 tokens
```
show retrieved units.

### BM25 saturation

Term frequency 1→20, curve contribution saturates.

### Dense vs lexical

Queries:
- paraphrase;
- exact error code.

Show winner.

### RRF

Two rank lists → combined rank calculation.

---

## 29. Типичные ошибки

**«Embedding entire PDF as one vector».**\
Often poor for local QA.

**«Smaller chunks always more precise».**\
Can lose context.

**«BM25 obsolete because embeddings exist».**\
No.

**«Raw BM25 + cosine scores can be added directly».**\
Scales incomparable.

**«Hybrid means concatenate all results».**\
Need fusion/dedup/ranking.

**«Overlap should be huge to preserve everything».**\
Creates redundancy.

---

## 30. Проверка понимания

1. Why chunk?
2. Large vs small chunks?
3. Why overlap?
4. Structure-aware chunking?
5. BM25 three core ideas?
6. Dense strengths?
7. Lexical strengths?
8. Why hybrid?
9. What RRF combines?
10. Why candidate recall first?

---

## 31. Мини-практика

Docs:
- API reference with function names;
- long policy PDFs;
- Russian support FAQ;
- code repository docs.

Design chunking/retrieval for each:
1. chunk unit;
2. overlap;
3. BM25/dense;
4. metadata;
5. neighbor expansion;
6. evaluation metric.

---

## Что нужно унести

1. Chunking defines retrieval granularity.
2. Too-large chunks dilute relevance.
3. Too-small chunks lose context.
4. Structure-aware chunking often beats fixed slicing.
5. BM25 remains strong exact-term retrieval.
6. Dense search handles paraphrases.
7. Hybrid search combines complementary signals.
8. RRF fuses rankings without raw-score compatibility.
9. Retrieval should optimize candidate recall before reranking.
10. Dedup/freshness/authority are practical relevance factors.

## Куда дальше

Hybrid retrieval may return 50 plausible chunks.

Now we need a more expensive model to answer:
> which of these candidates actually best matches query?

This is **reranking**.

## Источники
- Robertson & Zaragoza, BM25.
- Information-retrieval ranking metrics literature.
- Reciprocal Rank Fusion literature.
