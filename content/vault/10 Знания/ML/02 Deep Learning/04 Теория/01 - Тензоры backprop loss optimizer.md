---
title: "Тензоры, backpropagation, loss и optimizer"
type: source
area: dl
status: deprecated
tags:
  - deep-learning
  - theory
  - interview
rag: exclude
id: source.dl.tenzory-backpropagation-loss-i-optimizer
schema_version: 2
language: ru
app: exclude
---
# Тензоры, backpropagation, loss и optimizer

> [!info] Legacy course note
> Canonical theory: [[Neural Networks and Backpropagation]] и [[Optimization and Regularization in Deep Learning]]. Файл сохранён как расширенный course/reference material, но исключён из RAG из-за multi-topic структуры и notebook-state.

> [!tip] Закрепление
> После этой заметки: [[10 Знания/ML/02 Deep Learning/05 Тренажер/01 - Фундамент и обучение]] · [[10 Знания/ML/02 Deep Learning/05 Тренажер/02 - Формы и параметры]] · [[10 Знания/ML/02 Deep Learning/05 Тренажер/03 - Найди ошибку PyTorch]].

## Deep Learning для собеседований: от градиента до LLM

**Цель:** закрыть фундамент Deep Learning для стажировки `Data Scientist / DS & LLM / AI Agents` и понимать, что происходит внутри StoryWeaver.

Это не энциклопедия и не набор определений. После прохождения ты должен уметь:

- объяснить `forward → loss → backward → optimizer.step`;
- определить формы тензоров и число параметров;
- выбрать выход модели, loss и метрику под задачу;
- написать и отладить цикл обучения PyTorch;
- объяснить CNN, RNN/LSTM/GRU на уровне собеседования;
- вручную пройти через `Q`, `K`, `V`, causal mask и multi-head attention;
- объяснить обучение decoder-only LLM, perplexity, sampling, LoRA и основные инженерные приёмы.

**Как заниматься:** сначала ответь на вопрос в блоке «Проверь себя», затем открой ответ. Код запускай, меняй и объясняй вслух. Простого чтения недостаточно.

> RAG и AI-агенты используют LLM, но не являются разделами DL. Граница между темами обозначена в конце курса.

### Маршрут и приоритеты

| Модуль | Результат | Приоритет |
|---|---|---:|
| 1–3 | тензоры, Linear, logits, loss, backprop | обязательно |
| 4–7 | оптимизация, регуляризация, PyTorch pipeline | обязательно |
| 8 | CNN и задачи CV | обзор + расчёты |
| 9 | RNN, LSTM, GRU | обзор |
| 10–13 | embeddings, attention, Transformer, GPT | обязательно |
| 14 | обучение и fine-tuning LLM | обязательно |
| 15 | диагностика и финальный чек-лист | обязательно |

Рекомендуемый порядок: **8 учебных сессий по 1.5–2 часа**. После каждой сессии реши соответствующий раздел второго ноутбука.

### 0. Подготовка среды

Ноутбук рассчитан на Google Colab или локальную среду с Python 3.10+ и PyTorch. В Colab PyTorch уже установлен.

```python
import math
import random
import copy

import numpy as np
import matplotlib.pyplot as plt
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("PyTorch:", torch.__version__)
print("Device:", device)
```

## 1. Тензоры, формы и линейный слой

### 1.1. Тензор — данные с формой и типом

В DL почти каждая ошибка сводится к одному из трёх вопросов:

1. Какая форма тензора?
2. Какой у него `dtype`?
3. На каком устройстве он находится?

Для табличного батча:

$$
X \in \mathbb{R}^{B \times d_{in}},
\quad
W \in \mathbb{R}^{d_{out} \times d_{in}},
\quad
b \in \mathbb{R}^{d_{out}}
$$

PyTorch хранит веса `nn.Linear` как `(out_features, in_features)`, а считает:

$$
Y = XW^T + b,\qquad
Y \in \mathbb{R}^{B \times d_{out}}.
$$

Число обучаемых параметров:

$$
d_{out}d_{in} + d_{out}.
$$

