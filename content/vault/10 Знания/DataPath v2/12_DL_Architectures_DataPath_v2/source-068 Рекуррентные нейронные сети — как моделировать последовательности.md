---
title: "Рекуррентные нейронные сети — как моделировать последовательности"
id: concept.datapath-v2.068
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 68
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Рекуррентные нейронные сети: как моделировать последовательности

В обычном MLP input имеет фиксированную структуру:

```text
100 features
→ prediction
```

Но sequence data устроены иначе.

Текст:

```text
я люблю машинное обучение
```

Временной ряд:

```text
x₁, x₂, x₃, ...
```

История клиента:

```text
login → purchase → support → purchase
```

Порядок важен.

**Рекуррентная нейронная сеть (Recurrent Neural Network, RNN)** обрабатывает sequence по шагам и переносит информацию через **скрытое состояние (hidden state)**.

---

## 1. Главная идея recurrence

На timestep \(t\):

\[
h_t
=
f(x_t,h_{t-1}).
\]

Где:

- \(x_t\) — текущий input;
- \(h_{t-1}\) — память прошлого;
- \(h_t\) — новое hidden state.

Simple RNN:

\[
h_t
=
\tanh(W_{xh}x_t+W_{hh}h_{t-1}+b).
\]

Один и тот же набор weights применяется на каждом timestep.

---

## 2. Weight sharing во времени

Sequence length может быть 10 или 1000.

RNN не создаёт отдельный layer weights для каждого position.

Используются одинаковые:

```text
W_xh
W_hh
```

на всех steps.

Это похоже на CNN weight sharing, но уже по temporal positions.

---

## 3. Разворачивание во времени

RNN можно нарисовать:

```text
x1 → [RNN] → h1
             ↓
x2 → [RNN] → h2
             ↓
x3 → [RNN] → h3
```

Boxes имеют одни и те же parameters.

Такое изображение называется unrolled RNN.

---

![Учебная иллюстрация: RNN во времени. Общие параметры, hidden state и длинный путь backpropagation through time.](content-assets/datapath-v2/figures/68_rnn_unrolled.png "Общие параметры, hidden state и длинный путь backpropagation through time.")

## 4. Один шаг руками

Пусть scalar case:

\[
h_t=\tanh(0.5x_t+0.8h_{t-1}).
\]

Пусть:

```text
h0 = 0
x1 = 1
```

\[
h_1=\tanh(0.5)\approx0.462.
\]

Следующий:

```text
x2 = 2
```

\[
h_2
=
\tanh(1+0.8\cdot0.462)
\approx
\tanh(1.370)
\approx0.879.
\]

`h2` зависит и от current `x2`, и от history через `h1`.

---

## 5. Hidden state как summary прошлого

Можно мыслить:

```text
h_t
≈ learned compressed summary x₁...x_t
```

Но это не literal memory всех past values.

Hidden dimension ограничена.

RNN сама учится, какую информацию сохранять и какую забывать.

---

## 6. Sequence-to-one

Пример sentiment classification:

```text
tokens
→ RNN
→ final hidden state
→ classifier
```

Один output на sequence.

---

## 7. Sequence-to-sequence

Пример labeling каждого timestep:

```text
x1 → h1 → y1
x2 → h2 → y2
x3 → h3 → y3
```

Например:

- tagging;
- time-series prediction per step.

---

## 8. Many-to-many с разной длиной

Machine translation исторически использовала encoder-decoder RNN:

```text
input sequence
→ encoder hidden representation
→ decoder output sequence
```

Позже attention решил bottleneck одного fixed-size vector.

Это прямой мост к Transformer.

---

## 9. Shape в PyTorch

`nn.RNN` поддерживает layouts.

При:

```python
batch_first=True
```

input:

```text
[batch, seq_len, input_size]
```

Например:

```text
[32, 50, 128]
```

32 sequences, 50 timesteps, 128 features per timestep.

Output:

```text
[32, 50, hidden_size]
```

для каждого timestep.

Final hidden:

```text
[num_layers * num_directions, batch, hidden_size]
```

---

## 10. Пример PyTorch

```python
import torch
import torch.nn as nn

rnn = nn.RNN(
    input_size=128,
    hidden_size=64,
    batch_first=True,
)

x = torch.randn(32, 50, 128)

output, h_n = rnn(x)

print(output.shape)  # [32,50,64]
print(h_n.shape)     # [1,32,64]
```

---

## 11. `output` vs `h_n`

`output` содержит hidden state последнего RNN layer для **каждого timestep**.

`h_n` содержит final hidden state для каждого layer/direction.

Для simple single-layer unidirectional RNN:

```text
output[:, -1, :]
```

и:

```text
h_n[0]
```

обычно соответствуют final timestep hidden state.

Но при bidirectional/multi-layer model indexing нужно понимать shapes.

---

## 12. Multi-layer RNN

```python
nn.RNN(
    input_size=128,
    hidden_size=64,
    num_layers=3,
)
```

Тогда hidden state одной layer передаётся следующей layer.

Это depth across network, дополнительно к recurrence across time.

---

## 13. Bidirectional RNN

Bidirectional:

```text
forward:
x1 → x2 → x3

backward:
x3 → x2 → x1
```

Representation timestep получает context слева и справа.

Полезно, когда вся sequence доступна заранее.

Но для causal forecasting/streaming backward direction использует future и может быть leakage.

