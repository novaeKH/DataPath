---
title: "Embeddings — как токены и категории превращаются в обучаемые векторы"
id: concept.datapath-v2.070
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 70
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Embeddings: как токены и категории превращаются в обучаемые векторы

Представим словарь из 50 000 токенов.

One-hot representation слова `cat`:

```text
[0,0,0,...,1,...,0]
```

имеет 50 000 dimensions.

Для каждого token только одна единица.

Это очень sparse и не выражает similarity:

```text
cat
dog
car
```

все пары one-hot vectors одинаково ортогональны.

**Embedding** заменяет discrete ID на плотный обучаемый vector:

```text
cat → [0.31, -0.82, 0.14, ...]
dog → [0.28, -0.74, 0.20, ...]
car → [-0.51, 0.10, 0.93, ...]
```

Similarity может быть выучена через training objective.

---

## 1. Embedding matrix

Если vocabulary size:

\[
V=50000
\]

и embedding dimension:

\[
d=256,
\]

то embedding table:

\[
E\in\mathbb R^{50000\times256}.
\]

Каждая row соответствует одному token ID.

---

## 2. Lookup вместо matrix multiplication mental model

Token ID:

```text
42
```

просто выбирает row:

```text
E[42]
```

В PyTorch:

```python
embedding = nn.Embedding(
    num_embeddings=50000,
    embedding_dim=256,
)

x = embedding(token_ids)
```

Это эффективный lookup operation.

---

## 3. Shape

Input token IDs:

```text
[batch, seq_len]
```

Например:

```text
[32,100]
```

После:

```python
nn.Embedding(50000,256)
```

получим:

```text
[32,100,256]
```

Каждый token превращён в vector length 256.

---

## 4. One-hot × matrix эквивалентность

Если token one-hot vector:

\[
e_i\in\mathbb R^V
\]

и matrix:

\[
E\in\mathbb R^{V\times d},
\]

то:

\[
e_i^TE
\]

выбирает i-ю row \(E\).

Embedding lookup математически эквивалентен one-hot + Linear без bias, но вычислительно намного эффективнее.

Это важная связь с уже знакомой linear algebra.

---

## 5. Embedding обучается

`nn.Embedding` содержит learnable weight matrix.

Backprop обновляет rows tokens, которые участвовали в batch.

Meaning vectors возникает не из словаря заранее, а из objective.

Если model должна предсказывать похожий context для `cat` и `dog`, их vectors могут стать похожими.

---

## 6. Что значит «похожими»

Часто similarity измеряют cosine:

\[
cos(u,v)
=
\frac{u\cdot v}
{\|u\|\|v\|}.
\]

Но сама training model не обязана напрямую оптимизировать cosine similarity.

Geometry возникает как побочный результат objective.

---

![Учебная иллюстрация: Embeddings. Семантические кластеры и nearest neighbors по cosine similarity.](content-assets/datapath-v2/figures/70_embeddings.png "Семантические кластеры и nearest neighbors по cosine similarity.")

## 7. Embeddings не обязательно слова

Embedding применим к любому discrete ID:

- token;
- product_id;
- user_id;
- movie_id;
- category;
- position.

Например recommender:

```text
user embedding
item embedding
```

и score через dot product.

---

## 8. Padding token

Variable-length sequences padding до общей длины.

Можно задать:

```python
nn.Embedding(
    vocab_size,
    dim,
    padding_idx=0,
)
```

Row `padding_idx` имеет special behavior: gradient для неё не обновляется стандартным способом, что удобно для fixed padding representation.

Но attention/RNN всё равно часто требуют masks/lengths, чтобы padding не влиял downstream.

---

## 9. Unknown token

Tokenizer может иметь:

```text
<UNK>
```

для unseen words/subwords.

Modern subword tokenizers уменьшают проблему unknown, разбивая слова на pieces.

Embedding table index всегда должен быть valid integer ID.

---

## 10. Vocabulary и tokenizer — не одно и то же

Tokenizer:

```text
raw text
→ token IDs
```

Embedding:

```text
token IDs
→ dense vectors
```

Например:

```text
"unbelievable"
```

может превратиться в несколько subword IDs.

Embedding не решает tokenization.

---

## 11. Positional information отсутствует

Если два sequences:

```text
dog bites man
man bites dog
```

используют те же token embeddings, набор vectors одинаков, меняется только order positions tensor.

RNN inherently обрабатывает order последовательно.

Transformer self-attention без positional information сама по себе permutation-equivariant и не знает order.

Поэтому Transformer добавляет positional representation.

---

## 12. Learned positional embeddings

Можно иметь отдельную table:

```text
position 0 → vector
position 1 → vector
...
```

И складывать:

\[
token\_embedding+position\_embedding.
\]

Так model получает информацию «что» и «где».

---

## 13. Sinusoidal positional encoding

Original Transformer использовал deterministic sin/cos positional encodings:

\[
PE(pos,2i)
=
\sin\left(
pos/10000^{2i/d}
\right),
\]

\[
PE(pos,2i+1)
=
\cos\left(
pos/10000^{2i/d}
\right).
\]

Для foundation важно не заучить exponent, а понять:

> каждой position соответствует structured vector разных frequencies.

Modern Transformers используют множество positional schemes: learned, rotary и другие.

---

## 14. Embedding dimension

Слишком маленький:

```text
representation bottleneck
```

Слишком большой:

```text
parameters ↑
memory ↑
overfit risk ↑
```

Embedding table часто составляет огромную часть parameters NLP model:

\[
V\cdot d.
\]

Например:

\[
50000\cdot768
=
38.4\text{ млн parameters}.
\]

---

## 15. Weight tying

Language models иногда используют одну и ту же matrix для:

- input token embeddings;
- output vocabulary projection.

Это называется weight tying.

Идея уменьшает parameters и связывает input/output token geometry.

Но implementation depends architecture.

---

## 16. Pretrained embeddings

До contextual Transformers были популярны Word2Vec/GloVe embeddings.

Один token имел почти один static vector вне зависимости от context.

Проблема:

```text
bank
```

в:

```text
river bank
bank account
```

получал один embedding.

Contextual models создают representations, которые меняются в зависимости от surrounding tokens.

---

## 17. Static embedding vs contextual representation

Важно не путать:

**Embedding layer output**

```text
token ID → initial vector
```

**Transformer hidden state**

```text
token representation after mixing context
```

Последнее уже contextual.

В BERT-like model token `bank` в разных sentences будет иметь разные hidden states.

---

## 18. Embeddings категорий в tabular DL

Категориальный feature:

```text
city_id
```

можно представить через embedding вместо OHE.

Несколько category features:

```text
city embedding
device embedding
tariff embedding
```

затем concatenate с numerical features и подать в MLP.

Это common pattern neural tabular models.

Но embeddings требуют enough data, особенно для rare categories.

---

## 19. Rare IDs

Embedding row rare token получает мало gradient updates.

Representation может быть poorly learned.

Способы:

- merge rare categories;
- regularization;
- pretrained embeddings;
- shared subword structure;
- hashing.

---

## 20. Code example

```python
import torch
import torch.nn as nn

embedding = nn.Embedding(
    num_embeddings=10000,
    embedding_dim=128,
    padding_idx=0,
)

token_ids = torch.randint(
    0,
    10000,
    (32, 50),
)

x = embedding(token_ids)

print(x.shape)
# [32,50,128]
```

---

## 21. Embedding + LSTM

```python
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, emb_dim, hidden, classes):
        super().__init__()
        self.emb = nn.Embedding(
            vocab_size,
            emb_dim,
            padding_idx=0,
        )
        self.lstm = nn.LSTM(
            emb_dim,
            hidden,
            batch_first=True,
        )
        self.head = nn.Linear(hidden, classes)

    def forward(self, token_ids):
        x = self.emb(token_ids)
        _, (h_n, _) = self.lstm(x)
        return self.head(h_n[-1])
```

Pipeline:

```text
IDs
→ embeddings
→ sequence model
→ classifier
```

---

## 22. Embedding и semantic interpretation

Нельзя утверждать:

```text
dimension 17 = "животность"
dimension 42 = "позитивность"
```

обычно meaning distributed across dimensions.

Лучше анализировать geometry, nearest neighbors или downstream behavior.

---

## 23. Интерактивная визуализация DataPath

### One-hot vs embedding

Vocabulary 10 tokens.

Показать sparse one-hot vectors и dense learned vectors.

### Lookup

Token ID подсвечивает row embedding matrix.

### Training

Два tokens часто встречаются в похожих contexts → vectors визуально сближаются в toy 2D space.

### Position

Переставить tokens местами:

```text
A B C
C B A
```

Показать, что token vectors сами по себе те же, positional representations разные.

---

## 24. Типичные ошибки

**«Embedding — готовый semantic словарь».**\
Не обязательно, он обучается objective.

**«Embedding выполняет tokenization».**\
Нет.

**«Embedding и contextual hidden state одно и то же».**\
Нет.

**«ID можно подать в Linear как обычное число».**\
Так появляется искусственная ordinal geometry.

**«Padding embedding автоматически маскирует padding во всей network».**\
Нет.

**«Больше embedding dimension всегда лучше».**\
Нет.

---

## 25. Проверка понимания

1. Shape embedding matrix?
2. Почему lookup эквивалентен one-hot × matrix?
3. Shape output `[32,50]` IDs при dim=128?
4. Что делает `padding_idx`?
5. Tokenizer vs embedding?
6. Почему Transformer нужны positions?
7. Static vs contextual representation?
8. Почему rare token embedding слабый?
9. Где embeddings используются кроме NLP?
10. Что такое weight tying?

---

## 26. Мини-практика

Vocabulary:

```text
30 000 tokens
embedding_dim=256
batch=64
seq_len=128
```

Ответьте:

1. parameters embedding table;
2. output shape;
3. approximate FP32 memory table только для weights;
4. зачем mask padding;
5. почему contextual model после embedding layer всё ещё нужна.

---

## Что нужно унести

1. Embedding — learnable dense vector для discrete ID.
2. Embedding matrix shape `[vocab_size, embedding_dim]`.
3. Lookup equivalent one-hot matrix multiplication, но эффективнее.
4. Token embeddings обучаются через downstream objective.
5. Padding/unknown требуют special handling.
6. Tokenization и embedding — разные этапы.
7. Token embedding не содержит order автоматически.
8. Positional information добавляется отдельно.
9. Contextual representation появляется после sequence/context layers.
10. Embeddings применимы к tokens, users, items и categories.

## Куда дальше

Теперь каждый token представлен vector.

Но RNN читает context последовательно.

Можно ли текущему token **напрямую посмотреть на все остальные tokens** и решить, какие важны?

Так появляется **attention**.

## Источники
- PyTorch `nn.Embedding`.
- PyTorch NLP tutorials.
- "Attention Is All You Need" для positional encoding как первичного референса.
