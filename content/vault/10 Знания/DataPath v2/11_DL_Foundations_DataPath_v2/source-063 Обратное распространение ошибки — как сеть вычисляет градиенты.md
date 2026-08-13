---
title: "Обратное распространение ошибки — как сеть вычисляет градиенты"
id: concept.datapath-v2.063
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 63
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Обратное распространение ошибки: как сеть вычисляет градиенты

После forward pass сеть получает prediction и loss.

Теперь нужно ответить на главный вопрос обучения:

> **Как понять, какой weight и насколько изменить, чтобы loss уменьшилась?**

Для одного параметра можно взять производную вручную.

Для сети с миллионами parameters это невозможно делать вручную на каждом шаге.

Решение — **обратное распространение ошибки (backpropagation)**.

Backpropagation не является отдельным optimizer. Он вычисляет gradients.

Optimizer затем использует эти gradients, чтобы обновить weights.

Это принципиальное разделение:

```text
backpropagation
→ вычисляет ∂loss/∂parameter

optimizer
→ решает, как именно изменить parameter
```

---

## 1. Начнём с одного простого вычисления

Пусть:

\[
x=2,\qquad
w=3.
\]

Prediction:

\[
\hat y=wx=6.
\]

Target:

\[
y=10.
\]

Возьмём squared loss:

\[
L=(\hat y-y)^2.
\]

Тогда:

\[
L=(6-10)^2=16.
\]

Хотим:

\[
\frac{\partial L}{\partial w}.
\]

---

## 2. Chain rule руками

Loss зависит от \(w\) не напрямую:

```text
w
→ ŷ
→ L
```

По правилу цепочки:

\[
\frac{\partial L}{\partial w}
=
\frac{\partial L}{\partial \hat y}
\cdot
\frac{\partial \hat y}{\partial w}.
\]

Первое:

\[
\frac{\partial L}{\partial \hat y}
=
2(\hat y-y)
=
2(6-10)
=
-8.
\]

Второе:

\[
\frac{\partial \hat y}{\partial w}
=x=2.
\]

Значит:

\[
\frac{\partial L}{\partial w}
=
-8\cdot2
=
-16.
\]

Отрицательный gradient означает: чтобы уменьшить loss, gradient descent увеличит \(w\).

---

## 3. Почему движение идёт против gradient

Gradient показывает направление **роста** функции.

Поэтому update:

\[
w_{new}
=
w-\eta\frac{\partial L}{\partial w}.
\]

Если:

```text
w = 3
gradient = -16
learning_rate = 0.01
```

то:

\[
w_{new}
=
3-0.01(-16)
=
3.16.
\]

Prediction увеличится:

\[
3.16\cdot2=6.32,
\]

то есть приблизится к target 10.

---

## 4. Backpropagation — эффективное применение chain rule

Представим сеть:

\[
x
\rightarrow
z_1
\rightarrow
a_1
\rightarrow
z_2
\rightarrow
L.
\]

Чтобы получить gradient early weight, chain rule может выглядеть:

\[
\frac{\partial L}{\partial w_1}
=
\frac{\partial L}{\partial z_2}
\frac{\partial z_2}{\partial a_1}
\frac{\partial a_1}{\partial z_1}
\frac{\partial z_1}{\partial w_1}.
\]

Backprop проходит graph в обратном направлении и переиспользует уже вычисленные intermediate derivatives.

Именно это делает вычисление gradients глубоких networks практичным.

---

## 5. Computational graph

PyTorch `autograd` строит **вычислительный граф (computational graph)** из выполненных tensor operations.

Например:

```python
x = torch.tensor(2.0)
w = torch.tensor(3.0, requires_grad=True)

pred = x * w
loss = (pred - 10) ** 2
```

Graph conceptual:

```text
x ----\
       multiply → pred → subtract → square → loss
w ----/                    ^
                            |
                           10
```

PyTorch знает local derivative каждой operation.

---

