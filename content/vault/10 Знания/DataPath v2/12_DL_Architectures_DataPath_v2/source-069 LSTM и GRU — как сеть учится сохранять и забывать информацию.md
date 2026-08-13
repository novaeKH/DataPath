---
title: "LSTM и GRU — как сеть учится сохранять и забывать информацию"
id: concept.datapath-v2.069
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 69
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# LSTM и GRU: как сеть учится сохранять и забывать информацию

Vanilla RNN обновляет hidden state одной общей формулой:

\[
h_t=\tanh(W_xx_t+W_hh_{t-1}+b).
\]

Это просто, но long-range information приходится многократно проталкивать через нелинейные transformations.

Градиент тоже проходит длинную цепочку.

Отсюда проблемы:

```text
vanishing gradients
exploding gradients
poor long-term memory
```

**LSTM (Long Short-Term Memory)** добавляет отдельный memory path и gates, которые управляют сохранением/удалением информации.

**GRU (Gated Recurrent Unit)** решает похожую задачу более компактно.

---

## 1. Главная идея gates

Gate — learnable mechanism, который выдаёт values примерно от 0 до 1.

Обычно используется sigmoid:

\[
\sigma(z)\in(0,1).
\]

Интуитивно:

```text
0 → почти закрыть поток
1 → почти полностью пропустить
```

Но gate не hard switch. Это differentiable soft control.

---

# LSTM

## 2. Два состояния

У LSTM обычно есть:

```text
h_t → hidden state
c_t → cell state
```

Cell state — отдельная memory highway.

Идея:

> information может проходить через many timesteps с более прямым additive path, а gates управляют тем, что забывается и добавляется.

---

## 3. Forget gate

Forget gate:

\[
f_t=
\sigma(W_f[x_t,h_{t-1}]+b_f).
\]

Он отвечает:

> какую часть прошлого cell state сохранить?

Применяем:

\[
f_t\odot c_{t-1}.
\]

Если component gate близка к 1, соответствующая memory сохраняется.

Если к 0 — забывается.

---

## 4. Input gate

Input gate определяет, сколько новой candidate information записать:

\[
i_t=
\sigma(W_i[x_t,h_{t-1}]+b_i).
\]

Candidate:

\[
\tilde c_t=
\tanh(W_c[x_t,h_{t-1}]+b_c).
\]

Новая часть:

\[
i_t\odot \tilde c_t.
\]

---

## 5. Обновление cell state

Главная formula:

\[
c_t
=
f_t\odot c_{t-1}
+
i_t\odot\tilde c_t.
\]

Это очень важная structure.

Вместо полного replacement state:

```text
новое state = nonlinear transform всего
```

есть additive combination:

```text
часть старой memory
+
часть новой information
```

Additive path помогает gradient flow.

---

## 6. Output gate

Output gate:

\[
o_t=
\sigma(W_o[x_t,h_{t-1}]+b_o).
\]

Hidden state:

\[
h_t
=
o_t\odot\tanh(c_t).
\]

То есть cell memory и visible hidden representation — не одно и то же.

---

## 7. LSTM как четыре вычислительных блока

На каждом timestep:

```text
forget gate
input gate
candidate memory
output gate
```

Это означает больше parameters и compute, чем vanilla RNN.

Но network получает гораздо более управляемый memory mechanism.

---

## 8. Почему LSTM помогает gradient flow

Производная cell state по предыдущему:

\[
\frac{\partial c_t}
{\partial c_{t-1}}
\]

содержит forget gate.

Если:

```text
f_t ≈ 1
```

gradient может проходить через cell path без постоянного умножения на насыщенный tanh/recurrent matrix так агрессивно, как в vanilla RNN.

Это не означает, что LSTM полностью устраняет vanishing gradients, но делает long-term dependencies намного практичнее.

---

![Учебная иллюстрация: LSTM gates. Cell state и точный update через forget, input, candidate и output gates.](content-assets/datapath-v2/figures/69_lstm_gates.png "Cell state и точный update через forget, input, candidate и output gates.")