```python
batch = torch.randn(32, 10)
layer = nn.Linear(in_features=10, out_features=4)
output = layer(batch)

parameter_count = sum(p.numel() for p in layer.parameters())

print("X:", batch.shape)
print("W:", layer.weight.shape)
print("b:", layer.bias.shape)
print("Y:", output.shape)
print("Параметров:", parameter_count)  # 10 * 4 + 4 = 44
```

### 1.2. Полносвязная сеть и нелинейность

Несколько линейных слоёв без активаций эквивалентны одному линейному преобразованию:

$$
W_2(W_1x+b_1)+b_2 = Wx+b.
$$

Нелинейная активация позволяет строить нелинейные границы решений.

- `ReLU(x)=max(0,x)` — стандарт для MLP/CNN;
- `LeakyReLU` сохраняет небольшой градиент при $x<0$;
- `GELU` — гладкая активация, часто используемая в Transformer;
- `sigmoid` — перевод одного logit в вероятность бинарного класса;
- `softmax` — перевод нескольких logits в распределение по классам.

**Важно:** sigmoid/softmax часто не включают в модель во время обучения, потому что стабильные loss-функции PyTorch принимают сырые logits.

### 1.3. Универсальная теорема аппроксимации

В упрощённой формулировке: полносвязная сеть с хотя бы одним достаточно широким скрытым слоем и подходящей нелинейностью может сколь угодно точно аппроксимировать непрерывную функцию на компактной области.

Теорема **не говорит**, что:

- сеть будет маленькой;
- gradient descent найдёт нужные веса;
- данных достаточно;
- модель хорошо обобщится.

Это утверждение о выразимости архитектуры, а не гарантия успешного обучения. Глубина часто представляет сложные функции эффективнее, чем один чрезвычайно широкий слой.

```python
mlp = nn.Sequential(
    nn.Linear(10, 16),
    nn.ReLU(),
    nn.Linear(16, 3),
)

logits = mlp(batch)
print("Logits:", logits.shape)
print("Параметров:", sum(p.numel() for p in mlp.parameters()))
```

#### Проверь себя

    Слой `Linear(128, 32)` получает батч `(64, 128)`.

    1. Какова форма выхода?
    2. Сколько параметров?
    3. Почему нельзя убрать активации между всеми слоями MLP?

<details>
<summary><b>Ответ</b></summary>

1. `(64, 32)`.
2. $128\cdot32+32=4128$.
3. Композиция линейных преобразований остаётся линейным преобразованием; глубина не добавит нелинейную выразительность.

</details>

## 2. Forward pass, backpropagation и autograd

### 2.1. Вычислительный граф

Обучающий шаг:

$$
X \xrightarrow{\text{model}} z
\xrightarrow{\text{loss}(z,y)} L
\xrightarrow{\text{backward}} \frac{\partial L}{\partial \theta}
\xrightarrow{\text{optimizer}} \theta_{\text{new}}.
$$

Backpropagation — эффективное применение правила цепочки от скалярного `loss` к каждому параметру:

$$
\frac{\partial L}{\partial w}
=
\frac{\partial L}{\partial z}
\frac{\partial z}{\partial w}.
$$

Для sigmoid + binary cross-entropy производная по logit упрощается:

$$
\frac{\partial L}{\partial z}=\sigma(z)-y.
$$

**Не путай:**

- `loss.backward()` вычисляет и накапливает `.grad`;
- `optimizer.step()` изменяет параметры;
- `optimizer.zero_grad()` очищает градиенты перед следующим батчем.

```python
# Один объект: x=[-1, 1], y=1
x = torch.tensor([-1.0, 1.0])
y = torch.tensor(1.0)
w = torch.tensor([-0.4, 0.2], requires_grad=True)
b = torch.tensor(0.0, requires_grad=True)

logit = x @ w + b
loss = nn.functional.binary_cross_entropy_with_logits(logit, y)
loss.backward()

print("logit:", round(logit.item(), 4))
print("p:", round(torch.sigmoid(logit).item(), 4))
print("loss:", round(loss.item(), 4))
print("dL/dw:", w.grad)
print("dL/db:", b.grad)
```

### 2.2. Как градиент проходит через ReLU

$$
\operatorname{ReLU}'(x)=
\begin{cases}
1,&x>0\\
0,&x<0
\end{cases}
$$

