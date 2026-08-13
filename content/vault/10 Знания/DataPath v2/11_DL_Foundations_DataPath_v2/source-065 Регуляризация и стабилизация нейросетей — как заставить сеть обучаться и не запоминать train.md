---
title: "Регуляризация и стабилизация нейросетей — как заставить сеть обучаться и не запоминать train"
id: concept.datapath-v2.065
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 65
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Регуляризация и стабилизация нейросетей

Нейросеть может провалиться двумя принципиально разными способами.

### Optimization failure

```text
train loss не уменьшается
NaN
gradients vanish/explode
```

### Generalization failure

```text
train loss отлично падает
validation loss растёт
```

В первом случае model не может нормально обучиться.

Во втором — обучилась слишком хорошо именно на train.

Поэтому нужно различать:

> **стабилизацию optimization** и **регуляризацию generalization**.

Некоторые методы помогают сразу обоим, но их механизмы различны.

---

# Часть I. Initialization

## 1. Почему initial weights важны

Если все neurons одного layer стартуют с одинаковых weights, они получают одинаковые outputs и одинаковые gradients.

Они остаются симметричными и фактически учат одно и то же.

Поэтому weights инициализируют случайно.

Но random distribution тоже нельзя выбирать совсем произвольно.

---

## 2. Слишком большие weights

Если variance weights слишком большая:

```text
activations растут
→ следующие layers получают огромные values
→ gradients могут explode / saturate
```

Особенно sigmoid/tanh быстро уходят в saturated regions.

---

## 3. Слишком маленькие weights

Если weights почти нулевые:

```text
activations уменьшаются по глубине
→ gradient signal может стать tiny
```

Нужен scale, поддерживающий разумную variance signal.

---

## 4. Xavier / Glorot initialization

Для activations вроде tanh historically используют Xavier-style scaling.

Идея:

> выбрать variance weights с учётом fan-in/fan-out, чтобы signal не раздувался и не исчезал слишком быстро.

В PyTorch есть:

```python
torch.nn.init.xavier_uniform_
torch.nn.init.xavier_normal_
```

---

## 5. He / Kaiming initialization

Для ReLU-family часто используют Kaiming/He initialization.

PyTorch:

```python
torch.nn.init.kaiming_uniform_
torch.nn.init.kaiming_normal_
```

Официальный `nn.init.calculate_gain` для ReLU отражает соответствующий gain \(\sqrt2\).

Главная идея:

> initialization должна учитывать activation function.

---

## 6. PyTorch уже инициализирует standard layers

`nn.Linear` создаёт weights с library default initialization.

Не нужно вручную вызывать Kaiming для каждой model только потому, что вы узнали этот method.

Custom initialization имеет смысл, когда есть конкретная architecture/experiment reason.

---

# Часть II. Weight decay

## 7. Regularization через размер weights

Weight decay старается не позволять parameters расти бесконтрольно.

Интуитивно:

```text
две models одинаково fit train
→ предпочитаем solution с умеренными weights
```

В AdamW decay отделён от adaptive gradient moments.

Пример:

```python
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
    weight_decay=1e-2,
)
```

Слишком сильный decay:

```text
model underfit
```

Слишком слабый:

```text
regularization effect minimal
```

---

# Часть III. Dropout

## 8. Главная идея Dropout

Во время training **Dropout** случайно зануляет часть activations с probability \(p\).

```python
nn.Dropout(p=0.5)
```

В официальной PyTorch документации элементы зануляются независимо во время training; outputs масштабируются так, что в evaluation layer становится identity-like по expectation.

Mental model:

```text
каждый batch
→ немного другая subnetwork
→ neurons меньше полагаются на точное совместное присутствие друг друга
```

---

## 9. Train vs eval mode

Dropout ведёт себя по-разному.

```python
model.train()
```

Dropout активен.

```python
model.eval()
```

Dropout отключён.

Это одна из главных причин, почему перед validation/inference нужно:

```python
model.eval()
```

И желательно:

```python
with torch.no_grad():
    validation_logits = model(X_valid)
    validation_loss = loss_fn(validation_logits, y_valid)
```

