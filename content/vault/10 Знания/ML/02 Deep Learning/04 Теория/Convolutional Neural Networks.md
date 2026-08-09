---
title: Convolutional Neural Networks
id: concept.dl.convolutional-neural-networks
type: concept
area: dl
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- CNN
- Свёрточные нейронные сети
tags:
- dl/cnn
- computer-vision
math_depth: 2
---

# Convolutional Neural Networks

## Почему не обычный Linear

Image содержит spatial structure. Полносвязный layer для изображения `224×224×3` имеет слишком много parameters и не использует locality. Convolution применяет один kernel во всех positions.

## Convolution

Для каждого output position kernel вычисляет weighted sum local patch. Parameters sharing позволяет обнаруживать pattern независимо от location.

Числовой пример для patch $2\times2$: пусть patch равен `[[1, 2], [0, 3]]`, а
kernel — `[[1, 0], [-1, 1]]`. Поэлементное произведение даёт
`1·1 + 2·0 + 0·(-1) + 3·1 = 4`. Это одно число feature map. Затем kernel
сдвигается на stride и повторяет тот же расчёт. Во время обучения backprop
меняет четыре веса kernel так, чтобы нужные локальные patterns усиливали
правильный класс.

Input PyTorch:

```text
(B, C_in, H, W)
```

Conv2d output:

```text
(B, C_out, H_out, W_out)
```

## Output size

Для одного dimension:

$$
H_{out}=\left\lfloor\frac{H+2P-D(K-1)-1}{S}+1\right\rfloor.
$$

$K$ kernel, $S$ stride, $P$ padding, $D$ dilation.

## Channels и filters

Каждый output channel имеет kernel по всем input channels. Early filters часто реагируют на edges/textures, deeper features — на более сложные combinations, но интерпретация не гарантирована.

## Receptive field

Stack convolutions увеличивает область input, влияющую на activation. Большой receptive field нужен для global context.

## Pooling и stride

Max/average pooling или strided convolution уменьшают spatial size. Downsampling экономит compute, но может потерять детали.

## Typical block

```python
block = torch.nn.Sequential(
    torch.nn.Conv2d(3, 32, kernel_size=3, padding=1),
    torch.nn.BatchNorm2d(32),
    torch.nn.ReLU(),
    torch.nn.MaxPool2d(2),
)
```

## Transfer learning

Pretrained backbone часто лучше обучения с нуля на малом dataset. Заменяют head, сначала freeze часть layers, затем fine-tune с малым lr. Normalization inputs должна соответствовать pretrained model.

## Augmentation

Допустимые transforms должны сохранять label. Horizontal flip нормален не для всех domains; aggressive crop может удалить target object.

## Визуализация

Компонент `cnn-kernel-feature-map-lab`:

- small image grid;
- draggable kernel;
- convolution output;
- stride/padding;
- multiple channels;
- pooling;
- receptive field expansion.

## Частые ошибки

- HWC вместо CHW;
- забыть batch axis;
- неверная normalization pretrained model;
- augmentation меняет label;
- flatten dimension hard-coded;
- слишком быстрый downsampling;
- data leakage через near-duplicate images одного patient/user.

## Self-check и собеседование

- Почему sharing weights резко уменьшает число параметров относительно Linear?
- Как padding влияет на spatial size и информацию у границ?
- Почему pooling повышает устойчивость к небольшому сдвигу, но может потерять детали?
- Что изменится в output, если увеличить stride с 1 до 2?

Практика: вручную вычислите feature map для матрицы $3\times3$ и kernel
$2\times2$, затем проверьте результат через `torch.nn.functional.conv2d`.

## Связи

- [[Tensors Shapes and Linear Layers]]
- [[Training Evaluation and Inference in PyTorch]]
- [[Fine-Tuning Transfer Learning and PEFT]]
