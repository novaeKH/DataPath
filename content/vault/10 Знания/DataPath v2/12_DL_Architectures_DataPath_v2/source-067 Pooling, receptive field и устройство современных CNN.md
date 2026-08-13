---
title: "Pooling, receptive field и устройство современных CNN"
id: concept.datapath-v2.067
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 67
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Pooling, receptive field и устройство современных CNN

Один convolutional layer с kernel 3×3 видит очень маленькую часть image.

Но глубокая CNN должна распознавать:

```text
edge
→ texture
→ eye
→ face
→ whole object
```

Как маленькие filters начинают учитывать большой region?

Ответ:

> **за счёт глубины, уменьшения resolution и роста receptive field.**

---

## 1. Receptive field

**Поле восприятия (receptive field)** neuron — region исходного input, который может повлиять на его value.

Первый Conv3×3:

```text
receptive field = 3×3
```

Второй Conv3×3 поверх первого уже зависит от нескольких neighboring first-layer activations.

В итоге его receptive field относительно original image больше.

---

## 2. Два Conv3×3

Без stride/dilation:

```text
Conv3×3
→ Conv3×3
```

effective receptive field становится примерно:

```text
5×5
```

Третий:

```text
7×7
```

Stack маленьких kernels постепенно расширяет context.

При этом между layers можно вставлять nonlinearities.

Это одна из причин популярности multiple 3×3 convolutions вместо одного огромного kernel.

---

## 3. Pooling

**Pooling** уменьшает spatial resolution.

Max pooling:

```python
nn.MaxPool2d(
    kernel_size=2,
    stride=2,
)
```

Берёт local region 2×2 и оставляет maximum.

```text
64×64
→ 32×32
```

---

## 4. Max Pooling руками

Patch:

\[
\begin{bmatrix}
1&5\\
3&2
\end{bmatrix}
\]

MaxPool output:

\[
5.
\]

Average pooling:

\[
\frac{1+5+3+2}{4}=2.75.
\]

Они агрегируют local information по-разному.

---

![Учебная иллюстрация: Max Pooling. Окна 2×2 превращают матрицу 4×4 в pooled output без обучаемых весов.](content-assets/datapath-v2/figures/67_max_pooling.png "Окна 2×2 превращают матрицу 4×4 в pooled output без обучаемых весов.")

## 5. Зачем уменьшать resolution

### Compute

Feature map 64×64 намного дороже 16×16.

### Receptive field

После downsampling следующий convolution охватывает larger region original image.

### Robustness

Local aggregation делает representation менее чувствительным к небольшим position changes.

Но слишком раннее downsampling может уничтожить fine details.

---

## 6. Pooling не имеет learnable weights

Обычный MaxPool:

```text
parameters = 0
```

Это deterministic operation.

Convolution со stride=2 может тоже уменьшать resolution, но при этом сама learnable.

Modern architectures нередко предпочитают learned downsampling вместо обязательного MaxPool в каждом block.

---

## 7. Global Average Pooling

Пусть final feature maps:

```text
[batch, 512, 7, 7]
```

Global Average Pooling усредняет spatial dimensions:

```text
[batch,512]
```

Это позволяет избежать огромного Flatten+Linear.

Каждый channel превращается в одно summary value.

---

## 8. CNN hierarchy

Conceptual:

```text
early layers:
edges / colors

middle:
textures / parts

late:
larger semantic patterns
```

Это useful intuition, но не жёсткий закон. Реальные features distributed и зависят от task/training.

---

## 9. Typical simple classifier

```python
model = nn.Sequential(
    nn.Conv2d(3, 32, 3, padding=1),
    nn.ReLU(),
    nn.MaxPool2d(2),

    nn.Conv2d(32, 64, 3, padding=1),
    nn.ReLU(),
    nn.MaxPool2d(2),

    nn.AdaptiveAvgPool2d((1, 1)),
    nn.Flatten(),
    nn.Linear(64, 10),
)
```

Input 64×64:

```text
64
→ pool
32
→ pool
16
→ adaptive pool
1
```

---

## 10. Adaptive pooling

`AdaptiveAvgPool2d((1,1))` выдаёт заданный spatial output независимо от exact input H/W в допустимых условиях.

Это удобно для classifier head.

Вместо ручного вычисления:

```text
какой exact Flatten size?
```

получаем fixed channel vector.

---

## 11. Почему channels обычно растут при уменьшении resolution

Common design:

```text
64×64 × 32 channels
32×32 × 64
16×16 × 128
8×8 × 256
```

Spatial positions уменьшаются, channel capacity растёт.

Интуиция:

> меньше где, больше что.

Но exact channel schedule — architecture design choice.

---

## 12. Residual connections

Deep networks сложно optimize.

ResNet вводит:

\[
y=F(x)+x.
\]

То есть block учит **residual correction** \(F(x)\), а identity path позволяет information и gradients проходить напрямую.

Это фундаментальная modern CNN idea.

---

## 13. Почему residual connection помогает

Если полезное transformation близко к identity, network не обязана заново учить полный mapping.

Можно:

```text
output = input + small correction
```

Кроме того, skip path облегчает gradient flow.

Residual connections позже появятся и в Transformer.

---

## 14. Basic residual block

Conceptually:

```text
x
├───────────────┐
↓               │
Conv            │
ReLU            │
Conv            │
↓               │
+ <─────────────┘
↓
ReLU
```

Если shapes отличаются, skip branch может использовать projection.

---

## 15. Bottleneck block

В deeper ResNets часто:

```text
1×1 reduce channels
→ 3×3 spatial conv
→ 1×1 expand
```

Это уменьшает compute expensive 3×3 operation.

Bottleneck здесь означает architecture compression внутри block, а не hidden representation в общем смысле.

---

## 16. Dilation

**Dilated convolution** вставляет gaps между kernel elements.

Kernel 3×3 с dilation>1 видит larger region без пропорционального роста parameters.

Полезно в segmentation/audio и задачах, где нужно large receptive field без сильного downsampling.

---

## 17. Groups и depthwise

Grouped convolution разделяет channels на groups.

Depthwise — extreme case:

```text
groups = in_channels
```

Каждый channel обрабатывается отдельно.

Затем pointwise 1×1 mixes channels.

MobileNet-like architectures используют это для efficiency.

---

## 18. Classification vs detection vs segmentation

CNN feature extractor может использоваться для разных heads.

### Classification

Один label image.

### Detection

Boxes + classes multiple objects.

### Segmentation

Class per pixel.

Различие task меняет architecture/output/loss, но convolutional feature extraction остаётся общей основой.

---

## 19. Data augmentation для images

Common transforms:

- random crop;
- horizontal flip;
- color jitter;
- resize.

Но augmentation должна сохранять label.

Например:

```text
horizontal flip
```

может быть допустим для кошки, но недопустим для распознавания текста/дорожных знаков с orientation semantics.

---

## 20. Normalization input

Pretrained vision models часто ожидают конкретные image normalization statistics и size.

Если использовать pretrained weights, preprocessing должен соответствовать training recipe model.

Нельзя взять pretrained network и случайно поменять scale pixels без понимания.

---

## 21. Parameter count vs activation memory

В CNN memory расходуется не только на weights.

Во время training нужно хранить activations для backward.

Большие early feature maps:

```text
high H×W
```

могут занимать огромную memory даже при умеренном числе parameters.

Это объясняет, почему batch size часто ограничен activation memory.

---

## 22. FLOPs mental model

Compute Conv roughly grows with:

```text
H × W
× in_channels
× out_channels
× kernel_area
```

Поэтому уменьшение H/W сильно снижает cost.

Architecture design всегда балансирует:

```text
resolution
channels
depth
```

---

## 23. Интерактивная визуализация

### Receptive field

Stack Conv3×3.

Подсвечивать, какие original pixels влияют на selected deep activation.

### Pooling

Показать 4×4 map и MaxPool/AveragePool.

### Residual

Переключатель:

```text
plain block
residual block
```

Показывать gradient path.

### Compute

Sliders resolution/channels показывают approximate relative compute и activation size.

---

## 24. Типичные ошибки

**«Pooling обучается через weights».**\
Обычный MaxPool — нет.

**«Pooling обязателен в каждой CNN».**\
Нет.

**«Receptive field одного Conv3×3 всегда 3×3 на любом depth».**\
Относительно его immediate input да; относительно original image растёт.

**«Residual connection просто concatenates features».**\
В classic ResNet это addition.

**«Больше channels всегда лучше».**\
Compute/memory/overfit растут.

**«Pretrained model можно кормить любыми raw pixels».**\
Нужно соблюдать expected preprocessing.

---

## 25. Проверка понимания

1. Что такое receptive field?
2. Почему stacking 3×3 увеличивает context?
3. MaxPool vs AveragePool?
4. Зачем downsampling?
5. Что делает Global Average Pooling?
6. Почему channels часто растут?
7. Что делает residual connection?
8. Зачем 1×1 Conv?
9. Что делает dilation?
10. Почему activation memory важна?

---

## 26. Мини-практика

Input:

```text
[16,3,128,128]
```

Architecture:

```text
Conv 3→32, k3,p1
MaxPool2
Conv 32→64,k3,p1
MaxPool2
AdaptiveAvgPool(1,1)
Linear 64→5
```

Ответьте:

1. shapes после каждого stage;
2. где уменьшается spatial size;
3. зачем adaptive pool;
4. сколько inputs у final Linear;
5. где больше activation memory — до первого pool или после второго.

---

## 27. Что нужно унести

1. Receptive field растёт с depth.
2. Pooling/downsampling уменьшает resolution и compute.
3. Global pooling превращает feature maps в compact vector.
4. CNN строит hierarchy local-to-global.
5. Residual connections облегчают optimization deep networks.
6. 1×1 Conv mixing channels.
7. Dilation увеличивает effective field без большого kernel.
8. Modern CNN architecture — баланс depth, width, resolution и compute.
9. Preprocessing pretrained models должен совпадать с expected recipe.

## Куда дальше

Images имеют spatial structure.

Другой важный тип data — **последовательности**:

```text
текст
временной ряд
аудио
события пользователя
```

Следующий урок начнёт с классического подхода: **рекуррентной нейронной сети (RNN)**.

## Источники
- PyTorch pooling/adaptive pooling docs.
- PyTorch vision tutorials and ResNet implementations.
