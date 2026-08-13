---
title: "Свёрточные нейронные сети — локальные фильтры и карты признаков"
id: concept.datapath-v2.066
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 66
canonical_course: "Deep Learning"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Свёрточные нейронные сети: локальные фильтры и карты признаков

Многослойный перцептрон (MLP) умеет работать с изображением, если просто вытянуть pixels в длинный vector.

Например:

```text
image: 64 × 64 × 3
→ flatten
→ 12 288 чисел
```

Но так мы теряем структуру:

- соседние pixels связаны;
- один и тот же edge может появиться в любой части image;
- нам хочется обнаруживать локальные patterns независимо от их положения.

**Свёрточная нейронная сеть (Convolutional Neural Network, CNN)** использует именно эти свойства.

Главная идея:

> один и тот же маленький обучаемый filter скользит по изображению и ищет локальный pattern во многих positions.

---

## 1. Почему обычный Linear layer дорог для изображения

Пусть input:

```text
224 × 224 × 3
```

Количество values:

\[
224\cdot224\cdot3=150528.
\]

Если соединить их с hidden layer из 1000 neurons:

\[
150528\cdot1000
\approx150\text{ млн weights}.
\]

Это огромная parameter count только для первого layer.

CNN использует **локальные связи** и **разделяемые веса (weight sharing)**.

---

## 2. Что такое filter

Простейший grayscale image можно представить matrix:

\[
X\in\mathbb R^{H\times W}.
\]

Filter:

\[
K\in\mathbb R^{3\times3}.
\]

Например:

\[
K=
\begin{bmatrix}
-1&0&1\\
-1&0&1\\
-1&0&1
\end{bmatrix}
\]

может реагировать на vertical edge-like structure.

Мы накладываем filter на маленький patch image, перемножаем corresponding values и суммируем.

---

## 3. Один convolution руками

Patch:

\[
X=
\begin{bmatrix}
1&2&3\\
1&2&3\\
1&2&3
\end{bmatrix}.
\]

Kernel:

\[
K=
\begin{bmatrix}
-1&0&1\\
-1&0&1\\
-1&0&1
\end{bmatrix}.
\]

Получаем:

\[
(-1)\cdot1+0\cdot2+1\cdot3
\]

для каждой строки.

Одна строка:

\[
-1+3=2.
\]

Три строки:

\[
2+2+2=6.
\]

Output в этой position равен 6.

Большой positive response означает, что локальный patch похож на pattern filter.

---

![Учебная иллюстрация: CNN convolution. Image patch, kernel, точные dot products и соответствующая feature map.](content-assets/datapath-v2/figures/66_cnn_convolution.png "Image patch, kernel, точные dot products и соответствующая feature map.")

## 4. Filter обучается

В старых computer-vision pipelines edge filters могли задаваться вручную.

В CNN kernel weights — learnable parameters.

```python
nn.Conv2d(...)
```

не знает заранее, что нужно искать edge, texture или eye.

Backpropagation находит filters, которые полезны для конечной loss.

На ранних layers часто возникают простые локальные patterns, а deeper layers комбинируют их в более сложные representations.

---

## 5. Channels

RGB image:

```text
3 channels:
R
G
B
```

PyTorch обычно использует image tensor shape:

```text
[batch, channels, height, width]
```

Например:

```text
[32, 3, 224, 224]
```

Один convolutional filter должен смотреть на все input channels.

Если kernel size 3×3 и input channels=3, один filter имеет weights:

```text
[3, 3, 3]
```

плюс bias.

---

## 6. `nn.Conv2d`

```python
import torch.nn as nn

conv = nn.Conv2d(
    in_channels=3,
    out_channels=16,
    kernel_size=3,
)
```

Это означает:

```text
input channels: 3
learned filters: 16
kernel spatial size: 3 × 3
```

Output будет иметь 16 channels — по одной feature map на каждый output filter.

---

## 7. Feature map

Если один filter скользит по всему image, он создаёт matrix responses.

Это **карта признаков (feature map)**.

16 filters:

```text
→ 16 feature maps
```

