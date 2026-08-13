---
title: "Декодирование — greedy, beam search, temperature, top-k и top-p"
id: concept.datapath-v2.084
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 84
canonical_course: "LLM и RAG"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Декодирование: почему одна и та же LLM может отвечать по-разному

После forward pass model выдаёт probability distribution next token.

Например:

| Token | Probability |
|---|---:|
| обучение | 0.42 |
| модель | 0.25 |
| алгоритм | 0.15 |
| система | 0.08 |
| ... | ... |

Как выбрать один token?

Это задача **декодирования (decoding)**.

Разные decoding strategies меняют:
- determinism;
- diversity;
- repetition;
- creativity;
- factual stability.

Они не меняют weights model, только способ выбора output.

---

## 1. Greedy decoding

Выбираем token с максимальной probability:

\[
x_t=\arg\max_i P(i|context).
\]

Плюсы:
- deterministic;
- simple;
- fast.

Минусы:
- locally best token не обязательно ведёт к best whole sequence;
- может давать repetitive/boring output.

---

## 2. Почему local optimum не sequence optimum

На first step:

```text
A = 0.55
B = 0.45
```

Greedy выбирает A.

Но continuation:

```text
A → best next 0.20
B → best next 0.90
```

Sequence probabilities:

```text
A-path = 0.55 × 0.20 = 0.11
B-path = 0.45 × 0.90 = 0.405
```

Greedy missed higher-probability full sequence.

---

## 3. Beam search

Beam search хранит несколько best partial sequences.

При beam size 3:

```text
step 1 → keep top 3 prefixes
step 2 → expand each
→ keep top 3 total
...
```

Это приближённый поиск high-probability sequence.

---

## 4. Где beam search хорош

Historically strong for:
- machine translation;
- speech recognition;
- tasks с constrained output.

Для open-ended conversational LLM large beam can produce generic repetitive text.

Sampling methods often preferred for natural generation.

---

## 5. Sampling

Вместо `argmax` случайно выбираем token согласно probabilities.

Если:

```text
A 0.6
B 0.3
C 0.1
```

то за many generations:
- A around 60%;
- B 30%;
- C 10%.

Sampling introduces controlled randomness.

---

## 6. Temperature

Modify logits:

\[
p_i
=
softmax\left(\frac{z_i}{T}\right).
\]

### \(T<1\)

Distribution sharper.

High-probability tokens dominate stronger.

### \(T>1\)

Distribution flatter.

Low-probability alternatives get more chance.

### \(T\to0\)

Approaches greedy-like behavior.

---

## 7. Temperature example

Raw logits:
```text
3, 2, 1
```

At low T:
```text
first token dominates
```

At high T:
```text
distribution more even
```

Temperature does **not** inject knowledge or reasoning.

It only reshapes sampling distribution.

---

## 8. top-k

Keep only k highest-scoring tokens.

Example:
```text
vocab = 50k
top_k = 50
```

All except top 50 receive zero sampling probability after filtering.

Benefit:
- prevents very unlikely tail tokens.

Problem:
- fixed k ignores distribution shape.

Sometimes top 5 too restrictive; other contexts top 500 still mostly nonsense.

---

## 9. top-p / nucleus sampling

Choose smallest set tokens whose cumulative probability reaches \(p\).

Example probabilities:

```text
0.40
0.30
0.15
0.08
...
```

For:

```text
top_p=0.85
```

set:
```text
0.40 + 0.30 + 0.15 = 0.85
```

Only these tokens sampled.

Candidate set adapts to uncertainty context.

---

## 10. top-k + top-p

Runtimes often allow combining filters.

Conceptually:
1. adjust logits temperature;
2. apply filters;
3. renormalize;
4. sample.

Exact order/implementation can vary by library.

Do not assume every API combines them identically without docs.

---

## 11. Repetition penalties

Generative systems may alter logits to discourage repeated tokens/sequences.

This can reduce:
```text
the the the...
```

But aggressive penalty can damage legitimate repetition:
- code variable names;
- technical terms;
- structured output.

---

## 12. Frequency / presence penalties

Some APIs expose penalties based on:
- whether token appeared;
- how often it appeared.

These are decoding controls, not fundamental Transformer algorithms.

Exact semantics API-specific.

---

## 13. Stop sequences

