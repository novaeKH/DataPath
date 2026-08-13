---
title: "Attention — как модель учится выбирать важные элементы контекста"
id: concept.datapath-v2.071
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 71
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Attention: как модель учится выбирать важные элементы контекста

RNN сжимает прошлое в hidden state.

Encoder-decoder RNN исторически сталкивался с bottleneck:

```text
длинная input sequence
→ один fixed-size representation
→ decoder
```

**Attention** изменил подход:

> вместо хранения всего input в одном vector decoder/query может обращаться ко всем relevant representations и вычислять, насколько каждое из них важно прямо сейчас.

Modern Transformer сделал attention центральным механизмом и убрал recurrence.

---

## 1. Интуиция: поиск по памяти

Представьте query:

```text
"какая столица Франции?"
```

Есть memory records.

Для каждого record есть:

```text
key   → что это за information
value → сама information
```

Query сравнивается с keys.

Более подходящие keys получают больший weight.

Output — weighted combination values.

Это mental model:

```text
Query
→ compare with Keys
→ attention weights
→ weighted sum of Values
```

---

## 2. Query, Key, Value

Для каждого token representation \(x\) через learned projections строятся:

\[
q=xW_Q,
\]

\[
k=xW_K,
\]

\[
v=xW_V.
\]

То есть Q/K/V не являются тремя копиями input.

Это три разные learned views representation.

---

## 3. Почему dot product

Similarity query/key можно измерить dot product:

\[
score(q,k)=q^Tk.
\]

Если vectors направлены похоже, dot product large positive.

Для matrix sequence:

\[
QK^T.
\]

Это сразу даёт scores всех query-key pairs.

---

## 4. Shape

Пусть:

```text
batch omitted for clarity
seq_len = 4
d_k = 3
```

Тогда:

\[
Q\in\mathbb R^{4\times3},
\]

\[
K\in\mathbb R^{4\times3}.
\]

Получим:

\[
QK^T
\in
\mathbb R^{4\times4}.
\]

Каждая row — query token.

Каждый column — key token.

То есть matrix 4×4 содержит pairwise attention scores.

---

## 5. Почему делим на \(\sqrt{d_k}\)

Scaled dot-product attention:

\[
Attention(Q,K,V)
=
softmax
\left(
\frac{QK^T}{\sqrt{d_k}}
\right)V.
\]

Если dimension \(d_k\) растёт, variance dot products тоже растёт.

Большие logits заставляют softmax уходить в saturated, extremely peaked regime, gradients становятся менее удобными.

Scaling:

\[
1/\sqrt{d_k}
\]

стабилизирует magnitude scores.

---

## 6. Softmax превращает scores в weights

Для query scores:

```text
2.0
1.0
0.0
```

Softmax создаёт positive weights, сумма которых равна 1.

Например roughly:

```text
0.665
0.245
0.090
```

Attention output:

\[
o
=
0.665v_1
+
0.245v_2
+
0.090v_3.
\]

Это weighted combination values.

---

## 7. Один toy example

Пусть query имеет scores к трем tokens:

```text
"France" → 4
"Germany" → 1
"banana" → -2
```

После softmax France получит почти весь weight.

Output в основном перенесёт соответствующее value representation.

В real model scores learned и не обязаны соответствовать человеческому semantic label столь буквально.

---

![Учебная иллюстрация: Attention. Query token, attention links и heatmap одной строки весов, сумма которых равна единице.](content-assets/datapath-v2/figures/71_attention.png "Query token, attention links и heatmap одной строки весов, сумма которых равна единице.")

## 8. Self-attention

Если Q, K, V происходят из **одной и той же sequence**, это **самовнимание (self-attention)**.

Каждый token может attend к другим tokens sequence.

Например sentence:

```text
The animal didn't cross the street because it was tired.
```

Representation `it` может получать высокий attention к `animal`.

Это intuition coreference-like behavior, но attention weights сами по себе не гарантируют человеческое explanation reasoning.

---

## 9. Cross-attention

Если:

```text
Q → decoder states
K,V → encoder states
```

это cross-attention.

Decoder спрашивает input representations:

> что из source сейчас важно для генерации next token?

Encoder-decoder Transformer использует оба вида attention.

---

## 10. Masking

Иногда некоторые query-key connections запрещены.

### Padding mask

Не смотреть на padding.

### Causal mask

При language modeling token position \(t\) не должна смотреть на future tokens \(t+1,\dots\).

Attention score future positions маскируется перед softmax.

---

## 11. Почему causal mask обязательна для autoregressive model

Training sequence:

```text
I love deep learning
```

Если token `love` при prediction next token может directly attend к future `deep`, model получает answer из future.

Это leakage внутри architecture.

Causal mask заставляет:

```text
position t
→ only positions <= t
```

---

## 12. Attention без recurrence

Self-attention layer может вычислить all pairwise token relationships одной большой matrix operation.

Это позволяет parallel computation positions во время training.

В RNN:

```text
h1 → h2 → h3
```

dependency sequential.

В self-attention within one layer:

```text
all QK pairs computed together
```

Это один из ключевых scaling advantages Transformer.

---

## 13. Цена: quadratic attention

Attention score matrix:

\[
L\times L
\]

для sequence length \(L\).

Memory/compute standard self-attention растут примерно quadratically по sequence length.

Если:

```text
L=1000
```

matrix:

```text
1,000,000 scores per head per sample
```

Для very long context это expensive.

Отсюда long-context attention optimizations.

---

## 14. Multi-head attention

Один attention mechanism создаёт одну similarity geometry.

**Многоголовое внимание (multi-head attention)** использует несколько sets projections:

```text
head 1
head 2
...
head H
```

Каждая head работает в меньшем subspace.

Output heads concatenated и projected.

---

## 15. Зачем несколько heads

Different heads могут специализироваться на разных relation patterns:

- local;
- syntactic;
- long-range;
- positional.

Но это не означает, что каждая head обязательно имеет чистую человеческую функцию.

Главная architecture idea:

> model получает несколько parallel attention subspaces.

---

## 16. Shape multi-head

Пусть:

```text
d_model=512
num_heads=8
```

Часто:

```text
head_dim = 64
```

потому что:

\[
512/8=64.
\]

Sequence representation:

```text
[B,L,512]
```

conceptually reshaped:

```text
[B,8,L,64]
```

для attention per head.

---

## 17. `nn.MultiheadAttention`

PyTorch предоставляет reference implementation:

```python
attn = nn.MultiheadAttention(
    embed_dim=512,
    num_heads=8,
    batch_first=True,
)
```

Input:

```text
query [B,L,E]
key   [B,S,E]
value [B,S,E]
```

Output shape:

```text
[B,L,E]
```

в typical batch-first case.

---

## 18. Self-attention code

```python
x = torch.randn(32, 100, 512)

out, weights = attn(
    x,
    x,
    x,
)
```

Q/K/V input sequence одна и та же, но internal projection matrices различны.

---

## 19. Attention weights не равны explanation

Очень распространённая ошибка:

> высокий attention weight = причина prediction.

Attention — internal routing mechanism.

Weights могут быть полезны для inspection, но не являются автоматически faithful causal explanation.

Model output зависит также от:

- values;
- residual connections;
- MLP;
- other heads/layers.

---

## 20. Positional information снова критично

Self-attention без positions по сути рассматривает tokens как set с permutation-equivariant processing.

Чтобы различать:

```text
dog bites man
man bites dog
```

нужно positional encoding/embedding.

Attention отвечает «с кем взаимодействовать», positions — «где находится token».

---

## 21. Attention и similarity scale

Q/K projections learned.

Поэтому attention similarity — не просто cosine similarity original embeddings.

Model может обучить специальные coordinate systems для match query-key.

---

## 22. Visual example

Sentence:

```text
The cat sat on the mat because it was tired
```

Selected query token:

```text
it
```

Visualization показывает weights ко всем tokens.

Но lesson должен подписывать:

> это illustration learned attention distribution, не доказательство человеческой reasoning chain.

---

## 23. Интерактивная визуализация DataPath

### Q/K dot product

Пользователь вращает 2D query/key vectors.

Показывать dot-product score.

### Softmax

Несколько raw scores → normalized weights.

Temperature-like scaling показывает sharper/flatter distribution.

### Mask

Toggle:

```text
none
causal
padding
```

Future cells attention matrix становятся недоступны.

### Multi-head

Показать 4 heads с разными attention maps.

---

## 24. Типичные ошибки

**«Q, K, V — исходный token vector без transformations».**\
Обычно learned projections.

**«Attention weights могут быть отрицательными после softmax».**\
Нет, normalized weights nonnegative.

**«Self-attention знает order без positional info».**\
Нет.

**«Attention training полностью linear in sequence length».**\
Standard full attention quadratic.

**«Causal mask нужен BERT-like encoder».**\
Не в обычном bidirectional encoder objective; он нужен autoregressive causal constraint.

**«Attention weights = causal explanation».**\
Нет.

---

## 25. Проверка понимания

1. Q/K/V roles?
2. Shape QKᵀ?
3. Зачем \(\sqrt{d_k}\)?
4. Что делает softmax?
5. Self vs cross-attention?
6. Зачем causal mask?
7. Почему Transformer parallelizes better than RNN?
8. Почему full attention quadratic?
9. Зачем multi-head?
10. Почему positions нужны отдельно?

---

## 26. Мини-практика

```text
batch=16
seq_len=128
d_model=768
heads=12
```

Ответьте:

1. head dimension;
2. conceptual Q shape after splitting heads;
3. attention matrix shape per head;
4. сколько pairwise scores per sample across all heads;
5. что mask делает до softmax.

---

## 27. Как объяснить на собеседовании

### Что такое attention?

**Коротко.**\
Query сравнивается с keys, similarities превращаются softmax в weights, затем output — weighted sum values.

### Формула?

\[
Attention(Q,K,V)
=
softmax\left(\frac{QK^T}{\sqrt{d_k}}\right)V.
\]

### Зачем scaling?

Чтобы dot products при больших dimensions не становились слишком large и softmax не насыщался.

### Multi-head?

Несколько parallel attention subspaces с отдельными projections Q/K/V, outputs concatenated и projected.

---

## 28. Что нужно унести

1. Attention — content-dependent weighted routing information.
2. Q ищет, K участвует в matching, V переносит content.
3. Scores строятся через QKᵀ.
4. Scaling стабилизирует score magnitude.
5. Softmax превращает scores в weights.
6. Self-attention использует одну sequence для Q/K/V.
7. Causal mask предотвращает future leakage.
8. Multi-head даёт несколько representation subspaces.
9. Full attention quadratic по sequence length.
10. Positional information нужна отдельно.

## Куда дальше

Attention — уже главный механизм.

Но Transformer block включает больше:

```text
attention
+ residual connections
+ normalization
+ feed-forward network
```

Следующий урок соберёт эти части в полный **Transformer** и разберёт encoder, decoder и autoregressive generation.

## Источники
- Vaswani et al., "Attention Is All You Need".
- PyTorch `nn.MultiheadAttention`.
