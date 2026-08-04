---
title: "Стабильное обучение в PyTorch"
type: source
area: dl
status: deprecated
tags:
  - deep-learning
  - theory
  - interview
rag: exclude
id: source.dl.stabil-noe-obuchenie-v-pytorch
schema_version: 2
language: ru
app: exclude
---
# Стабильное обучение в PyTorch

> [!info] Legacy course note
> Canonical theory: [[Optimization and Regularization in Deep Learning]]. Runnable training loop переносится в Practice; этот multi-topic reference исключён из RAG.

> [!tip] Закрепление
> После этой заметки: [[10 Знания/ML/02 Deep Learning/05 Тренажер/01 - Фундамент и обучение]] · [[10 Знания/ML/02 Deep Learning/05 Тренажер/03 - Найди ошибку PyTorch]].

## 5. Активации, инициализация и проблемы градиентов

### 5.1. Исчезающие и взрывающиеся градиенты

Backprop перемножает локальные производные. Если множители в среднем меньше 1, градиент затухает; если больше 1 — растёт.

Последствия:

- ранние слои почти не учатся;
- `loss` становится `NaN`/`inf`;
- нормы градиентов резко различаются.

Инструменты:

- ReLU/GELU вместо насыщаемых sigmoid/tanh в глубоких feed-forward сетях;
- Xavier для `tanh`, Kaiming/He для ReLU;
- residual connections;
- normalization;
- gradient clipping против взрыва градиентов;
- LSTM/GRU для длинных зависимостей в RNN.

### 5.2. Инициализация

Все веса нельзя инициализировать одинаковым нулём: нейроны получают одинаковые градиенты и не разделяют роли.

- **Xavier/Glorot:** сохраняет дисперсию для `tanh`/линейных активаций;
- **Kaiming/He:** учитывает, что ReLU обнуляет часть активаций.

```python
initialized_model = nn.Sequential(
    nn.Linear(20, 64),
    nn.ReLU(),
    nn.Linear(64, 1),
)

for module in initialized_model.modules():
    if isinstance(module, nn.Linear):
        nn.init.kaiming_normal_(module.weight, nonlinearity="relu")
        nn.init.zeros_(module.bias)

print("std первого слоя:", initialized_model[0].weight.std().item())
```

### 5.3. Gradient clipping

Clipping по общей норме:

```python
loss.backward()
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimizer.step()
```

Он ограничивает слишком крупное обновление, но не устраняет первопричину: плохие данные, слишком большой LR или нестабильную архитектуру.

```python
def total_gradient_norm(model: nn.Module) -> float:
    squared_norms = [
        parameter.grad.detach().norm(2).item() ** 2
        for parameter in model.parameters()
        if parameter.grad is not None
    ]
    return sum(squared_norms) ** 0.5

print("Функция для диагностики создана.")
```

#### Проверь себя

Почему gradient clipping чаще встречается в RNN и LLM? Может ли он вылечить неверный target или `NaN` во входных данных?

<details>
<summary><b>Ответ</b></summary>

В длинных вычислительных цепочках риск взрыва градиентов выше. Clipping ограничивает норму уже вычисленного градиента, но не исправляет неверную постановку задачи, повреждённые данные или логическую ошибку.

</details>

## 6. Регуляризация, Dropout, BatchNorm и LayerNorm

### 6.1. Что именно мы пытаемся исправить

Переобучение:

```text
train loss снижается
valid loss сначала снижается, затем растёт
```

Возможные меры:

- больше/лучше данных и аугментаций;
- проще модель;
- weight decay;
- Dropout;
- early stopping;
- корректная валидация.

Регуляризация не нужна «на всякий случай». Слишком сильная регуляризация вызывает недообучение.

### 6.2. Dropout

Во время обучения каждый элемент маски $m_i\sim\operatorname{Bernoulli}(1-p)$:

$$
y_i=\frac{m_i x_i}{1-p}.
$$

Масштаб $1/(1-p)$ сохраняет ожидаемое значение активаций. На validation/inference Dropout отключён.

Поэтому:

- `model.train()` включает Dropout;
- `model.eval()` выключает Dropout;
- веса при Dropout не удаляются — временно маскируются активации.

```python
dropout = nn.Dropout(p=0.5)
sample = torch.ones(10)

dropout.train()
train_output = dropout(sample)

dropout.eval()
eval_output = dropout(sample)

print("train:", train_output)
print("eval:", eval_output)
```

### 6.3. Batch Normalization

Для канала/признака:

$$
\hat x=\frac{x-\mu_B}{\sqrt{\sigma_B^2+\varepsilon}},
\qquad
y=\gamma\hat x+\beta.
$$

`γ` и `β` обучаются. Во время train используются статистики текущего mini-batch и обновляются running statistics; во время eval используются накопленные running statistics.

Небольшой или нерепрезентативный batch делает оценки шумными.

### 6.4. Layer Normalization

LayerNorm нормализует признаки **внутри каждого отдельного объекта/токена**, не зависит от других объектов batch и одинаково работает в train/eval. Поэтому он удобен для Transformer и переменной длины последовательностей.

| Свойство | BatchNorm | LayerNorm |
|---|---|---|
| По чему статистика | batch по каждому каналу | признаки одного объекта/токена |
| Зависит от batch size | да | нет |
| Train/eval отличаются | да | нет |
| Частое применение | CNN/MLP | Transformer |

```python
# B=2, T=3, D=4: два текста, три токена, embedding dimension 4
token_states = torch.randn(2, 3, 4)
layer_norm = nn.LayerNorm(4)
normalized = layer_norm(token_states)

print("Shape:", normalized.shape)
print("Среднее последнего измерения:")
print(normalized.mean(dim=-1).round(decimals=5))
```