External runtime can terminate generation when output contains pattern:

```text
"\nUser:"
```

Useful for:
- templates;
- tool protocols;
- structured generation.

But stop matching may happen token/string-level depending system.

---

## 14. Max new tokens

Always bound generation.

Without limit:
- cost/latency unpredictable;
- model may ramble;
- malformed loop may continue.

`max_new_tokens` counts output tokens, distinct from total context length conceptually.

---

## 15. Determinism

Even temperature >0 can be made reproducible-ish with fixed random seed in controlled runtime.

But exact reproducibility may still differ across:
- hardware;
- kernels;
- software versions;
- distributed execution.

Greedy is more deterministic by design.

---

## 16. Structured tasks

For:
```text
JSON
SQL
classification label
```

low-randomness decoding often preferable.

But strongest approach may be:
- constrained decoding;
- grammar;
- function/tool schemas.

Temperature alone cannot guarantee valid JSON.

---

## 17. Creative tasks

For:
```text
story
brainstorm
taglines
```

sampling with moderate temperature/top-p gives diversity.

But too high randomness:
- factual errors;
- incoherence;
- format violations.

---

## 18. Factual QA

For knowledge QA, decoding randomness is not main truth-control.

More important:
- correct retrieval;
- current sources;
- grounding;
- verification.

Lower temperature can make output more stable but not automatically correct.

---

## 19. Self-consistency

For reasoning tasks one strategy:
- sample several independent solutions;
- aggregate/vote.

Idea:
```text
diverse reasoning paths
→ majority answer
```

This spends more compute and does not guarantee correctness.

It is an inference technique, not model training.

---

## 20. Beam length bias

Sequence probability product decreases with length, so beam search often uses length normalization/penalty.

Otherwise shorter sequences may be favored.

Exact scoring varies implementation.

---

## 21. Log probabilities

Multiplying tiny probabilities causes underflow.

Use log-space:

\[
\log P(sequence)
=
\sum_t \log P(x_t|x_{<t}).
\]

Beam search tracks log-probability sums.

---

## 22. Интерактивная визуализация DataPath

### Distribution

5 token bars.

Slider temperature:
```text
0.2 → 2.0
```

### Greedy vs sample

Run 20 generations and show distribution outputs.

### top-k

Slider k hides tail tokens.

### top-p

Cumulative probability bar adapts candidate count.

### Beam tree

Visual tree 3 steps, compare greedy path vs best beam path.

---

## 23. Типичные ошибки

**«Temperature меняет model knowledge».**\
Нет.

**«Temperature=0 означает mathematically divide by zero in every API».**\
APIs often special-case deterministic mode; check implementation.

**«top-k и top-p обучают model быть safer».**\
Нет, inference filtering.

**«Beam search always best quality».**\
Нет.

**«Low temperature prevents hallucination».**\
Нет.

**«Sampling probability = truth probability».**\
Нет.

---

## 24. Проверка понимания

1. Greedy decoding?
2. Why greedy can miss best sequence?
3. Beam search?
4. Temperature effect?
5. top-k?
6. top-p?
7. Why top-p adaptive?
8. Stop sequences?
9. Why log probability?
10. When use deterministic/constrained generation?

---

## 25. Мини-практика

Выберите decoding profile:

A. JSON extraction\
B. Creative story\
C. Translation\
D. RAG factual answer\
E. Generate 10 diverse product names

Для каждого explain:
- greedy/sampling/beam;
- temperature;
- top-p/top-k;
- constraint needs.

---

## Что нужно унести

1. Decoding transforms next-token distribution into sequence.
2. Greedy selects local maximum.
3. Beam keeps several prefixes.
4. Sampling adds controlled randomness.
5. Temperature sharpens/flattens distribution.
6. top-k keeps fixed number candidates.
7. top-p keeps adaptive probability mass.
8. Decoding controls style/diversity more than factuality.
9. Structured tasks often need constrained output, not only low temperature.
10. Factual grounding comes later through context/retrieval.

## Куда дальше

Decoding chooses **how** to continue.

But behavior also depends on **what context model sees**.

Next lesson:
- system message;
- user instructions;
- few-shot examples;
- conversation history;
- context-window budget.

## Источники
- Standard neural text-generation literature and common decoding formulations.
