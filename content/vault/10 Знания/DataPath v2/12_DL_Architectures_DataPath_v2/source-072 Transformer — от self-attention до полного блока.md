---
title: "Transformer — от self-attention до полного блока"
id: concept.datapath-v2.072
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 72
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Transformer: от self-attention до полного блока

В прошлом уроке мы получили ключевую операцию:

\[
Attention(Q,K,V)
=
softmax
\left(
\frac{QK^T}{\sqrt{d_k}}
\right)V.
\]

Но Transformer — это не просто attention.

Полный block объединяет:

```text
multi-head self-attention
residual connection
normalization
feed-forward network
ещё одну residual connection
ещё normalization
```

А вокруг block находятся:

- token embeddings;
- positional information;
- output head;
- masks;
- training objective.

Главная цель урока — увидеть Transformer не как магическую LLM-архитектуру, а как понятную композицию уже знакомых operations.

---

## 1. Что Transformer изменил относительно RNN

RNN:

\[
h_t=f(x_t,h_{t-1}).
\]

Чтобы обработать token 100, нужно последовательно пройти предыдущие states.

Transformer убирает recurrence внутри layer.

Каждый token может взаимодействовать с другими через attention.

Получаем:

```text
короткий information path между distant tokens
+
parallel processing positions during training
```

Цена — стандартный self-attention имеет quadratic dependence от sequence length.

---

## 2. Input representation

Raw text:

```text
"я изучаю transformer"
```

проходит:

```text
tokenizer
→ token IDs
→ token embeddings
→ positional information
```

Получаем tensor:

```text
[B, L, d_model]
```

Например:

```text
[32, 128, 768]
```

Каждая position теперь имеет vector size 768.

---

## 3. Почему просто embedding недостаточно

Token embedding говорит:

> что это за token?

Но не говорит:

> где token находится?

Без positional signal sequences:

```text
A B C
C B A
```

для pure self-attention имели бы ту же collection token vectors с переставленными positions.

Поэтому добавляется positional representation.

---

## 4. Multi-head self-attention

Input \(X\):

\[
X\in\mathbb R^{L\times d_{model}}.
\]

Для каждой head:

\[
Q=XW_Q,
\]

\[
K=XW_K,
\]

\[
V=XW_V.
\]

Далее:

\[
head_i
=
Attention(Q_i,K_i,V_i).
\]

Heads concatenated:

\[
Concat(head_1,\dots,head_h)W_O.
\]

Output снова имеет dimension \(d_{model}\), чтобы удобно добавлять residual.

---

## 5. Residual connection

После attention:

\[
x_{new}=x+Attention(x).
\]

Зачем?

### Information path

Original representation не обязана полностью проходить через attention transform.

### Gradient path

Gradient может идти через identity connection.

### Correction mental model

Layer учит:

```text
не полностью переписать representation,
а добавить полезную correction
```

Это та же фундаментальная residual idea, знакомая из ResNet.

---

## 6. Normalization

Transformer использует normalization around sublayers.

Original paper использовал LayerNorm.

Modern architectures различаются по exact placement:

### Post-Norm

```text
x
→ sublayer
→ add residual
→ LayerNorm
```

### Pre-Norm

```text
x
→ LayerNorm
→ sublayer
→ add residual
```

Многие современные large Transformers используют Pre-Norm-like layouts, поскольку они часто стабилизируют optimization deep networks.

Важно:

> не заучивать один порядок как универсальный Transformer law.

---

## 7. Feed-Forward Network

После attention каждый token отдельно проходит маленький MLP.

Classic form:

\[
FFN(x)
=
W_2\phi(W_1x+b_1)+b_2.
\]

Обычно hidden dimension внутри FFN больше `d_model`.

Например:

```text
d_model = 768
d_ff    = 3072
```

Attention смешивает information **между positions**.

FFN преобразует representation **внутри каждой position**.

Это хорошая mental separation.

---

## 8. Position-wise означает shared weights

Один и тот же FFN применяется к каждому token position.

То есть:

```text
token 1 → same FFN
token 2 → same FFN
...
```

Weights shared across sequence positions.

Это похоже на sharing других architectures.

---

## 9. Полный encoder block

Conceptual Pre-Norm version:

```text
x
│
├──────────────┐
↓              │
LayerNorm      │
↓              │
Self-Attention │
↓              │
+ <────────────┘
↓
x1
│
├──────────────┐
↓              │
LayerNorm      │
↓              │
FFN            │
↓              │
+ <────────────┘
↓
output
```

Stack таких blocks:

```text
block 1
→ block 2
→ ...
→ block N
```

---

![Учебная иллюстрация: Transformer. Q/K/V, scores, softmax, weighted Values, residuals и FFN в одном потоке.](content-assets/datapath-v2/figures/72_transformer.png "Q/K/V, scores, softmax, weighted Values, residuals и FFN в одном потоке.")

## 10. Encoder-only Transformer

Примеры family:

```text
BERT-like
```

Self-attention обычно bidirectional: token может смотреть и влево, и вправо, кроме padding masks.

Подходит для:

- classification;
- token labeling;
- embeddings;
- masked-language objectives.

---

## 11. Decoder-only Transformer

GPT-like architecture.

Self-attention causal:

```text
token t
→ positions <= t
```

Нельзя видеть future tokens.

Training objective часто:

> предсказать следующий token.

Для sequence:

```text
I love machine learning
```

inputs/targets conceptually shifted:

```text
I       → love
love    → machine
machine → learning
```

Все positions training sequence можно считать parallel благодаря causal mask.

---

## 12. Encoder-decoder Transformer

Original Transformer для translation.

Encoder:

```text
читает source bidirectionally
```

Decoder:

1. causal self-attention по generated target;
2. cross-attention к encoder outputs;
3. FFN.

Так decoder одновременно использует:

- уже сгенерированный target prefix;
- source sequence.

---

## 13. Causal mask matrix

Для L=4 allowed pattern:

```text
token 1: ✓ ✗ ✗ ✗
token 2: ✓ ✓ ✗ ✗
token 3: ✓ ✓ ✓ ✗
token 4: ✓ ✓ ✓ ✓
```

Future attention logits получают очень negative masked value перед softmax.

После softmax их weight становится 0.

---

## 14. Padding mask

Batch:

```text
[real real real PAD PAD]
[real real real real real]
```

Padding positions не должны участвовать как content.

Mask запрещает attention к them.

Causal mask и padding mask решают разные проблемы и могут применяться одновременно.

---

## 15. Training decoder-only language model

Input token IDs:

```text
[B,L]
```

Embeddings:

```text
[B,L,d_model]
```

Blocks:

```text
[B,L,d_model]
```

Vocabulary head:

```text
Linear(d_model, vocab_size)
```

Logits:

```text
[B,L,V]
```

Loss сравнивает logits positions с next-token target IDs.

---

## 16. Почему output vocabulary projection огромна

Если:

```text
d_model=768
vocab=50000
```

final Linear имеет:

\[
768\cdot50000
=
38.4\text{ млн weights}
\]

без bias.

Поэтому weight tying input embeddings/output head может заметно уменьшить parameter count.

---

## 17. Parameter count attention

Для simple attention projections roughly:

```text
W_Q
W_K
W_V
W_O
```

каждая around:

\[
d_{model}\times d_{model}.
\]

Итого order:

\[
4d_{model}^2.
\]

FFN classic with `d_ff≈4d_model`:

\[
d_{model}d_{ff}
+
d_{ff}d_{model}
\approx8d_{model}^2.
\]

Поэтому в classic Transformer FFN часто содержит даже больше parameters than attention projections.

---

## 18. Attention complexity

Score matrix per head:

\[
L\times L.
\]

Compute standard attention roughly:

\[
O(L^2d).
\]

FFN roughly:

\[
O(Ld\,d_{ff}).
\]

При long sequences quadratic term attention становится major bottleneck.

---

## 19. KV cache при autoregressive generation

Training может process all positions parallel with causal mask.

Generation — другое.

Чтобы сгенерировать next token:

```text
prefix
→ next token
→ append
→ repeat
```

Если каждый раз пересчитывать K/V для всех past tokens, wasteful.

**KV cache** сохраняет keys/values past tokens для каждого layer.

При next step считаются K/V только нового token, а past cached.

---

## 20. Почему KV cache занимает много memory

Для каждого generated/request context нужно хранить K/V:

```text
layers
× sequence length
× kv heads
× head dimension
× dtype
```

Поэтому long-context inference упирается не только в model weights, но и в KV cache memory.

Это особенно важно для LLM deployment.

---

## 21. Multi-Query / Grouped-Query attention

Чтобы уменьшить KV cache, architectures могут иметь:

- много query heads;
- меньше key/value heads.

### MHA

Q/K/V heads одинаковое число.

### MQA

много Q heads, один shared K/V head.

### GQA

несколько groups Q делят меньшее число K/V heads.

Это engineering trade-off quality/throughput/cache.

---

## 22. LayerNorm vs BatchNorm

Transformer sequence representation не требует batch-wide statistics как BatchNorm.

LayerNorm действует внутри representation каждого token по feature dimension.

Это удобно при:

- variable sequences;
- varying batch size;
- autoregressive inference.

---

## 23. GELU и modern FFN

Original/modern Transformers часто используют GELU или gated variants вместо ReLU.

GELU плавно gate-ит inputs.

Modern LLMs также используют GLU/SwiGLU-like FFN.

Для foundation важно:

> Transformer FFN — не обязательно именно ReLU MLP; activation/FFN design evolves.

---

## 24. Positional methods modern models

Original sinusoidal encoding — не единственный путь.

Modern approaches:

- learned absolute positions;
- relative position biases;
- rotary positional embeddings (RoPE);
- ALiBi-like methods.

