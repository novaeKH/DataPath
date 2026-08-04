---
title: "Токенизация, attention и Transformer"
type: source
area: dl
status: deprecated
tags:
  - deep-learning
  - theory
  - interview
rag: exclude
id: source.dl.tokenizatsiia-attention-i-transformer
schema_version: 2
language: ru
app: exclude
---
# Токенизация, attention и Transformer

> [!info] Legacy course note
> Canonical theory: [[Embeddings and Attention]] и [[Transformer and Language Modeling]]. Файл сохранён как расширенный reference и исключён из RAG.

> [!tip] Закрепление
> После этой заметки: [[10 Знания/ML/02 Deep Learning/05 Тренажер/04 - Transformer и LLM]].

## 10. Эмбеддинги и токенизация

### 10.1. От текста к тензору

```text
текст → токены → token IDs → embedding vectors
```

`nn.Embedding(V, D)` — таблица $E\in\mathbb{R}^{V\times D}$. Для каждого ID выбирается строка таблицы. Параметров $V\cdot D$.

Вход `(B, T)` с целыми ID превращается в `(B, T, D)`.

One-hot вектор длины $V$, умноженный на $E$, дал бы ту же строку, но lookup не создаёт огромный разреженный one-hot.

```python
vocabulary_size = 1_000
embedding_dimension = 64
token_ids = torch.randint(0, vocabulary_size, (8, 32))

token_embedding = nn.Embedding(
    num_embeddings=vocabulary_size,
    embedding_dim=embedding_dimension,
    padding_idx=0,
)
embedded_tokens = token_embedding(token_ids)

print("IDs:", token_ids.shape, token_ids.dtype)
print("Embeddings:", embedded_tokens.shape)
print("Parameters:", token_embedding.weight.numel())
```

### 10.2. Статические и контекстные эмбеддинги

- **Word2Vec CBOW:** предсказывает слово по контексту.
- **Word2Vec Skip-gram:** предсказывает контекст по слову.
- Word2Vec даёт один статический вектор на слово.
- Transformer создаёт контекстный вектор: представление слова зависит от соседних токенов.

Cosine similarity:

$$
\cos(a,b)=\frac{a^\top b}{\|a\|_2\|b\|_2}.
$$

Она сравнивает направление. Для получения вектора единичной длины используют L2-нормализацию, а не softmax.

### 10.3. Subword-токенизация

Словарю целых слов трудно работать с редкими формами и новыми словами. BPE-подобный токенизатор:

1. начинает с маленьких единиц;
2. многократно объединяет частые соседние пары;
3. кодирует слово несколькими subword tokens.

Компромисс:

- маленький словарь → длиннее последовательности;
- большой словарь → больше embedding/lm-head параметров и редких токенов.

Специальные токены: padding, начало/конец, неизвестный токен, разделители. `attention_mask` отличает реальные токены от padding; это не то же самое, что causal mask.

#### Проверь себя

Словарь содержит 32 000 токенов, размерность embedding 768.

- Сколько параметров в embedding?
- Какова форма после подачи IDs `(16, 512)`?
- Почему сравнивать perplexity моделей с разными токенизаторами нужно осторожно?

<details>
<summary><b>Ответ</b></summary>

$32000\cdot768=24\,576\,000$ параметров. Выход `(16, 512, 768)`. Разные токенизаторы разбивают один текст на разное число и состав токенов, поэтому средняя ошибка «на токен» и perplexity не полностью сопоставимы.

</details>

## 11. Attention: Q, K, V без магии

### 11.1. Scaled dot-product attention

Пусть $X\in\mathbb{R}^{B\times T\times D}$:

$$
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V.
$$

Для одной головы:

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}
\left(
\frac{QK^T}{\sqrt{d_k}}+M
\right)V.
$$

Интуиция:

- Query — что текущая позиция ищет;
- Key — по чему позицию можно найти;
- Value — какую информацию она передаст.

Матрица scores имеет форму `(B, T_query, T_key)`. Softmax применяется по `T_key`: каждая строка задаёт распределение внимания текущего query по доступным keys.

