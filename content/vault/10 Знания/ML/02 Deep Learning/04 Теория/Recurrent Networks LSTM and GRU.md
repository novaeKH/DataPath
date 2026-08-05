---
title: Recurrent Networks LSTM and GRU
id: concept.dl.recurrent-lstm-gru
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
- RNN LSTM GRU
- Рекуррентные сети
tags:
- dl/rnn
- sequence-modeling
math_depth: 2
---

# Recurrent Networks, LSTM and GRU

## Зачем sequence model

Для текста, временных рядов и событий порядок имеет значение. RNN обновляет hidden state при каждом step:

$$
h_t=\phi(W_xx_t+W_hh_{t-1}+b).
$$

$h_t$ суммирует прошлый контекст.

## Vanilla RNN

Один и тот же transition применяется ко всем positions. Training использует backpropagation through time. Длинная цепочка multiplications вызывает vanishing/exploding gradients.

## LSTM

LSTM вводит cell state и gates:

- forget — что сохранить из прошлого;
- input — что записать;
- output — что показать как hidden state.

Gates используют sigmoid и позволяют gradient проходить по более стабильному пути.

## GRU

GRU объединяет часть LSTM gates и не имеет отдельного cell state. Обычно проще и быстрее, но superiority зависит от task.

## Shapes и PyTorch

При `batch_first=True`:

```text
input:  (B, T, input_size)
output: (B, T, hidden_size * directions)
```

Hidden state содержит layers/directions axis. Неверное понимание shapes — частая ошибка.

## Many-to-one и many-to-many

- sequence classification: использовать final/pooled hidden;
- token labeling: output каждого timestep;
- forecasting: predict next/multiple steps;
- encoder-decoder: sequence → sequence.

Padding требует lengths/mask или packed sequence.

## Teacher forcing

В sequence generation decoder во время train может получать true previous token, а inference — собственный prediction. Это создаёт exposure bias. Ratio teacher forcing является training decision.

## Когда RNN всё ещё полезна

- streaming/online sequence;
- небольшие models;
- короткие/medium sequences;
- low latency;
- временные ряды с recurrent inductive bias.

Transformers лучше parallelize training и захватывают long-range dependencies, но дороже по attention memory.

## Визуализация

Компонент `rnn-state-gates-lab`:

- sequence steps;
- hidden-state update;
- vanishing gradient trace;
- LSTM gates;
- GRU comparison;
- padding mask.

## Частые ошибки

- перепутать sequence/batch axis;
- использовать output последнего padded timestep;
- забыть detach hidden в truncated BPTT;
- exploding gradients без clipping;
- data leakage в temporal windows;
- random split time series;
- сравнивать RNN/Transformer без одинаковой validation.

## Связи

- [[Neural Networks and Backpropagation]]
- [[Embeddings and Attention]]
- [[Transformer and Language Modeling]]