## 9. Интуитивный текстовый пример

Sentence:

```text
The movie was not at all ...
...
good.
```

Model может научиться сохранять information о `not` через cell state, пока не встретит downstream word, где эта information полезна.

Не нужно считать, что отдельный конкретный gate буквально хранит слово `not`. Representation distributed.

Но gates позволяют network контролировать memory lifetime.

---

## 10. PyTorch `nn.LSTM`

```python
import torch.nn as nn

lstm = nn.LSTM(
    input_size=128,
    hidden_size=64,
    num_layers=2,
    batch_first=True,
)
```

Input:

```text
[batch, seq_len, 128]
```

Output:

```text
[batch, seq_len, 64]
```

Для unidirectional case.

Также возвращаются:

```text
h_n
c_n
```

оба shape:

```text
[num_layers * num_directions, batch, hidden_size]
```

---

## 11. Пример

```python
import torch

x = torch.randn(32, 50, 128)

output, (h_n, c_n) = lstm(x)

print(output.shape)
print(h_n.shape)
print(c_n.shape)
```

Для 2 layers:

```text
output: [32,50,64]
h_n:    [2,32,64]
c_n:    [2,32,64]
```

---

# GRU

## 12. Почему появилась GRU

LSTM эффективна, но имеет много gates и parameters.

GRU упрощает architecture.

Обычно используются:

```text
update gate
reset gate
```

и отдельного cell state \(c_t\) нет.

Hidden state одновременно несёт memory и output representation.

---

## 13. Update gate

Update gate решает:

> насколько сохранить старое hidden state и насколько заменить новым candidate?

Упрощённо:

\[
z_t=\sigma(...).
\]

Final update смешивает old/new state.

---

## 14. Reset gate

Reset gate:

\[
r_t=\sigma(...).
\]

Контролирует, насколько прошлое hidden state участвует в построении candidate.

Если reset gate маленький, candidate может почти игнорировать old memory.

---

## 15. GRU vs LSTM

| | LSTM | GRU |
|---|---|---|
| Состояния | \(h_t,c_t\) | обычно только \(h_t\) |
| Gates | forget/input/output | update/reset |
| Parameters | больше | меньше |
| Compute | тяжелее | обычно легче |
| Long dependencies | сильная classic choice | тоже хорошо работает |

Нет правила:

> LSTM всегда лучше GRU.

На конкретной задаче сравнение делается экспериментально.

---

## 16. PyTorch `nn.GRU`

```python
gru = nn.GRU(
    input_size=128,
    hidden_size=64,
    num_layers=2,
    batch_first=True,
)
```

Return:

```text
output
h_n
```

без отдельного `c_n`.

---

## 17. Bidirectional LSTM/GRU

```python
bidirectional=True
```

тогда:

```text
num_directions = 2
```

Output feature dimension:

```text
2 * hidden_size
```

Например hidden=64:

```text
output: [batch,seq,128]
```

Final hidden shape:

```text
[num_layers*2,batch,64]
```

Как и раньше, bidirectional нельзя применять там, где future sequence unavailable.

---

## 18. Dropout между recurrent layers

В PyTorch `nn.LSTM(..., dropout=p, num_layers>1)` применяет dropout между stacked recurrent layers, а не как простой dropout на recurrent connection каждого timestep.

Это implementation detail, которое полезно понимать при ожиданиях от parameter `dropout`.

---

## 19. Packed sequences

LSTM/GRU тоже могут работать с packed variable-length batches.

Workflow:

```text
padded batch
+ lengths
→ pack_padded_sequence
→ LSTM
→ unpack if needed
```

Это помогает избежать computation по padding positions.

Но sorted/unsorted API details зависят от arguments, поэтому syntax нужно сверять с docs.

---

## 20. Many-to-one classifier

```python
class SequenceClassifier(nn.Module):
    def __init__(self, input_size, hidden_size, n_classes):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size,
            hidden_size,
            batch_first=True,
        )
        self.head = nn.Linear(hidden_size, n_classes)

    def forward(self, x):
        output, (h_n, c_n) = self.lstm(x)
        final_h = h_n[-1]
        return self.head(final_h)
```