`eval()` и `no_grad()` решают разные задачи.

---

![Учебная иллюстрация: Dropout. Train masks, inverted scaling и отличие inference mode.](content-assets/datapath-v2/figures/65_dropout.png "Train masks, inverted scaling и отличие inference mode.")

## 10. `eval()` не отключает gradients

Очень важное distinction.

```python
model.eval()
```

переключает behavior некоторых layers:

- Dropout;
- BatchNorm.

Но autograd tracking само по себе остаётся.

```python
torch.no_grad()
```

отключает gradient tracking.

На inference обычно нужны оба:

```python
model.eval()
with torch.no_grad():
    probabilities = model(X_new).softmax(dim=1)
```

---

## 11. Слишком большой Dropout

Если:

```text
p очень высокий
```

network теряет слишком много signal и может underfit.

Dropout — hyperparameter, не «добавить 0.5 везде».

В Transformer architectures часто используются другие rates и patterns, а некоторые modern networks training regimes обходятся меньшим dropout при огромных data.

---

# Часть IV. Batch Normalization

## 12. Что делает BatchNorm

Для batch activations по feature/channel вычисляются statistics.

Упрощённо:

\[
\hat x
=
\frac{x-\mu_B}
{\sqrt{\sigma_B^2+\epsilon}},
\]

затем learnable affine transformation:

\[
y=\gamma\hat x+\beta.
\]

В `BatchNorm1d` \(\gamma\) и \(\beta\) — learnable parameters.

---

## 13. Зачем affine после normalization

Если просто всегда forcing mean=0/std=1 ограничивало бы representation.

Learnable:

```text
gamma
beta
```

позволяют layer восстановить нужный scale/shift.

Normalization помогает optimization, но network сохраняет flexibility.

---

## 14. Running statistics

Во время training BatchNorm использует batch statistics и обновляет running estimates.

В evaluation:

```python
model.eval()
```

используются сохранённые running statistics.

Поэтому забыть `model.eval()` перед validation — серьёзная ошибка.

---

## 15. Маленькие batches

При очень маленьком batch statistics шумные.

BatchNorm может работать нестабильно.

Для architectures/regimes с small batch часто используют другие normalization approaches:

- LayerNorm;
- GroupNorm.

Transformer обычно использует LayerNorm/RMSNorm-like methods, а не BatchNorm.

---

# Часть V. LayerNorm

## 16. Чем LayerNorm отличается концептуально

BatchNorm использует statistics across batch для определённых features/channels.

LayerNorm normalizes feature dimensions **внутри отдельного sample/token representation** согласно заданной normalized shape.

Поэтому LayerNorm не зависит от большого batch для stable statistics так же, как BatchNorm.

Это станет особенно важно в Transformer block.

---

# Часть VI. Early stopping

## 17. Validation loss как сигнал

Train:

```text
epoch 1 → loss 1.0
epoch 20 → 0.2
epoch 100 → 0.01
```

Validation:

```text
epoch 1 → 1.1
epoch 20 → 0.3
epoch 40 → 0.28
epoch 100 → 0.8
```

После epoch ~40 model продолжает fit train, но generalization ухудшается.

Early stopping сохраняет checkpoint around best validation state.

---

## 18. Early stopping не заменяет test

Validation используется для решения:

```text
на какой epoch остановиться
```

Значит validation уже участвует в model selection.

Final unbiased evaluation всё равно делается на untouched test.

---

# Часть VII. Data augmentation

## 19. Regularization через новые версии data

В computer vision можно создавать transformed training images:

- crop;
- flip;
- color changes;
- rotations — если label semantics сохраняется.

Это **augmentation**.

Идея:

> model должна давать одинаково разумный output для transformations, которые не меняют meaning.

Так invariance встраивается через data.

Для tabular data augmentation гораздо менее универсальна.

---

# Часть VIII. Label smoothing

## 20. Слишком уверенные class targets

Обычный target multiclass:

```text
correct class = 1
others = 0
```

Label smoothing немного смягчает target distribution.

