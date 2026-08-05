---
title: Embeddings and Attention
id: concept.dl.embeddings-and-attention
type: concept
area: dl
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Эмбеддинги и attention
- Self-attention
- Scaled Dot-Product Attention
tags:
- dl/transformers
- nlp/embeddings
math_depth: 2
---

# Embeddings and Attention

## Embedding с нуля

Discrete token/category ID нельзя подавать как continuous number: ID `100` не «в два раза больше» ID `50`. Embedding хранит trainable vector для каждого ID.

$$
E\in\mathbb R^{V\times d},\qquad e_t=E[t].
$$

Это lookup строки matrix. Similar IDs могут оказаться близко только если objective этого требует.

## Static и contextual embeddings

Static embedding слова одинаков в каждом context. Transformer создаёт contextual representation: vector token зависит от surrounding tokens.

Similarity обычно измеряют cosine, но её смысл зависит от training data, pooling и normalization.

## Зачем attention

Каждая position может собрать информацию из других positions. Для query формируются:

- Query — что ищем;
- Key — по чему сравниваем;
- Value — какую информацию переносим.

$$
Q=XW_Q,\quad K=XW_K,\quad V=XW_V.
$$

## Scaled dot-product attention

$$
A=\operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}+M\right),
\qquad
O=AV.
$$

Score matrix shape:

```text
(B, heads, T_query, T_key)
```

Softmax выполняется по key axis.

## Почему scale

Variance dot product растёт с $d_k$. Большие logits насыщают softmax. Деление на $\sqrt{d_k}$ стабилизирует scale.

## Masks

Padding mask запрещает attention к padding. Causal mask запрещает смотреть в future.

Если вся строка masked, softmax может дать NaN в некоторых implementations — нужен корректный handling.

## Multi-head

Каждая head имеет свои projections. Outputs concat и проходят через $W_O$. Heads могут учить разные relation patterns, но не обязаны иметь понятную человеческую роль.

## Cross-attention

Queries поступают из одной sequence, Keys/Values — из другой. Используется в encoder-decoder, multimodal models и retrieval-conditioned generation.

## Complexity

Standard self-attention требует $O(T^2)$ scores по sequence length. Memory-efficient kernels уменьшают intermediate memory, но exact dependency остаётся quadratic по pair count.

## Attention не объяснение

Высокий attention weight показывает route текущего mechanism, но не causal importance. Изменение value, residual path и downstream layers влияет на output.

## Визуализация

Компонент `attention-matrix-lab`:

- short sentence tokens;
- Q/K vectors;
- dot scores;
- scaling;
- mask;
- softmax rows;
- weighted values;
- multi-head tabs.

## Частые ошибки

- token IDs как numbers;
- softmax по wrong axis;
- missing causal/padding mask;
- Q/K/V shapes mixed;
- all-masked row;
- attention weights = explanation;
- cosine raw unnormalized embeddings;
- huge sequence without memory estimate.

## Связи

- [[Tensors Shapes and Linear Layers]]
- [[Transformer and Language Modeling]]
- [[Linear Algebra for ML]]