Если pre-activation отрицателен, локальный градиент равен нулю и сигнал назад через этот нейрон не проходит. Если нейрон почти всегда находится в отрицательной области, возникает **dying ReLU**. Возможные решения: корректная инициализация, меньший learning rate, `LeakyReLU`/`GELU`.

```python
values = torch.tensor([-2.0, 3.0], requires_grad=True)
result = torch.relu(values).sum()
result.backward()

print("ReLU output:", torch.relu(values).detach())
print("Gradient:", values.grad)  # [0, 1]
```

### 2.3. Градиенты на батче

Большинство loss-функций по умолчанию усредняют ошибку по батчу. Поэтому градиент параметра — средний вклад объектов, а не отдельный градиент одного клиента.

При нескольких вызовах `.backward()` PyTorch **складывает** градиенты. Это позволяет gradient accumulation, но становится ошибкой, если забыть `zero_grad()`.

#### Проверь себя

Почему веса не изменились после `loss.backward()`? Что произойдёт, если десять раз вызвать `backward()` без очистки `.grad`?

<details>
<summary><b>Ответ</b></summary>

`backward()` только вычисляет градиенты. Для изменения весов нужен `optimizer.step()`. Без очистки градиенты накопятся; эффективное обновление станет суммой вкладов десяти backward-проходов.

</details>

## 3. Выход модели и функции потерь

### 3.1. Главная таблица

| Задача | Выход модели | Target | Loss | Прогноз |
|---|---|---|---|---|
| Регрессия | `(B, 1)` или `(B,)` | `float` | MSE / MAE / Huber | raw output |
| Бинарная классификация | `(B,)` logits | `float` 0/1 | `BCEWithLogitsLoss` | `sigmoid(logit) ≥ threshold` |
| Multilabel | `(B, C)` logits | `float` 0/1 | `BCEWithLogitsLoss` | sigmoid по каждому классу |
| Multiclass | `(B, C)` logits | `long` class index `(B,)` | `CrossEntropyLoss` | `argmax(logits, dim=1)` |

`BCEWithLogitsLoss` объединяет sigmoid и BCE. `CrossEntropyLoss` объединяет `log_softmax` и negative log-likelihood. Не добавляй перед ними sigmoid/softmax.

```python
# Бинарная классификация
binary_logits = torch.tensor([1.2, -0.4, 0.1])
binary_targets = torch.tensor([1.0, 0.0, 1.0])
binary_loss = nn.BCEWithLogitsLoss()(binary_logits, binary_targets)

# Многоклассовая классификация: 3 объекта, 4 класса
multiclass_logits = torch.tensor([
    [2.0, 0.5, -1.0, 0.0],
    [0.2, 1.5, 0.1, -0.7],
    [-0.4, 0.2, 1.8, 0.3],
])
class_targets = torch.tensor([0, 1, 2], dtype=torch.long)
multiclass_loss = nn.CrossEntropyLoss()(multiclass_logits, class_targets)

print("Binary loss:", round(binary_loss.item(), 4))
print("Multiclass loss:", round(multiclass_loss.item(), 4))
print("Classes:", multiclass_logits.argmax(dim=1))
```

### 3.2. Logits, sigmoid и softmax

Logit — не вероятность: это неограниченный вещественный score.

$$
\sigma(z)=\frac{1}{1+e^{-z}}
$$

Для нескольких взаимоисключающих классов:

$$
\operatorname{softmax}(z_i)=
\frac{e^{z_i}}{\sum_j e^{z_j}}.
$$

Softmax не «нормализует эмбеддинги». Он превращает набор scores в распределение. Для единичной длины эмбеддинга используют L2-нормализацию.

Для правильного класса $y$ multiclass cross-entropy:

$$
L=-\log
\frac{e^{z_y}}{\sum_j e^{z_j}}.
$$

На практике используют `CrossEntropyLoss(logits, target)`, а не вычисляют экспоненты и логарифмы вручную: библиотека применяет численно устойчивую реализацию.

### 3.3. Loss-функции регрессии

$$
MSE=\frac1N\sum_i(y_i-\hat y_i)^2,
\qquad
MAE=\frac1N\sum_i|y_i-\hat y_i|.
$$

- MSE сильнее штрафует крупные ошибки и чувствительна к выбросам;
- MAE устойчивее к выбросам, но негладкая в нуле;
- Huber ведёт себя квадратично около нуля и линейно на крупных ошибках — компромисс.

