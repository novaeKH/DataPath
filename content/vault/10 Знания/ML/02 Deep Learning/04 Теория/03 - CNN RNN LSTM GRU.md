---
title: "CNN, RNN, LSTM и GRU"
tags:
  - deep-learning
  - theory
  - interview
type: source
area: dl
status: active
rag: exclude
id: source.dl.cnn-rnn-lstm-i-gru
schema_version: 2
language: ru
app: exclude
---
# CNN, RNN, LSTM и GRU

> [!tip] Закрепление
> После этой заметки: [[10 Знания/ML/02 Deep Learning/05 Тренажер/01 - Фундамент и обучение]].

## 8. CNN и компьютерное зрение — достаточный уровень для DS/LLM

### 8.1. Свёртка

Вход обычно имеет форму `(B, C_in, H, W)`, выход — `(B, C_out, H_out, W_out)`.

Для dilation $D$:

$$
H_{out}=
\left\lfloor
\frac{H+2P-D(K-1)-1}{S}+1
\right\rfloor.
$$

Аналогично для ширины.

Число параметров `Conv2d` с bias:

$$
C_{out}(C_{in}K_hK_w+1).
$$

Число MACs на одно изображение:

$$
H_{out}W_{out}C_{out}C_{in}K_hK_w.
$$

Вес ядра переиспользуется во всех пространственных позициях: это даёт локальность и меньше параметров, чем полносвязный слой.

```python
image_batch = torch.randn(8, 3, 32, 32)
convolution = nn.Conv2d(
    in_channels=3,
    out_channels=16,
    kernel_size=3,
    stride=2,
    padding=1,
)
feature_maps = convolution(image_batch)

print("Input:", image_batch.shape)
print("Output:", feature_maps.shape)
print("Parameters:", sum(p.numel() for p in convolution.parameters()))
```

### 8.2. Padding, stride и pooling

- padding управляет границами и размером карты;
- stride уменьшает пространственное разрешение;
- max pooling берёт максимум в окне;
- average/global average pooling усредняет.

Для обычного pooling:

$$
H_{out}=
\left\lfloor\frac{H+2P-K}{S}+1\right\rfloor.
$$

Pooling не имеет обучаемых параметров. В современных архитектурах downsampling часто делают свёрткой со stride.

### 8.3. Архитектуры

- **AlexNet:** исторически показала силу глубоких CNN, ReLU, GPU, Dropout.
- **VGG:** последовательность маленьких `3×3` свёрток; проста, но тяжёлая.
- **ResNet:** residual block

$$
  y=F(x)+x
$$

  создаёт короткий путь для сигнала и градиента, облегчая обучение глубокой сети.

### 8.4. Transfer learning

1. Берём pretrained backbone.
2. Заменяем head под новую задачу.
3. Сначала обучаем head с замороженным backbone.
4. При необходимости размораживаем верхние слои и fine-tune с меньшим LR.

Чем сильнее новый домен отличается от исходного и чем больше данных, тем больше слоёв имеет смысл дообучать.

### 8.5. Задачи CV и метрики

| Задача | Выход | Метрики |
|---|---|---|
| Классификация | класс изображения | accuracy, F1, ROC/PR-AUC |
| Детекция | boxes + classes + scores | AP/mAP |
| Семантическая сегментация | класс каждого пикселя | IoU, Dice |

Intersection over Union:

$$
IoU=\frac{|A\cap B|}{|A\cup B|}.
$$

Dice:

$$
Dice=\frac{2|A\cap B|}{|A|+|B|}.
$$

**NMS** удаляет сильно пересекающиеся boxes с меньшим score. **AP** — площадь под precision–recall curve для класса при заданном правиле совпадения. **mAP** усредняет AP по классам; в COCO также по IoU-порогам 0.50:0.95.

Типичные аугментации: flip/crop/rotate, изменение яркости/контраста, blur/noise, cutout/mixup. Их применяют только к train и только если преобразование сохраняет смысл target. Для детекции/сегментации геометрические преобразования должны синхронно менять boxes/masks.

#### Проверь себя

`Conv2d(3, 32, kernel_size=3, stride=1, padding=1)` получает `(16, 3, 64, 64)`.

- Какова форма выхода?
- Сколько параметров с bias?
- Почему ResNet помогает градиенту?

<details>
<summary><b>Ответ</b></summary>

Выход `(16, 32, 64, 64)`. Параметров $32(3\cdot3\cdot3+1)=896$. Residual path позволяет сигналу и градиенту проходить через тождественное соединение, не полагаясь только на длинную цепочку преобразований.

</details>

## 9. RNN, LSTM и GRU

### 9.1. RNN

Последовательность `(B, T, D)` обрабатывается по шагам:

$$
h_t=\tanh(W_xx_t+W_hh_{t-1}+b).
$$

Одни и те же веса используются на всех шагах. Скрытое состояние несёт информацию о прошлом, но длинная цепочка приводит к vanishing/exploding gradients и не позволяет полноценно параллелить обработку по времени.

### 9.2. LSTM

LSTM добавляет cell state и гейты:

- forget gate — что забыть;
- input gate — что записать;
- output gate — что вывести.

Аддитивное обновление cell state облегчает перенос градиента на длинные расстояния.

### 9.3. GRU

GRU объединяет часть механизмов LSTM, использует update/reset gates, не имеет отдельного cell state. Обычно параметров меньше; универсально лучшего варианта нет.

**Bidirectional RNN** видит левый и правый контекст, поэтому полезна для классификации/разметки целой последовательности, но не подходит как causal autoregressive generator.

```python
sequence_batch = torch.randn(4, 7, 12)  # B, T, input_size
lstm = nn.LSTM(
    input_size=12,
    hidden_size=20,
    num_layers=2,
    batch_first=True,
)

all_states, (last_hidden, last_cell) = lstm(sequence_batch)

print("All states:", all_states.shape)   # B, T, H
print("Last hidden:", last_hidden.shape) # layers, B, H
print("Last cell:", last_cell.shape)
```

#### Проверь себя

Почему LSTM лучше обычной RNN удерживает длинные зависимости? Почему Transformer обычно быстрее обучается на длинных последовательностях?

<details>
<summary><b>Ответ</b></summary>

LSTM использует управляемый аддитивный путь cell state, поэтому градиенту не нужно проходить только через длинную цепочку матричных умножений и tanh. Transformer при обучении вычисляет состояния всех позиций параллельно; RNN обязана дождаться предыдущего состояния.

</details>

Вернуться: [[10 Знания/ML/02 Deep Learning/04 Теория/00 - Карта теории]].
