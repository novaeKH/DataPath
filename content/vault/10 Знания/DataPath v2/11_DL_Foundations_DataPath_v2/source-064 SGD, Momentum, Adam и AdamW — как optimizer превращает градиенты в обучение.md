---
title: "SGD, Momentum, Adam и AdamW — как optimizer превращает градиенты в обучение"
id: concept.datapath-v2.064
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 64
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# SGD, Momentum, Adam и AdamW

Backpropagation уже вычислил:

\[
g_t=\nabla_\theta L.
\]

Теперь optimizer должен решить:

> **как превратить этот gradient в update parameters?**

Самый простой вариант:

\[
\theta_{t+1}
=
\theta_t-\eta g_t.
\]

Это градиентный спуск.

Но в Deep Learning gradients считаются по mini-batches, noisy, имеют разный scale в разных parameters и могут сильно менять direction.

Поэтому появились Momentum, Adam и AdamW.

---

## 1. Batch Gradient Descent

Если gradient считается по **всему train dataset** перед каждым update:

```text
full-batch gradient descent
```

Плюс:

- точный gradient текущей empirical loss.

Минус:

- один step очень дорогой на больших data.

---

## 2. Stochastic Gradient Descent

В исторически строгом смысле SGD обновляется по одному случайному object.

В современном Deep Learning `torch.optim.SGD` обычно используется с **mini-batches**.

То есть на практике под SGD часто подразумевают:

```text
batch
→ gradient estimate
→ update
```

Gradient шумнее full-batch, но steps намного дешевле.

---

## 3. Почему шум gradient не обязательно плох

Mini-batch gradient:

\[
g_B
\]

— estimate полного gradient.

Он меняется от batch к batch.

Noise:

- делает trajectory менее гладкой;
- но позволяет быстро делать updates;
- иногда помогает optimization/generalization behavior.

Больший batch:

```text
gradient стабильнее
compute per step больше
```

Меньший:

```text
gradient шумнее
steps дешевле
```

---

## 4. Learning rate — самый важный hyperparameter optimizer

Update SGD:

\[
\theta_{t+1}
=
\theta_t-\eta g_t.
\]

Если \(\eta\) слишком мало:

```text
обучение медленное
```

Если слишком велико:

```text
overshoot
oscillation
divergence
NaN
```

Не существует одного best `lr` для всех architectures.

---

## 5. Почему разные directions могут иметь разную curvature

Представим elongated valley:

```text
по одной оси loss меняется резко
по другой медленно
```

Обычный SGD может zig-zag по steep direction и медленно двигаться вдоль valley.

Momentum пытается накапливать устойчивое направление движения.

---

## 6. Momentum

Упрощённая идея:

\[
v_t=\beta v_{t-1}+g_t,
\]

\[
\theta_{t+1}
=
\theta_t-\eta v_t.
\]

Где \(v_t\) — накопленное направление.

Если gradients несколько steps направлены одинаково:

```text
velocity растёт
→ движение ускоряется
```

Если gradient шумно меняется поперёк основного направления:

```text
колебания частично сглаживаются
```

---

## 7. Физическая аналогия Momentum

Обычный SGD похож на:

> каждый step забыть прошлое и идти только по текущему slope.

Momentum:

> шар имеет инерцию; новые gradients корректируют уже накопленное движение.

Аналогия полезна, но не надо воспринимать optimizer буквально как физическую симуляцию.

---

## 8. PyTorch SGD

```python
optimizer = torch.optim.SGD(
    model.parameters(),
    lr=0.01,
    momentum=0.9,
)
```

Официальная PyTorch `SGD` поддерживает SGD с optional momentum и другими controls.

`momentum=0.9` означает сильное использование предыдущего velocity state.

---

## 9. Nesterov momentum

Nesterov acceleration можно интуитивно понимать как gradient evaluation с учётом momentum look-ahead.

В PyTorch:

```python
torch.optim.SGD(
    params,
    lr=...,
    momentum=0.9,
    nesterov=True,
)
```

Это полезно знать, но для foundation важнее обычный Momentum.

---

## 10. Проблема одного global learning rate

У network разные parameters могут иметь gradients разного typical magnitude.

SGD использует один базовый learning rate для всех, если не настроены parameter groups.

Adaptive optimizers пытаются автоматически масштабировать updates по history gradients.

---

# Adam

## 11. Главная идея Adam

Adam = Adaptive Moment Estimation.

Он ведёт для каждого parameter moving estimates:

```text
первый момент  → среднее gradient
второй момент  → среднее squared gradient
```

Упрощённо:

\[
m_t
=
\beta_1m_{t-1}
+
(1-\beta_1)g_t,
\]

\[
v_t
=
\beta_2v_{t-1}
+
(1-\beta_2)g_t^2.
\]

---