#### Проверь себя

    1. Почему `model.eval()` нужен даже вместе с `torch.no_grad()`?
    2. Почему LayerNorm удобнее BatchNorm для Transformer?

<details>
<summary><b>Ответ</b></summary>

1. `no_grad()` отключает построение графа, но не переключает поведение Dropout и BatchNorm. `eval()` переключает поведение модулей, но сам по себе не отключает градиенты.
2. LayerNorm не зависит от статистики batch и нормализует признаки каждого токена отдельно, поэтому подходит для последовательностей разной длины и маленьких batch.

</details>

## 7. Полный PyTorch pipeline на банковском примере

Сделаем бинарную классификацию на `make_moons`. Это игрушечные данные, но цикл обучения такой же:

```text
split → preprocessing по train → Dataset/DataLoader
→ model → train loop → validation → restore best weights
```

**Защита от утечки:** scaler обучается только на `X_train`.

```python
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X, y = make_moons(n_samples=1_500, noise=0.20, random_state=SEED)

X_train, X_valid, y_train, y_valid = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=SEED,
    stratify=y,
)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_valid = scaler.transform(X_valid)

X_train_tensor = torch.tensor(X_train, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train, dtype=torch.float32)
X_valid_tensor = torch.tensor(X_valid, dtype=torch.float32)
y_valid_tensor = torch.tensor(y_valid, dtype=torch.float32)

train_loader = DataLoader(
    TensorDataset(X_train_tensor, y_train_tensor),
    batch_size=64,
    shuffle=True,
)

print("Train:", X_train_tensor.shape, y_train_tensor.shape)
print("Valid:", X_valid_tensor.shape, y_valid_tensor.shape)
```

```python
class DefaultRiskMLP(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(2, 16),
            nn.ReLU(),
            nn.Linear(16, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        # (B, 1) -> (B,), чтобы совпасть с target
        return self.network(features).squeeze(1)


model = DefaultRiskMLP().to(device)
loss_function = nn.BCEWithLogitsLoss()
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-2,
    weight_decay=1e-3,
)

print(model)
print("Параметров:", sum(p.numel() for p in model.parameters()))
```

```python
best_valid_loss = float("inf")
best_state = None
patience = 30
epochs_without_improvement = 0
history = {"train_loss": [], "valid_loss": []}

X_valid_device = X_valid_tensor.to(device)
y_valid_device = y_valid_tensor.to(device)

for epoch in range(300):
    model.train()
    running_loss = 0.0

    for batch_features, batch_targets in train_loader:
        batch_features = batch_features.to(device)
        batch_targets = batch_targets.to(device)

        optimizer.zero_grad()
        logits = model(batch_features)
        loss = loss_function(logits, batch_targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * batch_features.size(0)

    train_loss = running_loss / len(train_loader.dataset)

    model.eval()
    with torch.inference_mode():
        valid_logits = model(X_valid_device)
        valid_loss = loss_function(
            valid_logits,
            y_valid_device,
        ).item()

    history["train_loss"].append(train_loss)
    history["valid_loss"].append(valid_loss)

    if valid_loss < best_valid_loss - 1e-4:
        best_valid_loss = valid_loss
        best_state = copy.deepcopy(model.state_dict())
        epochs_without_improvement = 0
    else:
        epochs_without_improvement += 1

    if epochs_without_improvement >= patience:
        print(f"Early stopping: epoch {epoch}")
        break

model.load_state_dict(best_state)
print("Best validation loss:", round(best_valid_loss, 4))
```

```python
model.eval()
with torch.inference_mode():
    valid_logits = model(X_valid_device)
    valid_probabilities = torch.sigmoid(valid_logits)
    valid_predictions = (valid_probabilities >= 0.5).float()
    valid_accuracy = (
        valid_predictions == y_valid_device
    ).float().mean().item()

print("Validation accuracy:", round(valid_accuracy, 4))

plt.figure(figsize=(7, 4))
plt.plot(history["train_loss"], label="train")
plt.plot(history["valid_loss"], label="validation")
plt.xlabel("Epoch")
plt.ylabel("BCE loss")
plt.title("Learning curves")
plt.legend()
plt.grid(alpha=0.25)
plt.show()
```

### 7.1. Сохранение модели

Для воспроизводимости сохраняют не только веса:

- `model.state_dict()`;
- `optimizer.state_dict()` для продолжения обучения;
- номер эпохи/шага;
- scaler/tokenizer и конфигурацию;
- random seed;
- validation metric.

```python
# Пример checkpoint без записи на диск:
checkpoint = {
    "model_state": model.state_dict(),
    "optimizer_state": optimizer.state_dict(),
    "best_valid_loss": best_valid_loss,
    "seed": SEED,
}

print(checkpoint.keys())
```

#### Проверь себя

Назови назначение каждой строки:

```python
optimizer.zero_grad()
logits = model(x)
loss = criterion(logits, y)
loss.backward()
optimizer.step()
```

Почему validation выполняется с `model.eval()` и `torch.inference_mode()`?

<details>
<summary><b>Ответ</b></summary>

Очистить прошлые градиенты → forward → вычислить скалярную ошибку → получить градиенты → обновить веса. `eval()` переключает Dropout/BatchNorm, `inference_mode()` не строит граф и экономит память/время.

</details>

Вернуться: [[10 Знания/ML/02 Deep Learning/04 Теория/00 - Карта теории]].
