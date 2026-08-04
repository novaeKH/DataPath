---
title: NLP and Transformers — Interview
type: interview
area: career
status: active
aliases:
  - Transformers Interview
tags:
  - interview/nlp
  - interview/dl
id: interview.career.nlp-and-transformers-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# NLP and Transformers — Interview

> Knowledge: [[Classical NLP Foundations]], [[Embeddings and Attention]], [[Transformer and Language Modeling]].

## Вопрос 1 — Что такое embedding?

### Ответ 20–30 секунд

Embedding — trainable lookup table, которая сопоставляет discrete token dense vector. Геометрия vectors обучается вместе с task: похожие contexts получают полезные для objective representations. Это не гарантирует универсальную semantic distance.

### Если попросят глубже

Lookup эквивалентен умножению one-hot vector на embedding matrix, но реализуется без sparse multiplication. Tokenization определяет vocabulary и granularity representations.

### Follow-up

- Чем static embeddings отличаются от contextual?
- Что делать с unseen token?

### Связанные знания

- [[Embeddings and Attention]]
- [[Linear Algebra for ML]]

## Вопрос 2 — Как работает self-attention?

### Ответ 20–30 секунд

Из каждого token строятся query, key и value. Scores $QK^\top/\sqrt{d_k}$ показывают, куда смотреть; softmax превращает их в weights, а weighted sum values создаёт новое representation. Self-attention связывает позиции напрямую, но имеет quadratic cost по sequence length.

### Если попросят глубже

Scale $\sqrt{d_k}$ не даёт logits расти вместе с dimension и насыщать softmax. Multi-head attention позволяет разным projections учить разные patterns взаимодействия.

### Follow-up

- Почему attention без positional information не знает порядок?
- Как mask влияет на scores?

### Связанные знания

- [[Embeddings and Attention]]
- [[Transformer and Language Modeling]]

## Вопрос 3 — Из чего состоит Transformer block?

### Ответ 20–30 секунд

Block содержит attention, position-wise feed-forward network, residual connections и LayerNorm. Attention смешивает информацию между positions, MLP преобразует channels каждой позиции, residual paths поддерживают gradient flow.

### Если попросят глубже

В decoder-only model attention causal. В encoder все tokens обычно видят друг друга. Pre-norm чаще стабилен для deep models, но точная architecture зависит от implementation.

### Follow-up

- Чем encoder отличается от decoder?
- Зачем после attention нужен MLP?

### Связанные знания

- [[Transformer and Language Modeling]]
- [[Optimization and Regularization in Deep Learning]]

## Вопрос 4 — Зачем positional encoding и causal mask?

### Ответ 20–30 секунд

Attention сам по себе permutation-equivariant, поэтому positional encoding добавляет информацию о порядке. Causal mask запрещает позиции использовать future tokens: перед softmax соответствующим logits ставится $-\infty$. Это сохраняет autoregressive training objective.

### Если попросят глубже

Positions могут быть absolute, relative или rotary. Causal mask не заменяет padding mask: они исключают разные связи.

### Follow-up

- Почему teacher forcing не создаёт leakage при causal mask?
- Чем RoPE отличается от learned positional embeddings?

### Связанные знания

- [[Transformer and Language Modeling]]

## Вопрос 5 — Как обучается language model?

### Ответ 20–30 секунд

Autoregressive language model оценивает probability следующего token по предыдущим. Для каждого position logits проходят cross entropy с true next token; это negative log-likelihood categorical distribution. Training параллелен по positions благодаря causal mask, generation идёт последовательно.

### Если попросят глубже

Perplexity — exponential average token cross entropy и зависит от tokenization. Низкий next-token loss не гарантирует factuality или полезность для downstream product.

### Follow-up

- Почему cross entropy связана с MLE?
- Чем temperature меняет generation?

### Связанные знания

- [[Transformer and Language Modeling]]
- [[Likelihood MLE and MAP]]
- [[Random Variables and Distributions]]