Для bidirectional indexing final states нужно делать осознанно.

---

## 21. Truncated BPTT

Для очень длинных sequences полный graph на thousands timesteps дорог по memory.

Можно training chunks:

```text
100 timesteps
→ backward
→ detach hidden
→ next chunk
```

Это **truncated BPTT**.

Цена: gradient не проходит бесконечно далеко назад.

Практический компромисс memory/computation vs dependency length.

---

## 22. Stateful processing

Иногда hidden state переносится между consecutive chunks одного long stream.

Важно:

```python
h = h.detach()
```

между chunks, если не хотим сохранять computational graph всей истории.

Иначе memory graph будет расти.

---

## 23. Почему Transformer вытеснил RNN во многих NLP задачах

Не потому, что LSTM «не работает».

Главные преимущества Transformer:

- parallel processing tokens внутри layer;
- attention создаёт короткий path между distant positions;
- хорошо масштабируется.

Но LSTM/GRU остаются полезными:

- small sequence tasks;
- streaming;
- edge/on-device;
- time series;
- когда recurrence inductive bias полезен.

---

## 24. Интерактивная визуализация

### LSTM memory highway

Показать `c_t` как horizontal line.

Sliders:

```text
forget gate
input gate
```

Пользователь видит, сколько old/new memory остаётся.

### GRU

Показать update/reset gates и отсутствие отдельного cell state.

### Gradient path

Vanilla RNN vs LSTM cell path на 20 timesteps.

### Bidirectional warning

Forecast task → backward direction подсвечивается как future leakage.

---

## 25. Типичные ошибки

**«LSTM не имеет hidden state, только cell state».**\
Есть оба.

**«GRU имеет отдельный c_t как LSTM».**\
Обычно нет.

**«Gate = hard 0/1 switch».**\
Обычно sigmoid continuous values.

**«LSTM полностью решает vanishing gradient».**\
Нет, но сильно помогает.

**«Bidirectional всегда безопасна».**\
Не для causal tasks.

**«PyTorch LSTM dropout применяется на recurrent state каждого timestep в точности как обычный Dropout layer».**\
Нет, parameter имеет конкретную stacked-layer semantics.

---

## 26. Проверка понимания

1. Зачем cell state LSTM?
2. Что делает forget gate?
3. Что делает input gate?
4. Что делает output gate?
5. Почему additive cell update помогает?
6. LSTM vs GRU?
7. Что возвращает PyTorch LSTM?
8. Что меняется bidirectional?
9. Что такое truncated BPTT?
10. Почему Transformer parallelizes лучше?

---

## 27. Мини-практика

LSTM:

```python
nn.LSTM(
    input_size=40,
    hidden_size=128,
    num_layers=3,
    batch_first=True,
    bidirectional=True,
)
```

Input:

```text
[16,200,40]
```

Ответьте:

1. output shape;
2. h_n shape;
3. c_n shape;
4. final representation dimension для concat directions;
5. допустима ли bidirectional model для one-step-ahead online forecasting.

---

## Что нужно унести

1. LSTM добавляет cell state и gates.
2. Cell update имеет additive path.
3. Forget/input/output gates управляют memory flow.
4. GRU — более компактная gated architecture.
5. PyTorch LSTM возвращает output, h_n, c_n.
6. GRU возвращает output и h_n.
7. Bidirectional doubles directions и использует future context.
8. Truncated BPTT ограничивает graph по длинным sequences.
9. LSTM/GRU помогают long dependencies, но остаются sequential architectures.

## Куда дальше

До сих пор каждый timestep уже должен был быть numeric vector.

Но в NLP input — это IDs слов/токенов.

Следующий урок разберёт **embeddings**: как category/token ID превращается в обучаемый dense vector и почему это не то же самое, что One-hot encoding.

## Источники
- PyTorch `nn.LSTM`, `nn.GRU`.
- PyTorch sequence-modeling tutorials.
