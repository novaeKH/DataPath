---
title: "Оценка и отладка RAG-систем"
id: concept.datapath-v2.090
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 90
canonical_course: "LLM и RAG"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Оценка RAG-систем: почему одного «ответ выглядит хорошо» недостаточно

RAG has multiple stages.

Final answer can be wrong because:
- query rewrite;
- chunking;
- retrieval;
- fusion;
- reranking;
- context packing;
- generator;
- citation.

If only inspect final answer, you don't know what to fix.

Correct evaluation decomposes system.

---

## 1. Build evaluation set first

Create representative questions.

For each, ideally store:
```text
query
expected answer / criteria
relevant source IDs
answerable? yes/no
metadata constraints
difficulty/category
```

Evaluation set should contain real user question styles, not only clean synthetic prompts.

---

## 2. Retrieval gold

For question:
```text
"What is refund deadline?"
```

mark relevant chunks/docs.

Then evaluate retriever independent of LLM.

Without gold relevance, you cannot know whether top-k changed for better.

---

## 3. Recall@k

Question-level simple form:
> did top-k contain at least one relevant chunk?

Can also compute fraction relevant documents retrieved.

High Recall@k important candidate generation.

If Recall@20 poor, reranker cannot fix missed docs.

---

## 4. Precision@k

\[
Precision@k=
\frac{\text{relevant retrieved among top k}}{k}.
\]

For RAG final context, high precision matters because irrelevant chunks distract/cost tokens.

---

## 5. MRR

First relevant rank.

\[
RR=\frac1{rank}.
\]

Mean across queries.

Useful when one best answer passage desired near top.

---

## 6. nDCG

Handles graded relevance and rank position.

Good when several chunks:
- exact answer;
- supporting context;
- tangential.

---

## 7. Reranker evaluation

Take same candidate set.

Compare:
```text
before rerank
after rerank
```

Metrics:
- MRR;
- nDCG;
- Recall@small-k.

If reranker doesn't improve top5 while adds 200ms, remove/retrain it.

---

## 8. Generation correctness

Need task-specific rubric.

For factual QA:
```text
correct
partially correct
incorrect
insufficient evidence
```

Could use human annotation or validated automatic judge.

LLM-as-judge useful but not ground truth.

---

## 9. Faithfulness / groundedness

Question:
> Is each factual claim supported by provided sources?

Answer can be factually true from model memory but unsupported by context.

If system promises source-grounded answers, this is still failure.

---

## 10. Relevance of answer

A response may be grounded but not answer question.

Source contains:
```text
full vacation policy
```

Model summarizes everything instead of answering deadline.

Need answer relevance separately.

---

## 11. Citation precision

For each citation:
> Does cited source support associated claim?

### Citation recall
> Are claims that need evidence actually cited?

A response with one correct citation can still contain many uncited claims.

---

## 12. Answerability

Include unanswerable questions.

If corpus lacks answer, ideal system:
```text
"В доступных источниках этого нет."
```

Measure:
- false answer rate on unanswerable;
- abstention precision/recall.

This directly tests hallucination control.

---

## 13. Conflict tests

Evaluation should include:
```text
old vs new policy
two departments
two versions
```

Expected:
- choose current/authorized;
- mention conflict if unresolved.

This tests metadata, not only embedding.

---

## 14. Exact-term tests

Queries with:
```text
error code
product ID
function name
```

ensure BM25/hybrid path works.

---

## 15. Paraphrase tests

Same answer asked in:
- formal wording;
- colloquial wording;
- Russian/English;
- typo/noisy message.

Tests dense retrieval robustness.

---

## 16. Long/multi-hop questions

Examples:
```text
"Compare A and B"
"Which team owns product whose policy says X?"
```

May require multiple chunks/query decomposition.

Label as separate difficulty category.

---

## 17. Slice evaluation

Report by:
```text
question type
language
document type
source
time
answerable/unanswerable
single/multi-hop
```

Global 85% can hide 30% on PDFs.

---

## 18. Failure taxonomy

For each bad answer label root cause:

```text
R1 query rewrite
R2 parsing
R3 chunk boundary
R4 retrieval miss
R5 reranker
R6 stale source
R7 context packing
G1 ignored evidence
G2 unsupported claim
G3 citation error
```

Now improvement becomes targeted.

---

## 19. Offline vs online metrics

Offline:
- Recall@k;
- groundedness;
- answer accuracy;
- latency benchmark.

Online:
- user success;
- reformulation rate;
- escalation;
- clicks/citation opens;
- abandonment.

User satisfaction alone noisy, but operationally important.

---

## 20. LLM-as-judge

Another LLM can score:
- correctness;
- faithfulness;
- style.

Pros:
- scalable;
- flexible rubrics.

