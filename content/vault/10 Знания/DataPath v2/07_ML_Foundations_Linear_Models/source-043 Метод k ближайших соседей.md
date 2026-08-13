---
title: "Метод k ближайших соседей"
id: concept.datapath-v2.043
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 43
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Метод k ближайших соседей: когда модель почти ничего не «обучает»

Линейная и логистическая регрессии строили одну глобальную формулу для всего пространства признаков.

Метод k ближайших соседей (k-Nearest Neighbors, kNN) мыслит иначе:

> **Новый объект, вероятно, похож на объекты, которые находятся рядом с ним в пространстве признаков.**

Алгоритм не ищет коэффициенты и не строит дерево. В простейшем варианте он сохраняет train data, а во время prediction ищет ближайшие объекты и агрегирует их ответы.

Из-за этого kNN особенно полезен как модель для понимания расстояний, scaling, локальности и проклятия размерности.

## 1. Классификация на маленьком примере

Есть объекты с двумя признаками:

```text
x1 = доход
x2 = возраст
```

и класс:

```text
0 = продукт не купил
1 = купил
```

Для нового клиента ищем, например, `k=3` ближайших train points.

Если их labels:

```text
1, 1, 0
```

большинство — класс `1`, поэтому kNN предсказывает `1`.

В классификации базовая идея:

\[
\hat y = \operatorname{mode}\{y_i: x_i \in N_k(x)\}.
\]

Где `N_k(x)` — множество k ближайших соседей объекта.

## 2. Регрессия

Для regression labels соседей — числа.

Например три ближайших квартиры имеют цены:

```text
9.5
10.0
10.6
```

Простой prediction:

\[
\hat y = \frac{9.5 + 10.0 + 10.6}{3} \approx 10.03.
\]

`KNeighborsRegressor` в базовом режиме именно агрегирует соседние target values.

## 3. Что значит «ближайший»

Нужна **метрика расстояния (distance metric)**.

Самая знакомая — Euclidean distance:

\[
d(x,z)=\sqrt{\sum_j(x_j-z_j)^2}.
\]

Для двух признаков это обычное расстояние на плоскости.

Пример:

```text
A = (1, 2)
B = (4, 6)
```

\[
d(A,B)=\sqrt{(4-1)^2+(6-2)^2}=5.
\]

Также существуют Manhattan/Minkowski и другие distances. Главное — понимать, что выбор distance определяет смысл «похожести».

## 4. Почему scaling здесь критичен

Признаки:

```text
age: 20–70
income: 30 000–1 000 000
```

Без scaling Euclidean distance почти полностью определяется `income`, просто потому что числа намного больше.

Разница:

```text
age: +20
income: +200 000
```

в квадрате превращает доход в доминирующую координату.

Поэтому kNN обычно требует scaling:

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