В PyTorch `CrossEntropyLoss` имеет parameter:

```text
label_smoothing
```

Это может уменьшать excessive confidence и работать как regularization.

Но слишком сильное smoothing может ухудшать fit.

---

# Часть IX. Gradient clipping

## 21. Stabilization, а не generalization в первую очередь

```python
torch.nn.utils.clip_grad_norm_(
    model.parameters(),
    max_norm=1.0,
)
```

ограничивает norm gradient.

Особенно полезно при exploding gradients, например в recurrent systems.

Но если root cause — неправильный learning rate или broken data, clipping может лишь скрыть симптом.

---

# Часть X. Learning-rate schedule и warmup

## 22. Stabilization первых steps

Большой network с random initialization иногда плохо переносит сразу большой lr.

Warmup:

```text
lr маленький
→ постепенно растёт
→ потом основной schedule
```

Это особенно типично для Transformer training.

Cosine/step decay позже уменьшают lr.

---

# Часть XI. Проверка состояния сети

## 23. Train/validation curves

Четыре базовых сценария.

### Train high, validation high

```text
underfit / optimization problem
```

### Train low, validation much higher

```text
overfit
```

### Both decrease smoothly

```text
training healthy
```

### Train becomes NaN

```text
optimization/numerical instability
```

Эта диагностика должна предшествовать хаотичному добавлению regularizers.

---

## 24. Overfit one batch

Один из лучших DL debugging tests:

> взять один маленький batch и попытаться почти идеально его выучить.

Если network не может overfit один batch:

- bug in pipeline;
- wrong labels;
- loss mismatch;
- gradients broken;
- learning rate;
- architecture issue.

Перед regularization нужно убедиться, что network вообще способна fit.

---

## 25. Проверка initial loss

Для C-class classification со случайными примерно равными logits:

\[
CrossEntropy
\approx
\log C.
\]

Например C=10:

\[
\log(10)\approx2.30.
\]

Если initial loss гигантская:

```text
1000
```

это повод проверить initialization, labels, scale logits, code.

Это sanity check, не строгая guarantee.

---

## 26. Monitor activation statistics

Можно смотреть:

```text
mean/std activations
fraction zeros after ReLU
weight norms
gradient norms
```

Если после ReLU:

```text
99.9% zeros
```

возможно dying activations.

Если std растёт по layers в тысячи раз — unstable signal.

---

## 27. Regularization toolbox: когда что

### Weight decay

Контроль magnitude parameters.

### Dropout

Stochastic removal activations during train.

### Data augmentation

Встраивает invariances через modified examples.

### Early stopping

Останавливает training до сильного overfit.

### Label smoothing

Снижает hard confidence targets.

### Smaller model

Часто самая простая regularization.

Важно:

> не добавлять всё одновременно без diagnosis.

---

## 28. Почему normalization не просто regularization

BatchNorm может иметь regularizing noise effect из-за batch statistics, но основной pedagogical смысл:

> стабилизировать optimization/activation scale.

LayerNorm similarly прежде всего normalization/optimization mechanism.

Не надо объяснять BatchNorm как «ещё один Dropout».

---

## 29. Полный training template

```python
model.train()

for x, y in train_loader:
    optimizer.zero_grad()

    logits = model(x)
    loss = loss_fn(logits, y)

    loss.backward()

    torch.nn.utils.clip_grad_norm_(
        model.parameters(),
        max_norm=1.0,
    )

    optimizer.step()

model.eval()

valid_loss = 0.0

with torch.no_grad():
    for x, y in valid_loader:
        logits = model(x)
        loss = loss_fn(logits, y)
        valid_loss += loss.item()
```

Не все проекты требуют clipping. Здесь он показан как возможный элемент, а не mandatory line.

---

## 30. Reproducibility

DL training содержит randomness:

- initialization;
- batch shuffling;
- dropout;
- augmentation;
- GPU kernels.

Seeds помогают воспроизводимости:

```python
torch.manual_seed(42)
```

Но deterministic behavior может зависеть от backend/device и иногда стоить performance.

