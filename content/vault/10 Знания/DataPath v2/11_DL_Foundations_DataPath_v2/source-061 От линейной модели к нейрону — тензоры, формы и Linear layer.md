---
title: "От линейной модели к нейрону — тензоры, формы и Linear layer"
id: concept.datapath-v2.061
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 61
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# От линейной модели к нейрону: тензоры, формы и `Linear`

Первый нейрон в нейронной сети почти не отличается от уже знакомой линейной модели.

Линейная регрессия:

\[
\hat y=w_1x_1+w_2x_2+\dots+w_dx_d+b.
\]

Нейрон начинает с той же операции:

\[
z=w^Tx+b.
\]

Разница появляется позже — когда поверх линейного значения добавляется нелинейная функция активации и множество таких блоков соединяются в сеть.

Поэтому Deep Learning лучше начинать не с «искусственного мозга», а с хорошо знакомого объекта:

> **линейное преобразование тензора.**

---

## 1. Что такое тензор

В PyTorch основная структура данных — `torch.Tensor`.

Можно мыслить по размерности:

```text
скаляр       → 0D tensor
вектор       → 1D tensor
матрица      → 2D tensor
batch images → 4D tensor
```

Пример:

```python
import torch

x = torch.tensor([
    [1.0, 2.0, 3.0],
    [4.0, 5.0, 6.0],
])
```

Форма:

```python
x.shape
# torch.Size([2, 3])
```

Это означает:

```text
2 объекта
3 признака на объект
```

---

## 2. Shape — язык Deep Learning

Очень многие ошибки в DL — не «математические», а ошибки формы.

Если:

```text
X.shape = [32, 10]
```

то обычно:

```text
32 → batch size
10 → число входных признаков
```

Если слой:

```python
nn.Linear(10, 4)
```

он ожидает, что последняя dimension равна 10, и преобразует её в 4.

Получим:

```text
[32, 10]
→ Linear(10, 4)
→ [32, 4]
```

Batch dimension сохраняется.

---

## 3. Что делает `nn.Linear`

В официальной PyTorch документации `nn.Linear` реализует аффинное преобразование:

\[
y=xA^T+b.
\]

В привычной записи для одного объекта:

\[
y=Wx+b.
\]

Если:

```python
layer = nn.Linear(10, 4)
```

то:

```text
in_features  = 10
out_features = 4
```

Матрица весов имеет shape:

```text
[4, 10]
```

а bias:

```text
[4]
```

Каждый из 4 выходных нейронов имеет собственные 10 weights и bias.

---

## 4. Один нейрон руками

Пусть:

\[
x=
\begin{bmatrix}
2\\
3
\end{bmatrix},
\qquad
w=
\begin{bmatrix}
0.5\\
-1
\end{bmatrix},
\qquad
b=2.
\]

Тогда:

\[
z=0.5\cdot2+(-1)\cdot3+2=0.
\]

Это ещё не «сложная нейросеть». Обычная линейная комбинация.

---

![Учебная иллюстрация: Один нейрон. Входы, веса, bias, линейная сумма z и ReLU output на числовом примере.](content-assets/datapath-v2/figures/61_neuron.png "Входы, веса, bias, линейная сумма z и ReLU output на числовом примере.")

## 5. Несколько нейронов одновременно

Пусть вход:

\[
x\in\mathbb R^3
\]

и хотим 2 output neurons.

Тогда:

\[
W\in\mathbb R^{2\times3},
\qquad
b\in\mathbb R^2.
\]

Например:

\[
W=
\begin{bmatrix}
1&0&-1\\
0.5&2&1
\end{bmatrix}.
\]

Один matrix multiplication сразу считает оба neurons.

Именно поэтому deep learning libraries работают с матрицами/tensors, а не Python-loop по нейронам.

---

## 6. Batch computation

Если batch содержит 32 objects:

\[
X\in\mathbb R^{32\times3}.
\]

Тогда:

\[
Y=XW^T+b.
\]

Shape:

```text
[32, 3]
×
[3, 2]
→
[32, 2]
```

Bias shape `[2]` автоматически добавляется ко всем 32 строкам через broadcasting.

Это один из главных patterns DL.

---

## 7. Почему tensors быстрее циклов Python

PyTorch операции вроде matrix multiplication реализованы в оптимизированных kernels для CPU/GPU.

Плохо:

```python
for sample in batch:
    for neuron in neurons:
        ...
```

Лучше:

```python
y = layer(x)
```

Внутри выполняются vectorized tensor operations.

GPU особенно эффективен, когда выполняет много однотипных arithmetic operations параллельно.

---

## 8. Device

Tensor находится на конкретном устройстве.

Частые варианты:

```text
cpu
cuda
mps
```

На Mac с Apple Silicon PyTorch может использовать backend `mps` для поддерживаемых операций.

Критическое правило:

> model и input tensors должны находиться на совместимом device.

Пример:

```python
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

model = model.to(device)
x = x.to(device)
```

---

## 9. Dtype

Для neural nets чаще всего weights/input используют floating types.

Например:

```python
torch.float32
```

Target classification часто должен быть integer class indices:

```python
torch.long
```

например для `CrossEntropyLoss`.

Ошибка dtype может быть столь же важна, как shape mismatch.

---

## 10. `nn.Module`

В PyTorch model обычно наследуется от `nn.Module`.

```python
import torch.nn as nn

class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(3, 1)

    def forward(self, x):
        return self.linear(x)
```

`__init__` создаёт слои с learnable parameters.

