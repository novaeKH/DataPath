---
title: "MLP, функции активации и функции потерь"
id: concept.datapath-v2.062
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 62
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Многослойный перцептрон: зачем сети нелинейность и loss

Мы уже умеем считать:

\[
z=Wx+b.
\]

Но несколько Linear-слоёв подряд без нелинейности эквивалентны одному Linear.

Чтобы сеть могла изгибать decision boundary и строить сложные функции, между слоями добавляют **функции активации (activation functions)**.

Получается:

```text
input
→ Linear
→ activation
→ Linear
→ activation
→ ...
→ output
```

Такой fully-connected network называют **многослойным перцептроном (Multilayer Perceptron, MLP)**.

---

## 1. Самый маленький MLP

```python
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(2, 16),
    nn.ReLU(),
    nn.Linear(16, 16),
    nn.ReLU(),
    nn.Linear(16, 1),
)
```

Shape:

```text
[batch,2]
→ [batch,16]
→ [batch,16]
→ [batch,1]
```

Каждый hidden neuron вычисляет свою линейную комбинацию, затем activation меняет её нелинейно.

---

## 2. Почему ReLU

ReLU:

\[
ReLU(x)=\max(0,x).
\]

То есть:

```text
x < 0 → 0
x > 0 → x
```

PyTorch:

```python
nn.ReLU()
```

ReLU проста и не насыщается на положительной полуоси, поэтому стала стандартной базовой activation для многих architectures.

---

## 3. Как ReLU создаёт нелинейность

Пусть:

\[
h=ReLU(Wx+b).
\]

Теперь нельзя просто объединить два Linear multiplication в одну matrix.

ReLU меняет formula в зависимости от sign каждого hidden pre-activation.

Каждый neuron создаёт своего рода «излом» пространства.

Много ReLU neurons → piecewise-linear сложная function.

---

![Учебная иллюстрация: MLP и активации. Путь 2→3→1 с hidden activations, logit и sigmoid probability.](content-assets/datapath-v2/figures/62_mlp.png "Путь 2→3→1 с hidden activations, logit и sigmoid probability.")

## 4. XOR как мотивация

Классическая задача:

```text
(0,0) → 0
(0,1) → 1
(1,0) → 1
(1,1) → 0
```

Одной прямой нельзя разделить classes.

Линейный classifier не решает XOR.

MLP с hidden layer может создать промежуточное representation, где задача становится separable.

Это короткий, но важный пример:

> hidden layers нужны не потому, что «глубина модная», а потому что representation может становиться полезнее для следующего слоя.

---

## 5. Другие activation functions

### Sigmoid

\[
\sigma(x)=\frac{1}{1+e^{-x}}.
\]

Range:

```text
0..1
```

Полезна как output transform для binary probability, но в hidden layers сегодня часто уступает ReLU-family из-за saturation/gradient issues.

### Tanh

Range:

```text
-1..1
```

Центрирована около 0, но тоже насыщается на больших absolute inputs.

### Leaky ReLU

Для negative x сохраняет небольшой slope вместо полного нуля.

Помогает уменьшить проблему permanently inactive ReLU neurons.

### GELU

Часто используется в Transformer architectures; будет подробно позже.

---

## 6. «Мёртвые» ReLU

Если neuron постоянно получает:

```text
z < 0
```

то:

```text
ReLU(z)=0
```

и derivative на этой области 0.

Если updates загнали neuron в режим, где все relevant inputs дают negative pre-activation, он может перестать обучаться.

Это **dying ReLU**.

Причины могут включать:

- слишком большой learning rate;
- неудачную initialization;
- distribution activations.

---

## 7. Output layer зависит от задачи

### Регрессия

Часто:

```text
last Linear → raw numeric output
```

без ReLU, если target может быть любым real number.

### Binary classification

Часто model выдаёт один raw logit.

Для training можно использовать `BCEWithLogitsLoss`, которая numerically stable объединяет sigmoid + binary cross entropy.

### Multiclass classification

Model выдаёт:

```text
C logits
```

и `CrossEntropyLoss`.

---

## 8. CrossEntropyLoss и logits

Официальная PyTorch документация прямо указывает:

> `CrossEntropyLoss` ожидает **unnormalized logits**.

То есть:

```python
model = nn.Linear(hidden, num_classes)
loss_fn = nn.CrossEntropyLoss()

logits = model(x)
loss = loss_fn(logits, y)
```

Не нужно:

```python
softmax = nn.Softmax(dim=1)
proba = softmax(logits)
loss = loss_fn(proba, y)
```

перед `CrossEntropyLoss`.

Внутренне loss сочетает нужный log-softmax/NLL calculation более устойчиво.

---

## 9. Shape для CrossEntropyLoss

Типичный multiclass case:

```text
logits shape: [batch, C]
target shape: [batch]
```

Target содержит class indices:

```text
0,1,...,C-1
```

и обычно dtype:

```python
torch.long
```

Например:

```python
logits = torch.randn(32, 5)
target = torch.randint(0, 5, (32,))
```

---

## 10. Почему loss нужна вообще

Model выдаёт prediction.

Но optimizer должен знать:

> насколько prediction плох и в какую сторону менять parameters?

Для regression:

\[
MSE=\frac1n\sum(y-\hat y)^2.
\]

Для classification:

```text
cross entropy
```

Loss превращает quality одного batch в scalar objective, от которой затем считаются gradients.

---

## 11. Loss и metric не одно и то же

Classifier можно training по:

```text
CrossEntropyLoss
```

а report:

```text
accuracy
precision
recall
F1
ROC-AUC
```

Loss нужна differentiable optimization.

Metric нужна для оценки задачи.

---

## 12. Hidden width