Cons:
- judge bias;
- position bias;
- model self-preference;
- prompt sensitivity;
- judge can hallucinate.

Best:
> calibrate judge against human-labeled sample.

---

## 21. Pairwise evaluation

Compare system A/B:
```text
same question
same source corpus
```

Judge/human chooses:
- A better;
- B better;
- tie.

Pairwise can be more stable than absolute 1–10 scoring.

---

## 22. Synthetic eval generation

LLM can generate questions from documents.

Useful to bootstrap.

But synthetic questions may:
- mirror source phrasing;
- be too easy;
- not reflect users.

Mix with real queries.

---

## 23. Regression suite

Every fixed bug becomes test case.

Example:
```text
query with product code previously missed
```

Add to regression set.

Before deployment:
```text
new RAG config
→ run regression
```

Prevents reintroducing old failures.

---

## 24. Latency

Track p50/p95/p99:
- embedding;
- lexical/vector retrieval;
- reranker;
- LLM generation;
- total.

Average hides tail latency.

---

## 25. Cost

Per query:
```text
embedding calls
reranker calls
prompt tokens
completion tokens
```

RAG config can improve score by 0.5% but double cost.

Need quality-cost frontier.

---

## 26. Index size/build time

Operational metrics:
- number chunks;
- vector storage;
- build time;
- update time;
- stale-index delay.

Chunk overlap can silently double storage.

---

## 27. Retrieval observability

Log safe identifiers:
```text
query_id
retrieved chunk IDs
scores
rank
reranker score
source version
```

Avoid logging sensitive text indiscriminately.

Observability must respect privacy/security.

---

## 28. Prompt/version trace

For every answer know:
```text
generator model version
embedding model
reranker
prompt version
index version
retrieval params
```

Otherwise A/B debugging impossible.

---

## 29. Evaluation-driven development

Bad:
```text
change chunk size
change embedding
change prompt
change top-k
→ result seems nicer
```

Better:
```text
baseline eval
→ identify failure group
→ change one stage
→ rerun relevant eval
```

Same scientific method as ML.

---

## 30. Example diagnosis

Metrics:

```text
Recall@20 = 0.96
Recall@5  = 0.62
final answer accuracy = 0.58
```

Interpretation:
- candidate retriever strong;
- ranking top positions poor;
- reranker/context selection likely bottleneck.

Do not first replace generator LLM.

---

## 31. Another diagnosis

```text
Recall@20 = 0.55
reranker nDCG high on candidates
```

Reranker fine.
Problem before it:
- chunking;
- lexical/dense retrieval;
- query representation.

---

## 32. Интерактивная визуализация DataPath

### Metric funnel

```text
retrieval recall
→ rerank precision
→ groundedness
→ answer accuracy
```

### Failure debugger

Given traces, learner picks failing stage.

### A/B configs

Change top-k/chunk size and see quality-latency-cost.

### Unanswerable set

Model must abstain when no evidence.

---

## 33. Типичные ошибки

**«Final answer metric enough».**\
No.

**«Retriever recall high means RAG good».**\
Generator can still fail.

**«LLM judge is objective ground truth».**\
No.

**«Synthetic eval alone sufficient».**\
No.

**«Average latency enough».**\
Need tail latency.

**«Change all pipeline components together».**\
Then no attribution.

**«Unanswerable questions unnecessary».**\
They are key hallucination test.

---

## 34. Проверка понимания

1. What belongs eval dataset?
2. Recall@k?
3. Precision@k?
4. Why reranker evaluate separately?
5. Faithfulness vs correctness?
6. Citation precision?
7. Why unanswerable examples?
8. LLM-as-judge limitations?
9. Why regression suite?
10. What trace versions store?

---

## 35. Мини-практика

RAG:
```text
Recall@20 92%
top5 relevance 60%
faithfulness 91%
answer correctness 67%
p95 latency 2.8 sec
```

Make priority plan:
1. which stage improve first;
2. what metric confirms improvement;
3. whether generator is main issue;
4. what latency stages profile.

---

## Что нужно унести

1. RAG must be evaluated stage-by-stage.
2. Retrieval needs relevance labels and ranking metrics.
3. Groundedness differs from factual correctness.
4. Unanswerable/conflicting queries are essential tests.
5. Failure taxonomy localizes root causes.
6. LLM judges are scalable but must be calibrated.
7. Real + synthetic eval best combined.
8. Regression tests preserve fixed failures.
9. Latency/cost/index freshness are production metrics.
10. Every answer should be traceable to system/index versions.

## Куда дальше

RAG still follows a mostly fixed pipeline.

What if model can decide:
- whether to search;
- which tool to call;
- whether to calculate;
- whether to retrieve again?

This moves toward **AI agents**.

## Источники
- Information retrieval evaluation metrics.
- RAG evaluation / grounded QA literature.
