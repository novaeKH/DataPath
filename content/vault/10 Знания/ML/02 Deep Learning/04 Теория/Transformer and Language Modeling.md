---
title: Transformer and Language Modeling
id: concept.dl.transformer-and-language-modeling
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
- Transformer
- Трансформер и языковое моделирование
- Causal Language Model
tags:
- dl/transformers
- nlp/language-modeling
math_depth: 2
---

# Transformer and Language Modeling

## Общая схема

Transformer block состоит из:

1. attention — обмен information между positions;
2. feed-forward network — преобразование features каждой position;
3. residual connections;
4. normalization.

Decoder-only causal Transformer предсказывает следующий token.

## Tokenization

Tokenizer преобразует text в token IDs. Token может быть словом, частью слова, символом или byte fragment. Vocabulary и tokenization определяют sequence length и meaning perplexity.

Special tokens: BOS, EOS, PAD, UNK — зависят от model.

## Input representation

$$
x_i=e(t_i)+p_i.
$$

Position information может быть absolute, relative, RoPE или bias. Attention без position не различает order.

## Pre-Norm block

$$
h'=h+\operatorname{MHA}(\operatorname{LN}(h)),
$$

$$
h_{out}=h'+\operatorname{FFN}(\operatorname{LN}(h')).
$$

Residual даёт короткий gradient path. LayerNorm стабилизирует feature scale.

## Feed-forward network

$$
\operatorname{FFN}(x)=W_2\phi(W_1x+b_1)+b_2.
$$

Attention смешивает positions, FFN — channels внутри каждой position.

## Causal language modeling

Probability sequence:

$$
p(t_1,\dots,t_T)=\prod_{i=1}^{T}p(t_i\mid t_{<i}).
$$

Training shift:

```text
input:  [BOS, t1, t2, ..., t(T-1)]
target: [t1,  t2, t3, ..., tT]
```

Cross-entropy усредняется по valid target tokens. Padding исключается mask.

## Perplexity

$$
PPL=\exp(\text{average token NLL}).
$$

Сравнивать PPL корректно только при одинаковых tokenizer, data и evaluation protocol.

## Generation

На каждом step model выдаёт logits. Strategies:

- greedy;
- temperature;
- top-k;
- top-p;
- beam search в подходящих tasks.

Lower temperature делает distribution sharper. Sampling не улучшает knowledge model, а меняет выбор tokens.

## KV cache

При generation past Keys/Values сохраняются. Это уменьшает repeated compute, но memory растёт с layers, sequence, heads и batch.

## Encoder, decoder, encoder-decoder

- encoder: bidirectional context, classification/representation;
- decoder: causal generation;
- encoder-decoder: input sequence → output sequence через cross-attention.

## Training stages

- pretraining;
- supervised fine-tuning;
- preference/alignment stages;
- domain adaptation;
- PEFT/LoRA.

Loss mask определяет, обучается ли model на prompt tokens или только response.

## Визуализация

Компонент `transformer-block-lab`:

- tokens and positions;
- causal attention mask;
- residual stream;
- attention + FFN;
- shifted targets;
- step-by-step generation and KV cache.

## Частые ошибки

- future leakage без causal mask;
- tokenizer mismatch;
- loss по padding;
- train/eval mode confusion;
- generation без EOS/limit;
- сравнивать PPL разных tokenizers;
- считать low loss guarantee factuality;
- fine-tune с неверной prompt/answer mask.

## Связи

- [[Embeddings and Attention]]
- [[Fine-Tuning Transfer Learning and PEFT]]
- [[Training Evaluation and Inference in PyTorch]]