Масштаб $1/\sqrt{d_k}$ не даёт скалярным произведениям расти с размерностью и загонять softmax в насыщение.

```python
def scaled_dot_product_attention(
    query: torch.Tensor,
    key: torch.Tensor,
    value: torch.Tensor,
    causal: bool = False,
) -> tuple[torch.Tensor, torch.Tensor]:
    key_dimension = query.size(-1)
    scores = query @ key.transpose(-2, -1)
    scores = scores / math.sqrt(key_dimension)

    if causal:
        query_length = query.size(-2)
        key_length = key.size(-2)
        if query_length != key_length:
            raise ValueError("В учебной реализации causal Q и K должны иметь одну длину.")
        future_mask = torch.triu(
            torch.ones(
                query_length,
                key_length,
                dtype=torch.bool,
                device=query.device,
            ),
            diagonal=1,
        )
        scores = scores.masked_fill(future_mask, float("-inf"))

    attention_weights = torch.softmax(scores, dim=-1)
    context = attention_weights @ value
    return context, attention_weights


query = torch.randn(2, 5, 8)
key = torch.randn(2, 5, 8)
value = torch.randn(2, 5, 8)

context, weights = scaled_dot_product_attention(
    query,
    key,
    value,
    causal=True,
)

print("Context:", context.shape)
print("Weights:", weights.shape)
print("Суммы строк:", weights[0].sum(dim=-1))
print("Вес будущих позиций:", weights[0].triu(diagonal=1).max().item())
```

### 11.2. Causal mask и padding mask

В decoder-only LLM токен позиции $t$ не должен видеть будущие targets. Перед softmax запрещённым scores присваивают $-\infty$, поэтому их вероятность становится нулевой.

- **causal mask** запрещает смотреть вправо;
- **padding mask** запрещает учитывать padding;
- это разные маски, иногда применяемые одновременно.

Нельзя сначала выполнить softmax, затем просто занулить элементы без повторной нормализации: сумма строки перестанет быть равна 1.

### 11.3. Multi-head attention

При $H$ головах обычно $d_{head}=D/H$. Каждая голова получает собственные проекции, результаты конкатенируются и проходят выходную проекцию:

$$
\operatorname{MHA}(X)=
\operatorname{Concat}(head_1,\ldots,head_H)W_O.
$$

Головы не голосуют и не образуют ансамбль. Они создают разные подпространства взаимодействий, которые смешивает $W_O$.

### 11.4. Self-attention, cross-attention, MQA и GQA

- self-attention: Q/K/V из одной последовательности;
- cross-attention: Q из decoder, K/V из encoder/другого источника;
- MQA: много Q-heads, одна общая K/V-head;
- GQA: Q-heads разбиты на группы, в группе общие K/V.

MQA/GQA уменьшают размер KV-cache и ускоряют autoregressive inference. В StoryWeaver 12 query-heads и 4 KV-heads — пример GQA.

Ограничение обычного attention: память/вычисления scores растут как $O(T^2)$.

#### Проверь себя

`B=4`, `H=8`, `T=128`, `d_head=64`.

- Какова форма Q после разделения на головы?
- Какова форма scores?
- Почему causal mask добавляют до softmax?

<details>
<summary><b>Ответ</b></summary>

Q: `(4, 8, 128, 64)`. Scores: `(4, 8, 128, 128)`. До softmax запрещённым logits ставят $-\infty$, чтобы их нормированная вероятность стала ровно нулевой, а разрешённые веса по строке суммировались в 1.

</details>

## 12. Transformer: собираем блок

### 12.1. Компоненты

Современный decoder block (pre-norm):

$$
x \leftarrow x+\operatorname{Attention}(\operatorname{LN}(x))
$$

$$
x \leftarrow x+\operatorname{MLP}(\operatorname{LN}(x)).
$$

MLP работает независимо с каждым токеном:

$$
\operatorname{MLP}(x)=W_2\,\phi(W_1x+b_1)+b_2.
$$