model = make_pipeline(
    StandardScaler(),
    KNeighborsClassifier(n_neighbors=5),
)
```

Scaler должен быть внутри Pipeline, чтобы fit происходил только на training portion.

## 5. Что делает параметр k

### Маленькое k

При `k=1` prediction определяется одним ближайшим объектом.

Плюсы:

- очень локальная boundary;
- может ловить мелкую структуру.

Минусы:

- чувствительность к шуму;
- высокий variance;
- один mislabeled point способен изменить prediction.

### Большое k

Используется больше соседей.

Плюсы:

- noise усредняется;
- boundary сглаживается.

Минусы:

- локальная структура теряется;
- bias растёт.

Получаем уже знакомый bias–variance trade-off.

![Учебная иллюстрация: k ближайших соседей. Query point, ранжированные соседи и изменение голосования при разных k.](content-assets/datapath-v2/figures/43_knn.png "Query point, ранжированные соседи и изменение голосования при разных k.")

## 6. Числовой пример выбора k

Пусть у нового объекта ближайшие labels по порядку расстояния:

```text
1, 0, 0, 1, 1, 1, 0
```

`k=1`:

```text
prediction = 1
```

`k=3`:

```text
1,0,0 → prediction = 0
```

`k=5`:

```text
1,0,0,1,1 → prediction = 1
```

Одно изменение k меняет decision. Поэтому `n_neighbors` — hyperparameter и выбирается по CV, а не по правилу «всегда 5».

## 7. Веса соседей

Обычный вариант:

```text
weights = "uniform"
```

каждый сосед имеет одинаковый вес.

Но объект в расстоянии `0.1` интуитивно может быть важнее объекта в расстоянии `5.0`.

В sklearn:

```python
KNeighborsClassifier(
    n_neighbors=7,
    weights="distance",
)
```

Ближайшие points получают больший вклад.

Это может быть полезно при неоднородной плотности данных, но всё равно требует validation.

## 8. Что происходит в `fit()`

Это важный контраст с предыдущими моделями.

Для kNN `fit()` в основном:

```text
проверяет данные
→ сохраняет training points и labels
→ при необходимости строит структуру для быстрого поиска соседей
```

Модель не учит набор коэффициентов, описывающих global rule.

Поэтому kNN называют **instance-based** или non-parametric/non-generalizing методом в смысле, что prediction сильно опирается на сохранённые training instances.

## 9. Цена переносится с обучения на prediction

У linear model после fit prediction очень дешёвый:

```text
matrix multiplication
```

У kNN во время prediction нужно найти neighbors среди train data.

При большом dataset это дорого по:

- времени;
- памяти.

Поэтому kNN может быть прекрасен для небольшого учебного/прикладного dataset и неудобен для low-latency сервиса с миллионами train objects.

## 10. Поиск соседей: brute force, KD Tree, Ball Tree

Scikit-learn поддерживает несколько подходов:

```text
brute
kd_tree
ball_tree
auto
```

`algorithm="auto"` пытается подобрать подходящий search method.

Не нужно глубоко изучать data structures, чтобы пользоваться kNN, но важно понимать:

> `fit()` иногда строит индекс, чтобы ускорить будущий neighbor search.

Эффективность KD/Ball trees зависит от dimensionality и geometry данных. В высокой размерности преимущества структур могут исчезать.

## 11. Проклятие размерности

В 2D точки легко различаются по расстоянию.

Но когда признаков сотни или тысячи, расстояния между объектами начинают вести себя менее информативно: пространство становится разреженным, а «ближайший» сосед может оказаться не очень близким в содержательном смысле.

Это часть **проклятия размерности (curse of dimensionality)**.

Практически:

- kNN хуже чувствует локальность в high-dimensional space;
- лишние шумные признаки особенно вредны;
- scaling и feature selection важны;
- для TF-IDF Euclidean kNN часто не первый выбор; cosine similarity/linear models могут быть естественнее.

## 12. Нерелевантные признаки

Представим две полезные coordinates и 50 random-noise features.

Distance учитывает всё.

Даже если noise не связан с target, он меняет neighbor ranking.

Это фундаментальное отличие от модели, которая может обучить маленький coefficient для слабого feature. В kNN сам distance metric заранее решает, как feature участвует в сравнении.

## 13. Категориальные признаки

Обычный Euclidean distance рассчитан на числовое пространство.

Если закодировать категорию:

```text
Moscow = 0
Kazan = 1
Omsk = 2
```

Euclidean distance начнёт считать Omsk «в два раза дальше» от Moscow, чем Kazan — хотя это искусственный порядок.

Поэтому preprocessing категорий для distance-based models требует особой осторожности.

One-hot encoding может быть лучше ordinal encoding, но при большом числе категорий dimensionality резко растёт.

## 14. Decision boundary

kNN способен создавать очень сложные нелинейные границы без явного kernel или polynomial features.

Почему?

Потому что prediction меняется локально в зависимости от состава neighborhood.

При `k=1` boundary может буквально обтекать отдельные training points.

При большем `k` она сглаживается.

## 15. KNN и probability

`KNeighborsClassifier.predict_proba()` может оценивать class probabilities как долю/взвешенную долю классов среди neighbors.

Например при `k=5`:

```text
4 positive
1 negative
```

получаем условно:

```text
P(class=1) = 0.8
```

Но такую величину не стоит автоматически считать идеально откалиброванной вероятностью реального события. Размер neighborhood мал, local density разная, а метод оптимизирован не специально под calibration.

## 16. Реальный код

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_validate

model = make_pipeline(
    StandardScaler(),
    KNeighborsClassifier(
        n_neighbors=7,
        weights="distance",
    ),
)

scores = cross_validate(
    model,
    X,
    y,
    cv=5,
    scoring=["roc_auc", "average_precision"],
)
```