![Учебная иллюстрация: Backpropagation. Прямые значения идут слева направо, градиенты по chain rule — справа налево.](content-assets/datapath-v2/figures/63_backpropagation.png "Прямые значения идут слева направо, градиенты по chain rule — справа налево.")

## 6. `requires_grad=True`

Если tensor parameter должен получать gradients:

```python
w = torch.tensor(
    3.0,
    requires_grad=True,
)
```

PyTorch отслеживает operations, связанные с этим tensor.

Parameters внутри `nn.Module` обычно уже имеют gradient tracking.

---

## 7. `loss.backward()`

```python
loss.backward()
```

запускает backward pass от scalar loss.

После этого:

```python
w.grad
```

содержит:

\[
\frac{\partial L}{\partial w}.
\]

В нашем примере expected gradient около:

```text
-16
```

---

## 8. Маленький пример PyTorch

```python
import torch

x = torch.tensor(2.0)
w = torch.tensor(3.0, requires_grad=True)

pred = x * w
loss = (pred - 10.0) ** 2

loss.backward()

print(w.grad)
```

PyTorch делает ту же chain rule, которую мы только что посчитали руками.

---

## 9. Почему loss обычно scalar

`backward()` особенно естественно использовать для scalar objective.

Batch loss часто сначала агрегируется:

```text
per-object losses
→ mean
→ one scalar
```

От scalar можно получить gradient по всем parameters.

Для non-scalar tensor PyTorch работает через vector-Jacobian products, но начинающему важно сначала уверенно понимать scalar loss case.

---

## 10. Gradients накапливаются

Очень важная особенность PyTorch:

> `.backward()` **добавляет** gradient в `.grad`, а не автоматически заменяет его.

Пример:

```python
loss.backward()
loss.backward()
```

без очистки может удвоить accumulated gradient.

Поэтому training loop обычно содержит:

```python
optimizer.zero_grad()
```

перед новым backward.

---

## 11. Почему PyTorch накапливает gradients специально

Accumulation полезна, например, для **gradient accumulation**.

Если GPU не вмещает batch 256, можно обработать 4 mini-batches по 64 и суммировать gradients перед одним optimizer step.

То есть accumulation — feature, а не ошибка framework.

Но в обычном loop её нужно контролировать явно.

---

## 12. Полный training step

Классический порядок:

```python
optimizer.zero_grad()

logits = model(x)
loss = loss_fn(logits, y)

loss.backward()

optimizer.step()
```

Каждая строка имеет отдельную роль.

### `zero_grad`

Очистить gradients прошлого шага.

### Forward

Посчитать predictions.

### Loss

Получить scalar error.

### `backward`

Вычислить gradients.

### `step`

Optimizer обновляет parameters.

---

## 13. Что делает `optimizer.step()`

`optimizer.step()` **не вычисляет gradients**.

Он читает уже существующие:

```text
parameter.grad
```

и применяет update rule конкретного optimizer.

Для SGD roughly:

\[
w\leftarrow w-\eta g.
\]

Для Adam update сложнее.

---

## 14. Forward graph создаётся динамически

PyTorch autograd — dynamic.

Graph строится из operations, реально выполненных в текущем forward.

Можно писать обычный Python control flow:

```python
if condition:
    ...
else:
    ...
```

и graph будет соответствовать пройденному path.

После обычного backward graph обычно освобождается, а на следующем forward строится новый.

---

## 15. `grad_fn`

Intermediate tensor, созданный tracked operation, обычно имеет:

```python
tensor.grad_fn
```

Это ссылка на backward function, которая знает local derivative operation.

User-created leaf parameter обычно:

```text
grad_fn = None
requires_grad = True
```

но получает `.grad`.

---

## 16. Leaf tensors

Gradients по умолчанию сохраняются в `.grad` прежде всего для leaf tensors с `requires_grad=True`.

Intermediate activations нужны для chain rule, но их `.grad` обычно не сохраняется автоматически.

Это важное distinction при debugging autograd.

---