Главная invariant idea:

> attention needs some mechanism encoding position/order.

---

## 25. PyTorch reference layers

PyTorch имеет:

```python
nn.TransformerEncoderLayer
nn.TransformerDecoderLayer
nn.TransformerEncoder
nn.Transformer
```

Они полезны для обучения/прототипов.

Но production LLM architectures часто имеют custom implementations ради:

- fused kernels;
- Flash Attention;
- RoPE;
- GQA;
- custom normalization;
- caching.

---

## 26. Toy encoder

```python
import torch.nn as nn

layer = nn.TransformerEncoderLayer(
    d_model=256,
    nhead=8,
    dim_feedforward=1024,
    batch_first=True,
)

encoder = nn.TransformerEncoder(
    layer,
    num_layers=6,
)
```

Input:

```text
[B,L,256]
```

Output:

```text
[B,L,256]
```

---

## 27. Why Transformer scales

Main reasons:

- highly parallel matrix operations;
- no recurrent dependency during training;
- direct long-range attention;
- depth/residual architecture;
- efficient GPU/TPU kernels.

Но scaling requires:

- large data;
- compute;
- optimization;
- normalization;
- distributed training.

Architecture itself не гарантирует intelligence.

---

## 28. Интерактивная визуализация DataPath

### Block builder

Пользователь собирает:

```text
Self-Attention
Residual
LayerNorm
FFN
Residual
LayerNorm
```

Если убрать residual, показать gradient path.

### Causal mask

Attention matrix grows token by token.

### Encoder vs decoder

Toggle architectures and allowed attention directions.

### KV cache

Generation step-by-step: cached K/V остаются, вычисляется только new token branch.

### Parameter calculator

Sliders:

```text
layers
d_model
d_ff
heads
vocab
```

Показывать approximate embeddings/attention/FFN parameter counts.

---

## 29. Типичные ошибки

**«Transformer = attention и больше ничего».**\
Нет.

**«Attention заменяет MLP».**\
Нет, FFN остаётся центральной частью block.

**«Decoder-only training идёт token за token sequentially».**\
Training positions можно вычислять parallel благодаря causal mask; generation sequential.

**«KV cache нужен training».**\
Главная роль — autoregressive inference.

**«More heads всегда больше parameters Q/K/V».**\
При fixed d_model standard MHA projection matrices overall scale similar; head split changes structure.

**«Encoder BERT должен использовать causal mask».**\
Обычный bidirectional encoder — нет.

**«All Transformers используют sinusoidal positions».**\
Нет.

---

## 30. Проверка понимания

1. Что входит в Transformer block?
2. Attention vs FFN roles?
3. Зачем residual connections?
4. Pre-Norm vs Post-Norm?
5. Encoder-only vs decoder-only?
6. Что делает causal mask?
7. Shape language-model logits?
8. Почему attention quadratic?
9. Что хранит KV cache?
10. MHA vs GQA?
11. Почему LayerNorm естественна Transformer?
12. Зачем positional information?

---

## 31. Мини-практика

Decoder-only model:

```text
vocab=32000
d_model=512
d_ff=2048
layers=12
heads=8
seq_len=1024
```

Ответьте:

1. head dimension;
2. shape hidden states batch=4;
3. shape logits;
4. attention matrix per head;
5. почему long context expensive;
6. зачем KV cache generation;
7. почему causal mask нужен training.

---

## 32. Как объяснить на собеседовании

### Transformer block

Multi-head self-attention смешивает context между tokens, FFN нелинейно преобразует каждый token independently, residual connections и LayerNorm стабилизируют deep optimization.

### Encoder vs decoder

Encoder обычно может смотреть на весь input. Autoregressive decoder использует causal mask и предсказывает next token. Encoder-decoder дополнительно имеет cross-attention decoder к encoder representations.

### Почему Transformer быстрее RNN training?

Позиции внутри layer не зависят sequentially друг от друга, поэтому self-attention/FFN можно считать большими parallel matrix operations.

---

## 33. Что нужно унести

1. Transformer — attention + FFN + residual + normalization.
2. Input = token representation + positional information.
3. Encoder и decoder используют разные masking regimes.
4. Causal decoder не видит future tokens.
5. Training causal LM parallel по positions, generation sequential.
6. FFN — огромная часть parameters/compute.
7. Standard attention quadratic по sequence length.
8. KV cache ускоряет autoregressive inference.
9. GQA/MQA уменьшают K/V cache.
10. Modern Transformer details vary, core principles stable.

## Куда дальше

Теперь architecture понятна.

Но реальный DL-проект рушится не на formula attention, а на training pipeline:

```text
Dataset
DataLoader
devices
train/eval
checkpoints
metrics
mixed precision
inference
```

Следующий урок соберёт полный PyTorch workflow.

## Источники
- Vaswani et al., 2017, "Attention Is All You Need".
- PyTorch Transformer and MultiheadAttention documentation.