```python
nn.Linear(20, 16)
```

16 — размер hidden representation.

Больше hidden units:

```text
capacity ↑
parameters ↑
compute ↑
overfit risk ↑
```

Меньше:

```text
bottleneck
capacity ↓
```

Width — hyperparameter, а не automatically «чем больше, тем лучше».

---

## 13. Depth

Больше layers даёт возможность строить hierarchical compositions.

Но:

- optimization сложнее;
- gradients могут быть unstable;
- memory/compute выше.

Для маленьких tabular tasks глубокий MLP не обязательно выигрывает у 2–3 hidden layers.

---

## 14. Число parameters MLP

Architecture:

```text
2 → 16 → 16 → 1
```

Первый Linear:

\[
2\cdot16+16=48.
\]

Второй:

\[
16\cdot16+16=272.
\]

Третий:

\[
16\cdot1+1=17.
\]

Итого:

\[
337.
\]

Activations не имеют learnable parameters.

---

## 15. Forward pass

```python
x = torch.randn(32, 2)
logits = model(x)
```

Что происходит:

```text
matrix multiplication
→ bias
→ ReLU
→ matrix multiplication
→ ReLU
→ final linear
```

Это **прямой проход (forward pass)**.

На этом этапе network ещё ничего не «исправляет». Она только вычисляет output текущих parameters.

---

## 16. Training cycle пока без деталей backprop

```text
batch
→ forward
→ loss
→ backward
→ optimizer step
```

Следующий урок полностью разберёт `backward`.

---

## 17. `nn.Sequential`

Для простой линейной цепочки удобно:

```python
model = nn.Sequential(
    nn.Linear(10, 32),
    nn.ReLU(),
    nn.Linear(32, 3),
)
```

Но сложные networks с residual branches, multiple inputs или attention обычно оформляют custom `nn.Module`.

`Sequential` — удобство, не фундаментальное ограничение PyTorch.

---

## 18. Почему не все layers имеют activation после себя

Output layer зависит от semantics.

Multiclass:

```text
Linear → logits → CrossEntropyLoss
```

Если вставить ReLU перед CrossEntropy, logits не смогут быть negative, что бессмысленно ограничит score space.

Activation hidden layer и transformation output — разные решения.

---

## 19. Маленький binary model

```python
class BinaryMLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(2, 16),
            nn.ReLU(),
            nn.Linear(16, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)
```

Loss:

```python
loss_fn = nn.BCEWithLogitsLoss()
```

Probability для inference:

```python
proba = torch.sigmoid(logits)
```

Но sigmoid не нужно вставлять перед `BCEWithLogitsLoss`.

---

## 20. Multiclass model

```python
model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Linear(64, 5),
)

loss_fn = nn.CrossEntropyLoss()
```

Output:

```text
[batch,5] logits
```

Target:

```text
[batch] class indices
```

---

## 21. Интерактивная визуализация

### Режим 1. XOR

Показать 4 points.

Сначала одну linear boundary → невозможно.

Затем hidden layer → representation перестраивается → classes становятся separable.

### Режим 2. Activation

Пользователь переключает:

```text
none
ReLU
sigmoid
tanh
```

и видит shape function.

### Режим 3. Logits → probability

Binary slider logit:

```text
-5 ... 0 ... +5
```

показывает sigmoid probability.

Multiclass — несколько logits и softmax.

### Режим 4. CrossEntropy

Увеличивать correct-class logit и показывать уменьшение loss.

---

## 22. Типичные ошибки

**«ReLU нужна после каждого Linear, включая output».**\
Нет.

**«CrossEntropyLoss принимает probabilities».**\
Она ожидает raw logits.

**«Softmax надо всегда писать в model».**\
Нет, зависит от loss/inference.

**«MLP глубокий = автоматически лучше».**\
Нет.

**«Activation имеет weights».**\
Обычная ReLU — нет.

**«Metric и loss одно и то же».**\
Нет.

---

## 23. Проверка понимания

1. Почему Linear→Linear эквивалентны одному Linear?
2. Что делает ReLU?
3. Почему XOR требует nonlinear representation?
4. Что такое hidden layer?
5. Что такое logit?
6. Что ожидает `CrossEntropyLoss`?
7. Shape logits для 32 objects и 5 classes?
8. Почему ReLU обычно не ставят перед multiclass logits?
9. Width vs depth?
10. Loss vs metric?

---

## 24. Мини-практика

Нужно классифицировать 10 classes по 100 input features.

Architecture:

```text
100 → 64 → 32 → 10
```

Предложите PyTorch model и ответьте:

1. где поставить ReLU;
2. shape каждого stage при batch=128;
3. какая loss;
4. нужен ли Softmax перед loss;
5. сколько parameters в последнем Linear.

---

## Что нужно унести

1. MLP — цепочка Linear + nonlinear activations.
2. Нелинейность делает deep composition выразительнее одного Linear.
3. ReLU — базовая activation `max(0,x)`.
4. Output layer зависит от задачи.
5. CrossEntropyLoss принимает logits.
6. BCEWithLogitsLoss объединяет sigmoid-like transformation и binary loss стабильно.
7. Loss задаёт objective обучения.
8. Width/depth управляют capacity.
9. Следующий вопрос — как вычислить gradients всех этих parameters.

## Куда дальше

У сети сотни, тысячи и миллионы weights.

Вручную выводить derivative каждого невозможно.

Следующий урок разберёт **обратное распространение ошибки (backpropagation)** и покажет, как `torch.autograd` строит вычислительный граф и автоматически применяет chain rule.

## Источники
- PyTorch `nn.ReLU`.
- PyTorch `CrossEntropyLoss`.
- PyTorch official model-building tutorials.
