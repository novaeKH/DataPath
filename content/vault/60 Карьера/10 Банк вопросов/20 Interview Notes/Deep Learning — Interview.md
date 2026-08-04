---
title: Deep Learning — Interview
type: interview
area: career
status: active
aliases:
  - Deep Learning Interview
tags:
  - interview/dl
id: interview.career.deep-learning-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Deep Learning — Interview

> Knowledge: [[Neural Networks and Backpropagation]], [[Optimization and Regularization in Deep Learning]].

## Вопрос 1 — Что делает neuron и Linear layer?

### Ответ 20–30 секунд

Neuron вычисляет weighted sum $z=w^\top x+b$ и обычно передаёт её в nonlinear activation. Linear layer делает это сразу для batch и нескольких outputs: $Z=XW^\top+b$. Без nonlinearities композиция linear layers остаётся одной linear transformation.

### Если попросят глубже

Weights определяют направления features, bias сдвигает boundary, activation добавляет способность строить nonlinear functions. Shape conventions зависят от framework, поэтому я всегда проверяю batch и feature dimensions.

### Follow-up

- Почему ReLU помогает deep networks?
- Что такое dead ReLU?

### Связанные знания

- [[Neural Networks and Backpropagation]]
- [[Linear Algebra for ML]]

## Вопрос 2 — Что такое computational graph и backpropagation?

### Ответ 20–30 секунд

Forward pass сохраняет промежуточные операции и считает loss. Backpropagation идёт по graph в обратном topological order и применяет chain rule, чтобы получить gradient loss по каждому parameter. Затем optimizer использует gradients для update.

### Если попросят глубже

Для узла с несколькими downstream paths gradient contributions складываются. Backprop не является optimizer: он вычисляет derivatives, а SGD или Adam выбирают правило изменения parameters.

### Follow-up

- Почему gradients накапливаются в PyTorch?
- Откуда берутся vanishing gradients?

### Связанные знания

- [[Gradients Chain Rule and Optimization]]
- [[Neural Networks and Backpropagation]]
- [[PyTorch Training Loop — Practice]]

## Вопрос 3 — Чем SGD, Momentum, Adam и AdamW отличаются?

### Ответ 20–30 секунд

SGD идёт против текущего gradient. Momentum усредняет направление и снижает oscillations. Adam масштабирует update с помощью moving averages first и second moments. AdamW отделяет weight decay от adaptive gradient update, поэтому его regularization легче интерпретировать.

### Если попросят глубже

Adam часто быстрее даёт хороший training loss, но learning rate всё равно критичен. Decoupled weight decay не надо автоматически применять к bias и normalization parameters.

### Follow-up

- Почему Adam не устраняет необходимость scheduler?
- Чем weight decay отличается от L2 внутри Adam?

### Связанные знания

- [[Optimization and Regularization in Deep Learning]]
- [[Gradients Chain Rule and Optimization]]

## Вопрос 4 — Зачем нужны initialization и normalization?

### Ответ 20–30 секунд

Initialization задаёт scale activations и gradients в начале training. Xavier подходит для symmetric activations, He — для ReLU-like. Normalization стабилизирует distribution внутренних representations и упрощает optimization; BatchNorm использует batch statistics, LayerNorm — features одного example.

### Если попросят глубже

Плохой scale приводит к exploding или vanishing signals. BatchNorm ведёт себя по-разному в train и eval, а LayerNorm не зависит от других examples batch и поэтому удобна в Transformers.

### Follow-up

- Почему нулевые weights плохи?
- Что забывают при inference с BatchNorm?

### Связанные знания

- [[Optimization and Regularization in Deep Learning]]

## Вопрос 5 — Как regularize neural network?

### Ответ 20–30 секунд

Сначала исправляю split и baseline, затем использую data augmentation, weight decay, dropout, early stopping или меньшую capacity. Dropout случайно зануляет activations только во время train; в eval он отключён.

### Если попросят глубже

Regularization — не замена данным и корректной validation. Выбор зависит от architecture: aggressive dropout может мешать, а normalization и residual paths меняют optimization dynamics.

### Follow-up

- Почему train loss с dropout шумнее?
- Как отличить overfitting от distribution shift?

### Связанные знания

- [[Optimization and Regularization in Deep Learning]]
- [[Validation Splits and Data Leakage]]