![Учебная иллюстрация: SGD, Momentum и Adam. Три optimizer trajectory на одном loss landscape.](content-assets/datapath-v2/figures/64_optimizers.png "Три optimizer trajectory на одном loss landscape.")

## 12. Что дают два момента

\(m_t\):

```text
momentum-like direction
```

\(v_t\):

```text
typical squared gradient scale
```

Update roughly:

\[
\theta
\leftarrow
\theta
-
\eta
\frac{\hat m_t}
{\sqrt{\hat v_t}+\epsilon}.
\]

Если parameter historically имеет большие gradients, denominator растёт и effective step уменьшается.

---

## 13. Bias correction

В начале:

```text
m0 = 0
v0 = 0
```

Moving averages biased toward zero.

Adam использует bias-corrected estimates:

\[
\hat m_t
=
\frac{m_t}{1-\beta_1^t},
\]

\[
\hat v_t
=
\frac{v_t}{1-\beta_2^t}.
\]

Это особенно важно на первых iterations.

---

## 14. `eps`

\[
\sqrt{\hat v_t}+\epsilon
\]

`eps` предотвращает division by zero и влияет на numerical stability.

Обычно default достаточен.

Не нужно тюнить `eps` без причины.

---

## 15. Почему Adam популярен

Практические плюсы:

- часто работает с reasonable default `lr`;
- adaptive scaling;
- momentum-like behavior;
- удобен для noisy/high-dimensional gradients;
- хорошая starting point для многих DL architectures.

Но:

> Adam не гарантирует лучшую generalization или convergence для любой задачи.

SGD+Momentum остаётся важным optimizer, особенно в некоторых vision regimes.

---

## 16. PyTorch Adam

```python
optimizer = torch.optim.Adam(
    model.parameters(),
    lr=1e-3,
)
```

Common defaults:

```text
betas=(0.9, 0.999)
eps=1e-8
```

Конкретные defaults всегда лучше сверять с installed PyTorch docs.

---

# Weight Decay

## 17. Зачем уменьшать weights

Large weights могут быть признаком слишком сложной solution.

Одна regularization idea:

\[
L_{total}
=
L_{data}
+
\lambda\|\theta\|^2.
\]

Для plain SGD L2 penalty и multiplicative weight decay тесно связаны.

Но для adaptive optimizers вроде Adam это различие становится важным.

---

## 18. Adam vs AdamW

Классический Adam с L2-like regularization и **decoupled weight decay** — не одно и то же update.

AdamW отделяет shrinkage weights от moment estimates.

Официальная PyTorch документация формулирует это как weight decay, который не накапливается внутри momentum/variance states Adam.

Mental model:

```text
Adam:
adaptive gradient update
(+ regularization может взаимодействовать с adaptive scaling)

AdamW:
adaptive gradient update
+
отдельный weight decay step
```

---

## 19. Почему AdamW стал стандартным выбором во многих современных architectures

Decoupled weight decay проще интерпретировать и чаще соответствует тому behavior regularization, которого ожидают от weight decay при Adam-like optimization.

Поэтому в Transformer training часто выбирают AdamW.

Но это не означает:

> AdamW всегда лучше SGD/Adam.

Optimizer — часть experiment.

---

## 20. PyTorch AdamW

```python
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    weight_decay=1e-2,
)
```

В актуальной PyTorch документации default `weight_decay` у `AdamW` указан как 0.01.

Не нужно переносить этот default бездумно на любую задачу.

---

## 21. Weight decay не всегда применяют ко всем parameters одинаково

В Transformer-like training часто не применяют decay к:

- bias;
- normalization scale parameters.

Можно создать parameter groups:

```python
optimizer = torch.optim.AdamW([
    {"params": decay_params, "weight_decay": 0.01},
    {"params": no_decay_params, "weight_decay": 0.0},
], lr=1e-3)
```

Но начинающему важно понять principle прежде, чем копировать сложный grouping recipe.

---

## 22. Learning-rate schedules

Даже хороший optimizer может выигрывать от изменения lr во времени.

Идеи:

### Step decay

Периодически уменьшать lr.

### Cosine schedule

Плавно уменьшать по cosine-like curve.

### Warmup

Начать с маленького lr и постепенно поднять до target.

Warmup особенно распространён в больших Transformer trainings.

---

## 23. Почему lr можно уменьшать со временем

В начале:

```text
далеко от хорошего region
→ нужны крупнее steps
```

Ближе к optimum:

```text
крупные steps начинают overshoot
→ lr полезно уменьшить
```

Но adaptive optimizer уже меняет effective step per parameter, поэтому schedule и optimizer взаимодействуют.

---

## 24. Training loop

```python
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    weight_decay=1e-2,
)

for x, y in train_loader:
    optimizer.zero_grad()

    logits = model(x)
    loss = loss_fn(logits, y)

    loss.backward()

    optimizer.step()
```

Если есть scheduler, часто:

```python
scheduler.step()
```

вызывается в определённый момент согласно API конкретного scheduler.

