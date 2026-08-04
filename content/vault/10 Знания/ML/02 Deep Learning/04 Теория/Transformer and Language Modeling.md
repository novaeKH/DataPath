---
title: Transformer and Language Modeling
type: concept
area: dl
status: active
aliases:
  - Transformer
  - Трансформер и языковое моделирование
  - Causal Language Model
tags:
  - dl/transformers
  - nlp/language-modeling
math_depth: 2
id: concept.dl.transformer-and-language-modeling
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Transformer and Language Modeling

## Идея за 30 секунд

Transformer block смешивает information между positions через attention, затем независимо преобразует каждую position через FFN. Residual connections и LayerNorm стабилизируют deep optimization. Поскольку attention без positions permutation-equivariant, добавляют positional information. Causal language model использует mask и учится предсказывать следующий token через cross-entropy.

## Input representation

Для token $t_i$:

$$
x_i=e(t_i)+p_i,
$$

где $e(t_i)$ — token embedding, $p_i$ — positional representation.

Варианты:

- learned absolute embeddings;
- sinusoidal encodings;
- relative position bias;
- rotary positional embeddings.

Они кодируют order по-разному и имеют разные extrapolation properties.

## Transformer block

Pre-Norm decoder-style block:

$$
h'
=h+\operatorname{MHA}(\operatorname{LN}(h)),
$$

$$
h_{\text{out}}
=h'
+\operatorname{FFN}(\operatorname{LN}(h')).
$$

Residual path даёт short gradient route и позволяет layer учить correction. LayerNorm стабилизирует scale внутри token features.

Post-Norm переставляет normalization и имеет другую optimization dynamics; нельзя смешивать formulas и code этих variants.

## Feed-Forward Network

Применяется независимо к каждой position:

$$
\operatorname{FFN}(x)
=W_2\phi(W_1x+b_1)+b_2.
$$

Обычно hidden dimension больше $d_{\text{model}}$. Attention смешивает positions, FFN преобразует channels/features внутри position.

## Encoder и decoder

- Encoder использует bidirectional self-attention и строит contextual representations.
- Decoder causal self-attention не видит future.
- Encoder–decoder добавляет cross-attention decoder queries к encoder keys/values.

Architecture выбирают по task: classification/encoding, autoregressive generation или sequence-to-sequence.

## Causal mask

Для position $i$ разрешены keys $j\le i$:

$$
M_{ij}
=
\begin{cases}
0, & j\le i,\\
-\infty, & j>i.
\end{cases}
$$

Без mask training token может увидеть answer справа и loss станет искусственно малым.

## Language modeling objective

Для sequence $t_1,\ldots,t_T$:

$$
p(t_1,\ldots,t_T)
=
\prod_{i=1}^{T}
p(t_i\mid t_{<i}).
$$

Training pairs строятся shift:

```text
input:  [BOS, t1, t2, ..., t(T-1)]
target: [t1,  t2, t3, ..., tT]
```

Cross-entropy:

$$
\mathcal{L}
=-\frac{1}{T}
\sum_{i=1}^{T}
\log p_\theta(t_i\mid t_{<i}).
$$

Это categorical negative log-likelihood / MLE.

Padding tokens исключаются из loss mask; иначе model учится предсказывать padding и metric зависит от batch padding.

## Perplexity

При average NLL на token:

$$
\operatorname{PPL}
=\exp(\mathcal{L}).
$$

Lower лучше при одинаковых tokenizer, vocabulary и evaluation protocol. Perplexity разных tokenizations напрямую не сравнивается.

## Generation

На каждом step model выдаёт logits next token. Decoding:

- greedy;
- beam search для некоторых structured tasks;
- temperature scaling;
- top-$k$;
- nucleus/top-$p$.

Temperature:

$$
p_i
=
\operatorname{softmax}
\left(
\frac{z_i}{\tau}
\right).
$$

$\tau<1$ делает distribution sharper, $\tau>1$ — flatter. Sampling policy не меняет trained likelihood, но сильно меняет output behavior.

## KV cache

При autoregressive generation past keys/values можно хранить и не пересчитывать. KV cache уменьшает repeated compute, но memory растёт с sequence length, layers, heads и batch.

Training обычно обрабатывает sequence параллельно под causal mask; generation последовательно добавляет tokens.

## Training и fine-tuning

- Pretraining: next-token objective на большом corpus.
- SFT: тот же token-level objective на instruction/response pairs, но loss mask может учитывать только response tokens.
- LoRA: low-rank trainable updates к frozen weights.
- QLoRA: quantized base plus LoRA adapters.

Fine-tuning data format и loss mask определяют, чему model учится; неверная граница prompt/answer создаёт target leakage или обучение копировать prompt.

## Что если assumptions нарушены

- Missing causal mask → future leakage.
- Position scheme outside trained range → degradation.
- Incorrect padding/loss mask → biased loss.
- Tokenizer mismatch → invalid IDs/metrics.
- `train()` during evaluation → active dropout.
- Generation without stop rules → runaway sequence.
- Good perplexity не гарантирует factuality, alignment или task utility.

## Связи

- [[Embeddings and Attention]] — Q/K/V, scaling, masks и multi-head.
- [[Neural Networks and Backpropagation]] — Linear/activation/loss/computational graph.
- [[Optimization and Regularization in Deep Learning]] — AdamW, LayerNorm, dropout и stability.
- [[Likelihood MLE and MAP]] — cross-entropy как MLE.
- [[NLP and Transformers — Interview]] — короткие ответы.
