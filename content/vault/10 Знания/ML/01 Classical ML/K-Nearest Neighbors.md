---
title: K-Nearest Neighbors
id: concept.ml.k-nearest-neighbors
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
- KNN
- Метод ближайших соседей
tags:
- ml/classical
- ml/distance
math_depth: 1
---

# K-Nearest Neighbors

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

## Когда использовать

- маленький датасет, где нужен простой interpretable baseline;
- граница классов сложная, но данных достаточно для покрытия пространства;
- задачи recommendation/похожесть объектов (nearest neighbors как сервис);
- НЕ использовать при многих признаках (curse of dimensionality), при чувствительности к масштабу без preprocessing и когда важна скорость предсказания на большом объёме.

## Визуализация

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

## Связи

- [[NumPy Indexing Broadcasting and Vectorization]]
- [[Principal Component Analysis]]
- [[Data Preprocessing and Feature Engineering]]
- [[Validation Splits and Data Leakage]]