## 17. `torch.no_grad()`

На inference gradients не нужны.

```python
with torch.no_grad():
    pred = model(x)
```

Это отключает gradient tracking внутри block.

Плюсы:

- меньше memory;
- меньше overhead.

Но сегодня для pure inference также существует `torch.inference_mode()`, который может быть ещё более строгим/эффективным режимом.

В учебном начале достаточно понимать `no_grad`.

---

## 18. `detach()`

```python
z_detached = z.detach()
```

возвращает tensor, отделённый от текущего autograd graph.

Используется, когда значение нужно как data, но gradient через эту branch проводить не надо.

Например logging:

```python
loss.item()
```

или сохранение representation без продолжения graph.

---

## 19. Почему нельзя делать `.numpy()` на tracked CUDA tensor напрямую

Tensor может:

- находиться не на CPU;
- требовать gradients.

Типичный безопасный pattern:

```python
x.detach().cpu().numpy()
```

Но `.numpy(force=True)` и другие API details могут меняться; conceptual rule важнее:

> при выводе из autograd/device world нужно осознанно detach и перенести data туда, где ожидает внешняя библиотека.

---

## 20. Backprop через ReLU

ReLU:

\[
a=\max(0,z).
\]

Derivative:

\[
\frac{da}{dz}
=
\begin{cases}
0,&z<0\\
1,&z>0
\end{cases}
\]

Если neuron inactive:

```text
z < 0
```

gradient назад через эту ReLU branch становится 0.

Так math activation напрямую влияет на gradient flow.

---

## 21. Backprop через sigmoid

Sigmoid:

\[
\sigma(z)=\frac1{1+e^{-z}}.
\]

Derivative:

\[
\sigma'(z)
=
\sigma(z)(1-\sigma(z)).
\]

На больших \(|z|\) sigmoid близка к 0 или 1, derivative становится маленькой.

В глубокой сети произведение многих маленьких derivatives может привести к **затухающим градиентам (vanishing gradients)**.

---

## 22. Vanishing gradients

Chain rule умножает derivatives.

Например:

\[
0.1\times0.1\times0.1\times0.1
=
0.0001.
\]

Early layers получают почти нулевой signal.

Они обучаются очень медленно.

Это одна из причин, почему activation, initialization, normalization и residual connections важны.

---

## 23. Exploding gradients

Если derivatives/weights дают factors больше 1:

\[
3\times3\times3\times3=81.
\]

Gradient может расти.

Симптомы:

- loss становится `nan`;
- weights резко растут;
- training unstable.

В recurrent networks часто применяют gradient clipping, но проблема может встречаться и шире.

---

## 24. Gradient clipping

Например:

```python
torch.nn.utils.clip_grad_norm_(
    model.parameters(),
    max_norm=1.0,
)
```

обычно вызывается после `backward()` и до `optimizer.step()`.

Clipping не «чинит» любую плохую architecture. Это механизм ограничения слишком больших gradient norms.

---

## 25. Gradient check mental model

Если реализуем custom operation вручную, gradient можно проверить finite differences.

Для parameter \(w\):

\[
\frac{dL}{dw}
\approx
\frac{L(w+\epsilon)-L(w-\epsilon)}
{2\epsilon}.
\]

Сравниваем numerical derivative с autograd gradient.

Это полезная debugging idea, хотя обычные PyTorch layers уже проверены library authors.

---

## 26. Почему нельзя делать in-place operations бездумно

Autograd иногда сохраняет intermediate tensors для backward.

Если in-place operation изменит нужное значение, gradient calculation может стать impossible или вызвать error.

Например:

```python
x += ...
```

на graph-critical tensor требует осторожности.

Не надо бояться всех in-place operations, но важно понимать, что forward values могут быть нужны backward pass.

---

## 27. Backprop на batch

Для batch loss:

\[
L=\frac1B\sum_{i=1}^{B}L_i.
\]

Gradient:

\[
\nabla L
=
\frac1B
\sum_i
\nabla L_i.
\]

