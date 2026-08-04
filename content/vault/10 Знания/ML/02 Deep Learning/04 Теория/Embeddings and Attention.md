---
title: Embeddings and Attention
type: concept
area: dl
status: active
aliases:
  - Эмбеддинги и attention
  - Self-attention
  - Scaled Dot-Product Attention
tags:
  - dl/transformers
  - nlp/embeddings
math_depth: 2
id: concept.dl.embeddings-and-attention
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Embeddings and Attention

## Идея за 30 секунд

Embedding превращает discrete ID/token в learned vector. Attention позволяет каждому query собрать weighted combination values по similarity с keys. В scaled dot-product attention scores $QK^\top$ делят на $\sqrt{d_k}$, затем mask и softmax превращают их в weights. Multi-head attention учит несколько projection spaces.

## Embedding lookup

Embedding matrix:

$$
E\in\mathbb{R}^{V\times d}.
$$

Для token ID $t$:

$$
e_t=E[t].
$$

Это lookup row, эквивалентный multiplication one-hot vector на $E$, но без materialization sparse one-hot.

Embedding coordinates не имеют фиксированного смысла; geometry появляется из objective и data. Similarity полезна только после проверки representation и normalization.

## Query, Key и Value

Для input representations $X\in\mathbb{R}^{T\times d_{\text{model}}}$:

$$
Q=XW_Q,
\qquad
K=XW_K,
\qquad
V=XW_V.
$$

- Query: что текущая position ищет.
- Key: по чему сравнивать source positions.
- Value: какую информацию передавать при высоком weight.

В self-attention Q/K/V происходят из одной sequence; в cross-attention query и key/value sources различаются.

## Scaled dot-product attention

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt{d_k}}+M
\right)V.
$$

Shapes для одного head:

$$
Q\in\mathbb{R}^{T_q\times d_k},
\quad
K\in\mathbb{R}^{T_k\times d_k},
\quad
V\in\mathbb{R}^{T_k\times d_v}.
$$

Score matrix имеет shape $T_q\times T_k$; softmax обычно по keys dimension.

## Почему делят на $\sqrt{d_k}$

Если components query/key independent с unit variance, dot product variance растёт примерно как $d_k$. Большие logits насыщают softmax: weights становятся почти one-hot, gradients малы/нестабильны.

Division на $\sqrt{d_k}$ удерживает scale logits примерно сопоставимым при изменении head dimension.

## Softmax и weighted sum

Для query $i$:

$$
\alpha_{ij}
=
\frac{
\exp(s_{ij})
}{
\sum_{\ell}\exp(s_{i\ell})
},
$$

$$
o_i=\sum_j\alpha_{ij}v_j.
$$

Weights не являются causal importance. Они показывают mechanism текущей model при данной parameterization, но explanation требует осторожности.

## Masks

Mask $M$ добавляет:

- $0$ для разрешённых pairs;
- большое отрицательное значение/$-\infty$ для запрещённых.

После softmax запрещённые weights становятся zero.

### Padding mask

Не позволяет собирать информацию из padding tokens.

### Causal mask

Position $t$ не видит positions $>t$. Это предотвращает future-token leakage при autoregressive language modeling.

Mask shape/broadcast — частый источник silent bugs.

## Multi-head attention

Для head $h$:

$$
\operatorname{head}_h
=
\operatorname{Attention}
(XW_Q^{(h)},XW_K^{(h)},XW_V^{(h)}).
$$

Затем:

$$
\operatorname{MHA}(X)
=
\operatorname{Concat}(\operatorname{head}_1,\ldots,\operatorname{head}_H)W_O.
$$

Heads имеют разные projection matrices и могут специализироваться на разных relation patterns. Нельзя гарантировать human-interpretable role каждого head.

## Complexity

Self-attention score matrix требует:

$$
O(T^2)
$$

memory/time по sequence length для standard implementation. Long-context methods используют sparse/local/linear approximations или memory optimizations, меняя exact computation.

## Failure modes

- забыть padding/causal mask;
- softmax по неверной dimension;
- перепутать $d_{\text{model}}$, head dimension и number of heads;
- считать token IDs continuous numbers;
- сравнивать raw embeddings cosine без normalization/context;
- интерпретировать attention weight как causal contribution;
- получить NaN из all-masked row.

## Связи

- [[Linear Algebra for ML]] — dot products, projections и matrix shapes.
- [[Random Variables and Distributions]] — softmax weights и categorical distributions.
- [[Neural Networks and Backpropagation]] — Linear projections и gradients.
- [[Transformer and Language Modeling]] — residual block, positional information и causal LM.
- [[NLP and Transformers — Interview]] — короткий формат.