Разные maps могут кодировать разные learned patterns.

Tensor:

```text
[batch, 16, H_out, W_out]
```

---

## 8. Размер output без padding

Для одного spatial dimension:

\[
out
=
\left\lfloor
\frac{in+2p-d(k-1)-1}{s}
+1
\right\rfloor.
\]

Где:

- \(k\) — kernel size;
- \(s\) — stride;
- \(p\) — padding;
- \(d\) — dilation.

Для обычного случая:

```text
input = 5
kernel = 3
stride = 1
padding = 0
```

\[
out=3.
\]

То есть:

```text
5 × 5
→ Conv 3×3
→ 3 × 3
```

---

## 9. Stride

**Шаг (stride)** задаёт, насколько kernel сдвигается.

```text
stride=1
```

— каждую соседнюю position.

```text
stride=2
```

— через одну.

Большой stride уменьшает spatial resolution и compute.

Но слишком агрессивное уменьшение может потерять fine details.

---

## 10. Padding

Без padding borders используются реже, а image spatial size уменьшается.

Padding добавляет values вокруг image, часто zeros.

Для odd kernel:

```text
kernel=3
padding=1
stride=1
```

обычно сохраняет H/W.

```text
224×224
→ 224×224
```

Это часто называют same-size behavior.

---

## 11. Почему padding важен

Без padding после многих layers spatial dimensions быстро уменьшаются.

Кроме того, border pixels участвуют в меньшем числе convolution windows.

Padding позволяет контролировать geometry network.

---

## 12. Weight sharing

Самая важная parameter-efficiency idea.

Если filter 3×3×3:

\[
3\cdot3\cdot3=27
\]

weights.

Он применяется ко всем positions image.

Мы **не создаём отдельные 27 weights для каждой position**.

Поэтому filter может распознавать похожий pattern в разных местах.

---

## 13. Translation equivariance

Если object сдвинулся в image, convolution response тоже примерно сдвигается.

Это называют **эквивариантностью к переносу (translation equivariance)**.

Это не то же самое, что полная invariance.

CNN не автоматически полностью игнорирует position, но weight sharing делает local detectors position-independent по parameters.

Pooling/global aggregation позже помогают создавать большую robustness к shifts.

---

## 14. Почему convolution локальна

Kernel 3×3 видит только небольшой local neighborhood.

Это полезный inductive bias для images:

> nearby pixels обычно сильнее связаны, чем pixels из противоположных углов.

MLP должен учить эту структуру из data.

CNN встраивает её architecture.

---

## 15. Activation после convolution

Обычный block:

```text
Conv2d
→ ReLU
```

Без activation много convolution layers подряд в математическом смысле оставались бы linear transformation относительно input.

ReLU добавляет nonlinear composition.

---

## 16. BatchNorm и CNN

Частый historical block:

```text
Conv
→ BatchNorm
→ ReLU
```

BatchNorm стабилизирует distributions activations и optimization.

Но modern architectures используют разные normalization designs, поэтому это не универсальный закон.

---

## 17. Число parameters Conv2d

Для:

```python
nn.Conv2d(
    in_channels=3,
    out_channels=16,
    kernel_size=3,
)
```

Weights:

\[
16\cdot3\cdot3\cdot3=432.
\]

Bias:

\[
16.
\]

Total:

\[
448.
\]

Это намного меньше, чем dense connection каждого pixel к каждому output spatial element.

---

## 18. Multi-channel convolution mental model

Каждый output channel имеет отдельный 3D kernel:

```text
input channel 1 \
input channel 2  → sum responses → output feature map
input channel 3 /
```

Для 16 output channels таких kernels 16.

---

## 19. Depthwise convolution как advanced idea

Обычный Conv mixes spatial и channel information одновременно.

В **depthwise convolution** каждый input channel обрабатывается отдельным spatial filter, а затем 1×1 convolution может смешивать channels.

Это уменьшает compute и используется в efficient architectures.

Для foundation достаточно понимать difference:

```text
standard conv → filters see all input channels
depthwise → spatial filter separately per channel
```