### 3.4. Дисбаланс классов

В банковских задачах редкий класс часто важнее accuracy.

Инструменты:

- `pos_weight` в `BCEWithLogitsLoss` усиливает вклад положительного класса;
- `weight` в `CrossEntropyLoss` задаёт веса классов;
- threshold подбирают на validation, а не на test;
- метрики выбирают по бизнес-ошибкам: precision, recall, F1, PR-AUC.

Вес класса меняет функцию обучения, а threshold — только финальное решение по уже обученным scores.

#### Проверь себя

У классификатора банковских обращений 12 взаимоисключающих классов. Модель вернула `(32, 12)`.

- Какая должна быть форма и тип target?
- Нужно ли применять softmax до `CrossEntropyLoss`?
- Что используется при инференсе?

<details>
<summary><b>Ответ</b></summary>

Target имеет форму `(32,)`, тип `torch.long`, значения от 0 до 11. Softmax до `CrossEntropyLoss` не нужен. Для класса достаточно `argmax` по logits; softmax нужен, если необходимо показать вероятности.

</details>

## 4. Оптимизация: SGD, Momentum, Adam и AdamW

### 4.1. Виды градиентного спуска

- **Batch GD:** один шаг по всему датасету — точно, но дорого.
- **SGD:** один объект — шумно, но часто.
- **Mini-batch SGD:** компромисс и стандарт на практике.

Базовое обновление:

$$
\theta_{t+1}=\theta_t-\eta\nabla_\theta L.
$$

`learning rate` $\eta$ задаёт масштаб шага. Слишком большой — расходимость/колебания, слишком маленький — медленное обучение.

### 4.2. Momentum

Momentum накапливает сглаженное направление:

$$
v_t=\beta v_{t-1}+(1-\beta)g_t,\qquad
\theta_{t+1}=\theta_t-\eta v_t.
$$

Он ускоряет движение в устойчивом направлении и уменьшает колебания.

### 4.3. Adam

Adam хранит экспоненциальные средние первого и второго моментов градиента:

$$
m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,
\quad
v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2.
$$

После bias correction обновление масштабируется примерно как

$$
\frac{\hat m_t}{\sqrt{\hat v_t}+\varepsilon}.
$$

Это адаптирует шаг для разных параметров.

### 4.4. AdamW и weight decay

В AdamW уменьшение весов отделено от адаптивного градиентного шага:

$$
\theta \leftarrow (1-\eta\lambda)\theta-\eta\cdot \text{AdamStep}.
$$

Поэтому `weight_decay` в AdamW нельзя без оговорок называть обычной L2-регуляризацией внутри loss.

```python
tiny_model = nn.Linear(5, 1)

sgd = torch.optim.SGD(
    tiny_model.parameters(),
    lr=1e-2,
    momentum=0.9,
)

adamw = torch.optim.AdamW(
    tiny_model.parameters(),
    lr=3e-4,
    weight_decay=1e-2,
)

print(sgd)
print(adamw)
```

### 4.5. Scheduler, warmup и early stopping

Это три разные задачи:

- scheduler меняет learning rate;
- warmup постепенно повышает learning rate в начале и стабилизирует большие модели;
- early stopping прекращает обучение, когда validation metric больше не улучшается.

Для Transformer типичен `linear warmup + cosine decay`. Для маленькой табличной сети иногда удобен `ReduceLROnPlateau`.

**Правило:** scheduler должен успеть сработать раньше early stopping. Иначе модель остановится, не попробовав меньший шаг.

#### Проверь себя

Чем AdamW отличается от Adam с L2-штрафом? Зачем Transformer warmup, если дальше learning rate всё равно уменьшается?

<details>
<summary><b>Ответ</b></summary>

AdamW применяет decay непосредственно к весам отдельно от адаптивного обновления; L2-штраф добавляет производную штрафа к градиенту, который затем адаптивно масштабируется Adam. Warmup защищает случайно инициализированную модель от слишком резких первых обновлений и позволяет безопасно выйти на рабочий learning rate.

</details>

Вернуться: [[10 Знания/ML/02 Deep Learning/04 Теория/00 - Карта теории]].