Параметры `k`, `weights` и иногда distance metric сравниваются на одной validation scheme.

## 17. Когда kNN хорош

- dataset небольшой/средний;
- meaningful metric space;
- мало информативных признаков;
- сложная локальная boundary;
- нужен простой non-parametric baseline;
- prediction latency не критична.

## 18. Когда осторожнее

- сотни тысяч/миллионы train objects при tight latency;
- очень высокая dimensionality;
- features имеют несопоставимые масштабы;
- много шумных признаков;
- сложные mixed numerical/categorical data;
- distance плохо отражает смысл similarity.

## 19. Сравнение с Logistic Regression

| | Logistic Regression | kNN |
|---|---|---|
| Идея | global linear score | local neighbors |
| Fit | оптимизирует weights | в основном сохраняет data/index |
| Prediction | дешёвый | может быть дорогим |
| Scaling | обычно нужен | критически нужен |
| Boundary | linear без feature engineering | нелинейная локально |
| High dimension | часто работает хорошо | suffers from curse of dimensionality |
| Interpretability | coefficients | соседние examples |

## 20. Интерактивная визуализация

Показывать 2D dataset и query point.

Controls:

```text
k = 1...25
weights = uniform / distance
scale feature 1 = on/off
```

При изменении k:

- подсвечивать neighbors;
- показывать vote;
- перестраивать decision boundary.

Отдельный режим:

```text
feature 2 scale ×100
```

чтобы пользователь увидел, как без StandardScaler neighbor set полностью меняется.

## 21. Типичные ошибки

**«kNN обучает коэффициенты во время fit».**\
Нет, основная работа происходит при neighbor lookup.

**«k=5 оптимально всегда».**\
Нет, выбирается по CV.

**«Scaling необязателен».**\
Для обычных distance metrics критичен.

**«Больше k всегда уменьшает overfit и улучшает quality».**\
Слишком большое k приводит к high bias.

**«Любой числовой код категории подходит».**\
Ordinal numbers могут создать искусственную distance geometry.

**«Nearest автоматически значит semantically similar».**\
Только если features и distance действительно отражают similarity.

## 22. Проверка понимания

1. Почему kNN называют instance-based методом?
2. Что происходит при `k=1`?
3. Что обычно делает увеличение k с bias/variance?
4. Почему scaling особенно важен?
5. Чем `weights="distance"` отличается от uniform?
6. Почему high-dimensional space труден для kNN?
7. Что плохого в ordinal encoding обычной номинальной категории?
8. Почему fit дешёвый, а predict дорогой?
9. В чём разница между kNN и logistic regression по форме boundary?
10. Когда kNN может быть полезным baseline?

## 23. Мини-практика

Есть два признака:

```text
age: 20–60
annual_spend: 10 000–2 000 000
```

и `KNeighborsClassifier(k=3)` без scaling.

1. Какой feature будет доминировать в Euclidean distance?
2. Что изменит StandardScaler?
3. Что произойдёт с boundary при переходе `k=1 → k=25`?
4. Почему noise features могут ухудшить quality даже после scaling?
5. Какую CV scheme выбрать, если строки принадлежат одним и тем же клиентам?

## Что нужно унести

1. kNN делает prediction по соседним training examples.
2. Distance metric определяет смысл similarity.
3. Scaling для kNN критичен.
4. Маленькое k — гибче и шумнее; большое — стабильнее, но с большим bias.
5. `weights="distance"` усиливает вклад близких neighbors.
6. Fit лёгкий, prediction может быть дорогим.
7. High dimensionality разрушает полезность расстояний.
8. Feature representation особенно важна для distance-based methods.

## Куда дальше

kNN почти не предполагает форму распределения данных — он смотрит на локальных соседей.

Следующая модель идёт в противоположную сторону: задаёт простую вероятностную модель классов и делает сильное предположение о независимости признаков.

Это **наивный Байес (Naive Bayes)**.

### Источники

- scikit-learn User Guide — Nearest Neighbors.
- Yandex ML Handbook — метрические методы.