---

## 20. 1×1 convolution

Kernel:

```text
1 × 1
```

не смотрит на spatial neighbors, но смешивает information между channels в каждой position.

Это полезно для:

- changing channel dimension;
- bottlenecks;
- efficient architectures.

То есть convolution — не обязательно «искать edge 3×3».

---

## 21. Пример CNN

```python
import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Conv2d(3, 16, kernel_size=3, padding=1),
    nn.ReLU(),
    nn.Conv2d(16, 32, kernel_size=3, padding=1),
    nn.ReLU(),
)
```

Input:

```text
[8,3,64,64]
```

После первого Conv:

```text
[8,16,64,64]
```

После второго:

```text
[8,32,64,64]
```

Spatial size сохранился из-за padding=1.

---

## 22. Почему `Flatten` обычно появляется ближе к classifier head

Convolution layers сохраняют spatial structure.

Если сразу:

```text
Flatten
→ Linear
```

после первого layer, мы быстро теряем главный inductive bias CNN и создаём много parameters.

Обычно сначала строят feature extractor из нескольких convolution blocks, уменьшают spatial resolution, затем переходят к classification head.

---

## 23. Интерактивная визуализация DataPath

### Режим 1. Kernel sliding

Показать 5×5 image и 3×3 kernel.

Пользователь нажимает:

```text
Следующая position
```

Видит element-wise multiplication и sum.

### Режим 2. Stride / Padding

Sliders:

```text
kernel
stride
padding
```

Output shape пересчитывается в реальном времени.

### Режим 3. Learned filters

Показать несколько filters:

```text
edge-like
texture-like
```

как intuition, но отдельно отметить, что real model сама их учит.

### Режим 4. Parameter comparison

```text
Flatten + Linear
vs
Conv2d
```

Показать parameter count.

---

## 24. Типичные ошибки

**«Convolution kernel фиксирован вручную».**\
В CNN он learnable.

**«Каждая position имеет свои weights».**\
Нет, weights shared.

**«Output channels = input channels».**\
Не обязательно.

**«Padding всегда нужен».**\
Нет, зависит от architecture.

**«CNN полностью invariant к object position».**\
Нет, convolution прежде всего translation-equivariant.

**«Conv2d работает с shape [batch,height,width,channels] по default».**\
PyTorch обычно ожидает `[N,C,H,W]`.

---

## 25. Проверка понимания

1. Почему Flatten+Linear дорог?
2. Что делает convolution filter?
3. Что такое feature map?
4. Что значит weight sharing?
5. Что делает stride?
6. Что делает padding?
7. Shape input PyTorch Conv2d?
8. Сколько parameters `Conv2d(3,16,3)` с bias?
9. Почему нужен ReLU?
10. Что значит translation equivariance?

---

## 26. Мини-практика

Input:

```text
[32, 3, 64, 64]
```

Layer:

```python
nn.Conv2d(
    3,
    24,
    kernel_size=5,
    stride=2,
    padding=2,
)
```

Ответьте:

1. output channels;
2. spatial output size;
3. weight shape;
4. число weights;
5. зачем padding=2;
6. что изменится при stride=1.

---

## 27. Что нужно унести

1. CNN использует local connectivity.
2. Kernel weights обучаются.
3. Один filter применяется ко многим positions.
4. Weight sharing резко уменьшает parameters.
5. Output filter создаёт feature map.
6. PyTorch Conv2d использует `[N,C,H,W]`.
7. Stride и padding управляют geometry.
8. Convolution translation-equivariant.
9. Activation делает composition nonlinear.
10. Следующий вопрос — как layers постепенно увеличивают receptive field и уменьшают resolution.

## Куда дальше

Один 3×3 filter видит только маленький patch.

Но classifier в итоге должен понимать object целиком.

Следующий урок покажет:

> как stacking convolution layers увеличивает **поле восприятия (receptive field)**, зачем нужен pooling и как из простых local patterns строится CNN hierarchy.

## Источники
- PyTorch official `nn.Conv2d` documentation.
- PyTorch computer vision tutorials.
