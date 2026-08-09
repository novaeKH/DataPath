---
title: K-Means
id: concept.ml.k-means
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- K-means clustering
- Метод k средних
tags:
- ml/classical
- ml/clustering
math_depth: 2
---


**Рекомендуемое время:** 50–65 минут.

## Результаты обучения
- понимать локальное голосование/усреднение
- выбирать distance и K
- объяснять необходимость scaling
- понимать curse of dimensionality и стоимость inference

## Вход в тему

KNN почти ничего не «обучает»: он хранит train и ищет похожие объекты во время prediction. Поэтому вся сила и все проблемы алгоритма находятся в определении сходства.

## Полная теория

## Интуиция

Чтобы предсказать ответ для нового объекта, найдём $K$ наиболее похожих train-объектов. Для classification используем голосование, для regression — среднее или weighted mean.

KNN почти не строит параметрическую модель во время fit: основная работа происходит при prediction.

## Алгоритм

Для объекта $x$:

1. вычислить distance до train points;
2. выбрать $K$ smallest distances;
3. агрегировать их targets.

Classification:

$$
\widehat y=\operatorname{mode}\{y_i:i\in N_K(x)\}.
$$

Regression:

$$
\widehat y=\frac{1}{K}\sum_{i\in N_K(x)}y_i.
$$

Weighted variant даёт больший вес близким neighbors.

## Distance

Euclidean:

$$
d(x,z)=\sqrt{\sum_j(x_j-z_j)^2}.
$$

Manhattan:

$$
d_1(x,z)=\sum_j|x_j-z_j|.
$$

Выбор distance определяет понятие сходства. Для text cosine часто полезнее Euclidean raw counts. Для mixed data нужна осознанная representation.

## Почему scaling критичен

Если income измеряется тысячами, а age десятками, income доминирует distance. StandardScaler/RobustScaler fit только на train.

Scaling не решает проблему бессмысленного feature: шумовая колонка всё равно портит соседство.

## Выбор K

- малое $K$ → гибкая boundary, low bias, high variance;
- большое $K$ → smoother prediction, выше bias;
- $K$ выбирают по CV;
- odd $K$ может уменьшить ties в binary classification, но не является обязательным правилом.

## Curse of dimensionality

С ростом dimensions distances становятся похожими: ближайший и дальний объект различаются меньше. Data становится sparse, нужно экспоненциально больше observations.

Помогают:

- feature selection;
- PCA/embedding;
- domain metric;
- больше данных;
- другая model family.

## Categorical и missing values

Raw KNN не понимает категории. OHE увеличивает dimension; ordinal integer encoding создаёт ложный порядок. Missing values требуют imputation или distance, умеющей их учитывать.

## Classification probabilities

Доля positive among neighbours может использоваться как score, но имеет discrete steps и не обязательно calibrated. Weighting и K влияют на smoothness.

## Complexity

Naive prediction:

- memory $O(nd)$;
- time на один query $O(nd)$.

KD-tree/ball-tree помогают в low/moderate dimensions, но теряют преимущество в high-dimensional data. Approximate nearest neighbours используют для больших embedding collections.

## Визуальная демонстрация

Компонент `knn-neighbourhood-lab`:

- draggable query point;
- slider $K$;
- Euclidean/Manhattan;
- scaling toggle;
- highlighted neighbours;
- decision background;
- noisy feature toggle.

## sklearn pipeline

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

model = Pipeline([
    ("scale", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=7, weights="distance")),
])
```

## Частые ошибки

- не scaling;
- выбирать K на test;
- добавлять десятки irrelevant features;
- использовать integer category codes;
- считать KNN «обучением без параметров» и забывать про preprocessing;
- ожидать быстрый inference на миллионах объектов;
- интерпретировать neighbors без проверки distance semantics.

## Обязательная визуальная демонстрация

2D-точки, query point, K, metric и scaling toggle; подсвечиваются соседи и меняется boundary.

## Практика

#### Задание 1. Scaling

Почему признаки age=[18,80] и income=[20 000,500 000] нельзя напрямую использовать в Euclidean distance?

#### Задание 2. K

Что произойдёт с bias и variance при увеличении K?

#### Задание 3. Distance

Когда cosine distance уместнее Euclidean?

#### Задание 4. Python lab

Pipeline StandardScaler + KNN; подбери K по CV и построй curve.

## Разбор практики

**1.** Income доминирует из-за масштаба, даже если age важнее по смыслу.

**2.** Boundary сглаживается: variance снижается, bias растёт.

**3.** Для направлений/разреженных text vectors, где magnitude менее важна, чем orientation.

**4.** Scaler fit внутри fold; K выбирается по validation, не test.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Почему KNN страдает в high dimensions?

- A. Нет labels
- B. Distances становятся менее различимыми
- C. Не поддерживает числа
- D. Всегда linear

**Правильный ответ:** B

**Объяснение:** Пространство разрежается, а близость теряет информативность.

#### Checkpoint 2

**Вопрос:** Малое K обычно означает...

- A. High bias, low variance
- B. Low bias, high variance
- C. Нет decision boundary
- D. Обязательную calibration

**Правильный ответ:** B

**Объяснение:** Модель становится локальной и чувствительной к noise.

#### Checkpoint 3

**Вопрос:** Где происходит основная вычислительная стоимость KNN?

- A. Только fit
- B. Prediction
- C. YAML parsing
- D. Calibration

**Правильный ответ:** B

**Объяснение:** Нужно искать соседей среди train objects.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