`forward()` описывает вычисления.

Вызов:

```python
y = model(x)
```

внутри приводит к `forward`.

Обычно не вызывают:

```python
model.forward(x)
```

напрямую, потому что `Module.__call__` управляет дополнительной инфраструктурой hooks и framework behavior.

---

## 11. Что такое parameters

После:

```python
layer = nn.Linear(3, 2)
```

weights и biases — объекты `nn.Parameter`.

```python
for name, p in layer.named_parameters():
    print(name, p.shape)
```

Получим примерно:

```text
weight [2, 3]
bias   [2]
```

Это tensors, которые optimizer позже будет обновлять.

---

## 12. Почему `Linear` без активации не создаёт глубокую нелинейность

Допустим:

\[
h=W_1x+b_1,
\]

\[
y=W_2h+b_2.
\]

Подставим:

\[
y=W_2(W_1x+b_1)+b_2.
\]

Раскроем:

\[
y=(W_2W_1)x+(W_2b_1+b_2).
\]

Это снова одно линейное/аффинное преобразование.

Поэтому:

```text
Linear
→ Linear
→ Linear
```

без nonlinear activation не даёт принципиально более сложную функцию.

Это главная мотивация следующего урока.

---

## 13. Число параметров

`Linear(in_features=d, out_features=h)` имеет:

\[
d\cdot h+h
\]

learnable parameters, если bias включён.

Например:

```text
Linear(100, 64)
```

имеет:

\[
100\cdot64+64=6464.
\]

Умение быстро считать parameters помогает понимать memory и model size.

---

## 14. Маленький PyTorch пример

```python
import torch
import torch.nn as nn

x = torch.randn(32, 10)

layer = nn.Linear(
    in_features=10,
    out_features=4,
)

y = layer(x)

print(x.shape)  # [32, 10]
print(y.shape)  # [32, 4]
```

Под капотом концептуально:

```text
X @ W.T + b
```

---

## 15. Что означает output neuron

Сам `Linear` не знает semantics output.

`Linear(10, 1)` может выдавать:

- regression prediction;
- logit binary classifier;
- hidden representation.

`Linear(10, 5)` может быть:

- hidden layer из 5 neurons;
- 5 logits multiclass classifier.

Смысл задают:

- architecture;
- loss;
- target.

---

## 16. Logit

**Логит (logit)** — ненормализованный числовой score model до probability transform.

Для binary classification:

```text
large positive logit → higher probability class 1
large negative       → lower
```

Для multiclass:

```text
C logits
```

затем softmax conceptually превращает их в class probabilities.

Очень важное правило PyTorch:

> `CrossEntropyLoss` ожидает **сырые logits**, поэтому вручную добавлять `Softmax` перед ней обычно не нужно.

Подробно это будет в следующем уроке.

---

## 17. Интерактивная визуализация

### Режим 1. Shape transformer

Пользователь задаёт:

```text
batch = 8
in_features = 3
out_features = 4
```

Показывать shapes:

```text
X: [8,3]
W: [4,3]
b: [4]
Y: [8,4]
```

### Режим 2. Один neuron

Sliders weights/bias.

Показывать:

\[
z=w_1x_1+w_2x_2+b.
\]

### Режим 3. Два Linear подряд

Показать algebraic collapse в один Linear, если нет activation.

---

## 18. Типичные ошибки

**«Neuron — это уже nonlinear model».**\
Нет, до activation это linear/affine transform.

**«Первый dimension всегда features».**\
В обычном batch layout `[batch, features]` наоборот.

**«`Linear(10,4)` хранит weights [10,4]».**\
В PyTorch parameter `weight` имеет shape `[out_features, in_features]`.

**«Softmax обязательно вставлять в model перед CrossEntropyLoss».**\
Обычно нет.

**«Model и input могут быть на разных devices».**\
Нет.

---

## 19. Проверка понимания

1. Что делает `nn.Linear`?
2. Shape weight для `Linear(10,4)`?
3. Что произойдёт с `[32,10]`?
4. Зачем bias?
5. Почему два Linear без activation сворачиваются в один?
6. Что такое batch?
7. Что такое logit?
8. Чем parameter отличается от hyperparameter?
9. Почему tensor operations предпочтительнее Python loops?
10. Что должно совпадать по device?

---

## 20. Мини-практика

Architecture:

```text
input: [64, 20]
Linear(20, 16)
Linear(16, 4)
```

Ответьте:

1. shapes после слоёв;
2. число parameters первого;
3. второго;
4. почему без activation вся model эквивалентна одному affine transform;
5. что добавить, чтобы model стала nonlinear.

---

## Что нужно унести

1. Нейрон начинается с знакомого `Wx+b`.
2. Tensor shape — фундамент DL.
3. `nn.Linear` преобразует последнюю feature dimension.
4. Weights имеют `[out, in]`.
5. Batch позволяет vectorized computation.
6. `nn.Module` хранит layers/parameters и описывает `forward`.
7. Logits — raw scores.
8. Несколько Linear без activation не дают nonlinear power.
9. Следующий ключ — функции активации.

## Куда дальше

Следующий урок добавит то, чего сейчас не хватает:

> **нелинейность.**

Из `Linear → activation → Linear` появляется многослойный перцептрон (MLP), способный моделировать функции, которые одна гиперплоскость выразить не может.

## Источники
- PyTorch official documentation — `nn.Linear`, `nn.Module`.
- PyTorch Tutorials — tensors and building models.