Residual connection требует одинаковой формы входа и выхода. LayerNorm стабилизирует масштаб. MLP смешивает признаки внутри токена; attention смешивает информацию между позициями.

```python
class TinyDecoderBlock(nn.Module):
    def __init__(
        self,
        model_dimension: int,
        number_of_heads: int,
        feed_forward_dimension: int,
        dropout_probability: float = 0.0,
    ) -> None:
        super().__init__()
        self.attention_norm = nn.LayerNorm(model_dimension)
        self.attention = nn.MultiheadAttention(
            embed_dim=model_dimension,
            num_heads=number_of_heads,
            dropout=dropout_probability,
            batch_first=True,
        )
        self.mlp_norm = nn.LayerNorm(model_dimension)
        self.mlp = nn.Sequential(
            nn.Linear(model_dimension, feed_forward_dimension),
            nn.GELU(),
            nn.Linear(feed_forward_dimension, model_dimension),
            nn.Dropout(dropout_probability),
        )

    def forward(self, hidden_states: torch.Tensor) -> torch.Tensor:
        sequence_length = hidden_states.size(1)
        causal_mask = torch.triu(
            torch.ones(
                sequence_length,
                sequence_length,
                dtype=torch.bool,
                device=hidden_states.device,
            ),
            diagonal=1,
        )

        normalized = self.attention_norm(hidden_states)
        attended, _ = self.attention(
            normalized,
            normalized,
            normalized,
            attn_mask=causal_mask,
            need_weights=False,
        )
        hidden_states = hidden_states + attended
        hidden_states = hidden_states + self.mlp(
            self.mlp_norm(hidden_states)
        )
        return hidden_states


decoder_block = TinyDecoderBlock(
    model_dimension=64,
    number_of_heads=4,
    feed_forward_dimension=256,
)
hidden_states = torch.randn(2, 16, 64)
block_output = decoder_block(hidden_states)

print("Input:", hidden_states.shape)
print("Output:", block_output.shape)
print("Parameters:", sum(p.numel() for p in decoder_block.parameters()))
```

### 12.2. Позиционная информация

Без позиции self-attention не различает порядок токенов.

- sinusoidal encoding — фиксированные sin/cos;
- learned positional embedding — обучаемый вектор позиции;
- RoPE — вращает Q/K так, чтобы score содержал относительную позиционную информацию.

### 12.3. Три семейства Transformer

| Архитектура | Attention | Типичные задачи |
|---|---|---|
| Encoder-only (BERT) | двунаправленный | классификация, извлечение, embeddings |
| Decoder-only (GPT) | causal | генерация, next-token prediction |
| Encoder–decoder (T5) | encoder + causal decoder + cross-attention | перевод, преобразование sequence-to-sequence |

BERT обучался, в частности, восстанавливать замаскированные токены и видит левый/правый контекст. GPT предсказывает следующий токен и не видит будущее.

### 12.4. Приближённое число параметров блока

При обычном attention:

- Q/K/V/O: примерно $4D^2$;
- MLP: примерно $2DD_{ff}$;
- LayerNorm/bias — меньшая добавка.

При $D_{ff}\approx4D$ один блок содержит примерно $12D^2$ параметров. Embedding/lm-head могут занимать значительную часть всей модели.

#### Проверь себя

1. Что смешивает токены, а что — признаки внутри каждого токена?
2. Чем decoder-only отличается от encoder-only?
3. Зачем residual connection, если attention/MLP уже обучаемые?

<details>
<summary><b>Ответ</b></summary>

Attention смешивает информацию между позициями; MLP преобразует признаки каждого токена отдельно. Decoder-only использует causal mask и подходит для next-token generation; encoder видит контекст с обеих сторон. Residual path сохраняет исходный сигнал, облегчает прохождение градиента и позволяет блоку обучать поправку к представлению.

</details>

Вернуться: [[10 Знания/ML/02 Deep Learning/04 Теория/00 - Карта теории]].