Не нужно обещать bitwise identical training на всех devices только из-за одного seed.

---

## 31. Интерактивная визуализация DataPath

### Режим 1. Initialization

Deep chain, sliders weight std.

Показывать activation variance layer-by-layer.

### Режим 2. Dropout

Network nodes случайно отключаются при `train()`, все активны при `eval()` с correct scaling behavior.

### Режим 3. BatchNorm

Batch distribution → normalize → gamma/beta.

Switch:

```text
train
eval
```

показывает batch vs running statistics.

### Режим 4. Curves diagnosis

Пользователь видит train/validation curves и выбирает:

```text
underfit
overfit
divergence
healthy
```

После ответа показывать next action.

---

## 32. Типичные ошибки

**«Dropout работает и в eval mode так же».**\
Нет.

**«`model.eval()` отключает autograd».**\
Нет.

**«`torch.no_grad()` переключает BatchNorm на eval statistics».**\
Нет.

**«BatchNorm и LayerNorm одно и то же».**\
Нет.

**«Больше regularization всегда лучше».**\
Нет.

**«Weight decay и Dropout одинаковы».**\
Нет.

**«Если validation плохая, сразу нужен Dropout».**\
Сначала diagnosis.

**«Seed гарантирует абсолютную reproducibility везде».**\
Нет.

---

## 33. Проверка понимания

1. Optimization failure vs overfit?
2. Зачем random initialization?
3. Xavier vs Kaiming conceptual difference?
4. Что делает Dropout?
5. `train()` vs `eval()`?
6. `eval()` vs `no_grad()`?
7. Что нормализует BatchNorm?
8. Почему small batch может быть проблемой?
9. Что делает early stopping?
10. Зачем overfit one batch test?

---

## 34. Мини-практика

Сценарии.

### A

```text
train loss не меняется
validation тоже
```

### B

```text
train loss → 0.01
validation: 0.4 → 1.2
```

### C

```text
loss = NaN с первых 20 steps
gradient norm = 1e8
```

### D

```text
train works
validation score каждый запуск разный,
Dropout network
```

Предложите checks/actions.

Подсказки:
- learning rate;
- labels/loss;
- one-batch overfit;
- early stopping;
- weight decay/dropout;
- clipping;
- `model.eval()`.

---

## 35. Как объяснить на собеседовании

### Dropout

Во время training случайно зануляет часть activations и тем самым regularizes representation. В evaluation mode Dropout отключён.

### BatchNorm

Нормализует activations по batch statistics для соответствующих dimensions, затем применяет learnable scale/shift. В evaluation использует running statistics.

### Weight decay

Регуляризует parameters через shrinkage; в AdamW decoupled от adaptive moments.

### Как debug network, которая не учится?

Проверить data/labels/shapes/loss, попытаться overfit один batch, проверить gradients/norms, learning rate и initial loss. Только потом усложнять optimizer/architecture.

---

## Что нужно унести

1. Optimization stability и generalization — разные проблемы.
2. Initialization контролирует scale signal в начале.
3. Kaiming/Xavier учитывают structure layer/activation.
4. Weight decay ограничивает parameter magnitude.
5. Dropout действует только в training mode.
6. `model.eval()` и `torch.no_grad()` не одно и то же.
7. BatchNorm использует batch/running statistics и learnable affine parameters.
8. LayerNorm будет особенно важен для Transformers.
9. Early stopping — model selection по validation.
10. Gradient clipping ограничивает exploding gradients.
11. Overfit one batch — ключевой debugging test.
12. Regularizer выбирают по diagnosis, а не checklist.

## Куда дальше

Фундамент DL готов:

```text
tensor
→ Linear
→ activation
→ MLP
→ loss
→ backprop
→ optimizer
→ stable training
```

Следующий блок перейдёт к architectures:

- convolution;
- pooling;
- последовательности;
- embeddings;
- attention;
- Transformer;
- полный PyTorch training workflow;
- transfer learning и fine-tuning.

## Источники
- PyTorch `Dropout`, `BatchNorm1d`, `nn.init`.
- PyTorch training/evaluation conventions.