---

## 25. Что логировать

Минимум:

```text
train loss
validation loss
learning rate
primary validation metric
```

При debugging:

```text
gradient norm
weight norm
```

Без curves сложно понять, optimizer действительно помогает или model overfits/diverges.

---

## 26. Как сравнивать optimizers честно

Нельзя:

```text
SGD lr=0.001
Adam lr=0.001
→ Adam лучше
```

один и тот же lr имеет разный effective meaning.

Нужно дать каждому optimizer reasonable search range и одинаковый validation budget.

---

## 27. Пример behavior

### SGD слишком маленький lr

```text
loss падает очень медленно
```

### SGD слишком большой

```text
loss oscillates / diverges
```

### Momentum

```text
быстрее проходит elongated valley
```

### Adam

```text
быстро стабилизирует разные gradient scales
```

### AdamW

```text
Adam-like optimization + decoupled decay
```

---

## 28. Batch size взаимодействует с optimizer

Большой batch:

```text
gradient noise ↓
memory ↑
steps per epoch ↓
```

При изменении batch size иногда требуется менять learning rate.

Поэтому optimizer hyperparameters нельзя полностью отделять от batching regime.

---

## 29. Epoch и step

**Шаг (step / iteration)** — один optimizer update.

**Эпоха (epoch)** — один полный проход training dataset.

Если:

```text
dataset = 10 000
batch = 100
```

то примерно:

```text
100 steps per epoch
```

Learning-rate scheduler может быть step-based или epoch-based.

---

## 30. Интерактивная визуализация DataPath

### Режим 1. Loss landscape

2D elongated valley.

Траектории:

```text
SGD
SGD+Momentum
Adam
```

### Режим 2. Learning rate

Slider:

```text
1e-5 → 1 → 10
```

Показывать slow/convergent/divergent paths.

### Режим 3. Adam moments

Для одного parameter показывать stream gradients и moving:

```text
m
v
effective update
```

### Режим 4. Adam vs AdamW

Показать, что weight decay у AdamW применяется отдельно от moment normalization.

---

## 31. Типичные ошибки

**«Backprop и SGD одно и то же».**\
Нет.

**«Adam не требует learning rate».**\
Требует.

**«Adam всегда лучше SGD».**\
Нет.

**«Weight decay = dropout».**\
Нет.

**«Adam и AdamW отличаются только буквой W».**\
Нет, decay decoupled.

**«Один lr надо использовать для всех optimizers для честного сравнения».**\
Нет.

**«Epoch = один batch».**\
Нет.

---

## 32. Проверка понимания

1. Full-batch vs mini-batch?
2. Что контролирует learning rate?
3. Зачем Momentum?
4. Что хранит Adam в \(m_t\)?
5. Что хранит \(v_t\)?
6. Зачем bias correction?
7. Adam vs AdamW?
8. Что делает weight decay?
9. Что такое warmup?
10. Step vs epoch?

---

## 33. Мини-практика

Training:

```text
MLP
batch=128

Experiment A:
SGD lr=1e-5
loss почти не меняется

B:
SGD lr=1
loss → NaN

C:
SGD lr=0.05 momentum=0.9
validation grows steadily

D:
AdamW lr=1e-3
train decreases quickly,
validation starts growing after epoch 30
```

Ответьте:

1. проблема A;
2. проблема B;
3. что улучшил Momentum в C;
4. является ли D «плохим optimizer»;
5. что делать с overfit после epoch 30.

---

## 34. Как объяснить на собеседовании

### SGD

Использует gradient mini-batch и делает step против него с learning rate.

### Momentum

Накапливает moving direction gradients, сглаживая oscillations и ускоряя движение в устойчивом направлении.

### Adam

Использует moving estimates first и second moments gradients для momentum-like и adaptive per-parameter updates.

### AdamW

Adam с decoupled weight decay: shrinkage parameters отделено от moment estimates.

---

## Что нужно унести

1. Backprop вычисляет gradient, optimizer делает update.
2. Mini-batch SGD использует noisy gradient estimates.
3. Learning rate — ключевой optimizer hyperparameter.
4. Momentum накапливает устойчивое направление.
5. Adam использует first/second moment estimates и bias correction.
6. AdamW отделяет weight decay от adaptive moments.
7. Scheduler меняет lr во времени.
8. Batch size и optimizer взаимодействуют.
9. Optimizers сравнивают после разумного tuning каждого.
10. Следующая проблема — не только optimization, но и generalization/stability.

## Куда дальше

Даже идеально работающий optimizer может переобучить model.

И даже хорошая architecture может не запуститься из-за плохой initialization или unstable activations.

Следующий урок — **регуляризация и стабилизация**: weight decay, dropout, normalization, initialization, early stopping и debugging training curves.

## Источники
- PyTorch `torch.optim`.
- PyTorch `SGD`, `Adam`, `AdamW`.