---

## 14. Почему RNN последовательна вычислительно

Чтобы получить \(h_t\), нужен \(h_{t-1}\).

Поэтому timesteps имеют dependency:

```text
h1
→ h2
→ h3
→ ...
```

Это ограничивает parallelization по sequence length.

Transformer позже устранит эту recurrence dependency и сможет обрабатывать tokens parallel within layer.

---

## 15. Backpropagation Through Time

Для training unrolled RNN backprop проходит через sequence steps.

Это называют **Backpropagation Through Time (BPTT)**.

Graph:

```text
h1 → h2 → h3 → ... → hT
```

Gradient раннего timestep проходит через множество recurrent transitions.

Именно здесь особенно проявляются vanishing/exploding gradients.

---

## 16. Почему vanishing gradient особенно силён

При chain rule repeated multiplication:

\[
\frac{\partial h_T}{\partial h_1}
\]

содержит product многих recurrent Jacobians.

Если typical factors меньше 1:

```text
gradient → 0
```

Если больше:

```text
gradient → explode
```

Поэтому vanilla RNN плохо удерживает long-range dependencies.

---

## 17. Пример long dependency

Sentence:

```text
I grew up in France ... many words ... I speak fluent French.
```

Чтобы предсказать `French`, model может нуждаться в information из начала.

Vanilla RNN должна сохранить этот signal через много timesteps.

На практике это трудно.

LSTM/GRU были созданы именно для более управляемого memory flow.

---

## 18. Gradient clipping в RNN

Exploding gradients часто ограничивают:

```python
torch.nn.utils.clip_grad_norm_(
    model.parameters(),
    max_norm=1.0,
)
```

после backward и до optimizer step.

Но clipping не решает vanishing gradient.

---

## 19. Padding sequences

Batch sequences могут иметь разную длину:

```text
7 tokens
12 tokens
4 tokens
```

Чтобы создать rectangular tensor, shorter sequences padding до max length.

Но RNN не должна считать padding real data.

PyTorch предоставляет packed sequences:

```text
pack_padded_sequence
pad_packed_sequence
```

как один из способов избежать лишней обработки padding.

---

## 20. Masks

В других architectures, особенно Transformer, padding чаще игнорируется через masks.

Общая идея одинакова:

> технические padding elements не должны влиять на representation/loss как реальные sequence elements.

---

## 21. Time series и leakage

Bidirectional RNN на historical forecasting может случайно использовать future context.

Также normalization/feature windows могут течь.

Sequence model не отменяет temporal split rules Classic ML.

---

## 22. RNN vs simple lag features

Для tabular time series RNN не автоматически лучше:

```text
lags
rolling statistics
gradient boosting
```

могут быть сильнее и проще.

RNN особенно естественна, когда:

- order важен;
- sequence variable length;
- representation timestep learned jointly.

---

## 23. Интерактивная визуализация DataPath

### Hidden state

Пользователь вводит sequence scalar values.

На каждом timestep обновляется `h_t`.

### Weight sharing

Показать один RNN cell, который визуально переносится по sequence.

### BPTT

Backward arrows проходят от loss к early timesteps.

Slider sequence length показывает shrinking gradient.

### Bidirectional

Показать future leakage warning для forecasting.

---

## 24. Типичные ошибки

**«Каждый timestep имеет свои weights».**\
Нет.

**«Hidden state хранит всю sequence без потерь».**\
Нет, это learned finite representation.

**«Bidirectional всегда лучше».**\
Не для causal tasks.

**«RNN хорошо parallelize по timesteps».**\
Recurrence ограничивает parallelism.

**«Gradient clipping решает vanishing gradients».**\
Нет.

**«output и h_n всегда одно и то же tensor».**\
Нет.

---

## 25. Проверка понимания

1. Формула simple RNN?
2. Что такое hidden state?
3. Почему weights shared?
4. Sequence-to-one vs sequence-to-sequence?
5. Shape input при `batch_first=True`?
6. `output` vs `h_n`?
7. Что такое BPTT?
8. Почему gradients vanish?
9. Когда bidirectional недопустима?
10. Зачем padding/packing?

---

## 26. Мини-практика

Input batch:

```text
batch=16
seq_len=100
input_size=32
```

RNN:

```python
nn.RNN(
    input_size=32,
    hidden_size=64,
    num_layers=2,
    batch_first=True,
)
```

Ответьте:

1. output shape;
2. `h_n` shape;
3. где encoded final representation;
4. что изменится при `bidirectional=True`;
5. почему sequence length 100 сложнее length 10.

---

## 27. Что нужно унести

1. RNN переносит hidden state по sequence.
2. Один cell weights reused на timesteps.
3. Hidden state — learned summary прошлого.
4. BPTT разворачивает gradient через время.
5. Vanilla RNN страдает vanishing/exploding gradients.
6. Bidirectional использует context обеих сторон и не подходит causal prediction.
7. Variable-length batches требуют padding/packing/masking.
8. Sequential dependency ограничивает parallelization.

## Куда дальше

Vanilla RNN плохо хранит long-range signal.

Следующий урок разберёт архитектуры, которые добавляют управляемые **gates**:

- LSTM;
- GRU.

Они учатся решать, что сохранить, забыть и передать дальше.

## Источники
- PyTorch `nn.RNN` documentation.
- PyTorch sequence modeling tutorials.