То есть gradient mini-batch — усреднённый training signal samples.

Это объясняет, почему batch composition влияет на noise gradient.

---

## 28. Computational graph визуально

Для MLP:

```text
X
↓
Linear W1,b1
↓
z1
↓
ReLU
↓
a1
↓
Linear W2,b2
↓
logits
↓
CrossEntropy
↓
loss
```

Backward:

```text
loss
↑
logits gradient
↑
W2,b2
↑
ReLU derivative
↑
W1,b1
```

Data flows forward; gradient information flows backward.

---

## 29. Интерактивная визуализация DataPath

### Режим 1. Chain rule

Graph:

```text
w → multiply → prediction → squared error → loss
```

Пользователь нажимает:

```text
Backward step
```

и derivatives подсвечиваются справа налево.

### Режим 2. ReLU gate

Slider \(z\).

При negative z gradient backward блокируется.

### Режим 3. Deep chain

Пользователь меняет local derivatives:

```text
0.1
0.5
1.0
2.0
```

и видит vanishing/exploding gradient.

### Режим 4. PyTorch loop

Визуально связать:

```text
zero_grad
forward
loss
backward
step
```

с состоянием parameters/gradients.

---

## 30. Типичные ошибки

**«Backprop обновляет weights».**\
Нет, он вычисляет gradients.

**«optimizer.step() вычисляет gradients».**\
Нет.

**«zero_grad можно не делать, PyTorch сам заменит grad».**\
Нет, gradients accumulate.

**«Gradient течёт только через Linear».**\
Он проходит через все differentiable operations graph.

**«`no_grad()` нужен training».**\
Наоборот, обычно inference.

**«Vanishing gradient = loss маленькая».**\
Нет, это маленький derivative signal в части network.

---

## 31. Проверка понимания

1. Что вычисляет backpropagation?
2. Что делает optimizer?
3. Почему нужен chain rule?
4. Почему `.grad` накапливается?
5. Правильный порядок training step?
6. Что такое computational graph?
7. Что делает `requires_grad=True`?
8. Почему sigmoid может давать vanishing gradients?
9. Что делает gradient clipping?
10. Зачем `torch.no_grad()`?

---

## 32. Мини-практика руками

\[
x=3,\quad
w=2,\quad
b=1,\quad
y=10.
\]

\[
\hat y=wx+b,
\]

\[
L=(\hat y-y)^2.
\]

Посчитайте:

1. prediction;
2. loss;
3. \(\partial L/\partial\hat y\);
4. \(\partial\hat y/\partial w\);
5. \(\partial L/\partial w\);
6. новый \(w\) при `lr=0.01`.

---

## 33. PyTorch debug checklist

Если model не учится:

```text
проверить loss decreases?
проверить gradients None?
проверить gradient norms?
проверить requires_grad?
проверить optimizer содержит нужные parameters?
проверить zero_grad/backward/step order?
проверить no_grad случайно не окружает training?
```

Эти проверки часто полезнее мгновенной смены optimizer.

---

## Что нужно унести

1. Backpropagation вычисляет gradients loss по parameters.
2. Chain rule связывает local derivatives.
3. PyTorch `autograd` строит dynamic computational graph.
4. `loss.backward()` запускает backward pass.
5. Gradients сохраняются в `.grad` parameters и накапливаются.
6. `optimizer.zero_grad()` очищает прошлый gradient.
7. `optimizer.step()` обновляет parameters.
8. ReLU/sigmoid влияют на gradient flow.
9. Глубокие chains могут давать vanishing/exploding gradients.
10. `no_grad` используется, когда gradients не нужны.

## Куда дальше

Теперь gradients вычислены.

Но всё ещё не решено:

> **как именно использовать gradient для update?**

Простейший ответ — SGD. Затем добавим Momentum и adaptive methods Adam/AdamW.

## Источники
- PyTorch official `torch.autograd` tutorials.
- PyTorch automatic differentiation documentation.
