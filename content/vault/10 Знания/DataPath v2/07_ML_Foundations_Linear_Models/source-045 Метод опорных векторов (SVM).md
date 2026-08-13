---
title: "Метод опорных векторов (SVM)"
id: concept.datapath-v2.045
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 45
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Метод опорных векторов: максимальный зазор, support vectors и kernel trick

Представим бинарную classification, где классы можно разделить прямой.

Проблема: таких прямых может быть много.

```text
класс A     |     класс B
```

Логистическая регрессия выбирает coefficients через logloss. Метод опорных векторов (Support Vector Machine, SVM) ставит другой геометрический вопрос:

> **Какая разделяющая граница оставит максимально широкий безопасный зазор между классами?**

Эта идея приводит к margin, support vectors, параметру `C` и затем к kernel trick, позволяющему строить нелинейные boundaries.

## 1. Линейная граница

Для features `x`:

\[
f(x)=w^Tx+b.
\]

Classification по знаку:

```text
f(x) > 0 → class +1
f(x) < 0 → class -1
```

Boundary:

\[
w^Tx+b=0.
\]

Это такая же гиперплоскость, как у linear classifiers.

Но SVM выбирает её по margin principle.

## 2. Что такое margin

Представим две параллельные линии вокруг decision boundary, проходящие через ближайшие training points разных классов.

Расстояние между ними — **зазор (margin)**.

SVM хочет сделать его максимально большим.

Интуиция:

```text
узкий margin
→ небольшое движение point может сменить class

широкий margin
→ boundary устойчивее к небольшим вариациям
```

Это не магическая гарантия качества, но сильный regularization principle.

## 3. Support vectors

Интересная особенность: boundary в основном определяется training points, лежащими ближе всего к margin.

Их называют **опорными векторами (support vectors)**.

Далёкий от границы объект часто можно немного сдвинуть, и решение не изменится.

Но сдвиг support vector способен изменить optimal boundary.

Отсюда название метода.

![Учебная иллюстрация: SVM и максимальный зазор. Margin-линии и support vectors показывают, какие точки определяют границу.](content-assets/datapath-v2/figures/45_svm.png "Margin-линии и support vectors показывают, какие точки определяют границу.")

## 4. Hard-margin SVM

Если данные идеально linearly separable, можно потребовать:

\[
y_i(w^Tx_i+b)\ge1.
\]

и минимизировать:

\[
\frac12\|w\|^2.
\]

Почему уменьшение `||w||` связано с большим margin? Геометрически width margin обратно пропорционален норме `w`.

То есть:

```text
minimize ||w||
↔ maximize margin
```

Но реальные данные почти никогда не разделяются идеально.

## 5. Soft margin

Если есть noise и overlapping classes, требование zero errors слишком жёсткое.

Вводятся slack variables, позволяющие некоторым points нарушать margin или даже быть misclassified.

Objective можно представить как компромисс:

\[
\frac12\|w\|^2 + C\sum_i\xi_i.
\]

Первая часть хочет широкий margin.

Вторая штрафует нарушения.

## 6. Что делает `C`

Очень важный hyperparameter.

### Большой `C`

Ошибки/violations дороги.

Модель старается классифицировать train максимально строго:

```text
margin может стать уже
boundary гибче к конкретным points
variance может вырасти
```

### Маленький `C`

Нарушения дешевле.

```text
margin шире
больше train mistakes допускается
regularization сильнее
```

Как и в sklearn LogisticRegression:

> **маленький `C` обычно означает более сильную regularization.**

## 7. Hinge loss

Linear SVM часто связывают с hinge loss:

\[
L_i=\max(0,1-y_if(x_i)).
\]

Если объект правильно классифицирован и находится достаточно далеко за margin:

```text
loss = 0
```

Если внутри margin или с неправильной стороны:

```text
loss > 0
```

Это отличается от logloss Logistic Regression: SVM не стремится постоянно делать probability всё увереннее для уже хорошо расположенных points.

## 8. Logistic Regression vs Linear SVM

Обе могут строить linear boundary.

### Logistic Regression

Оптимизирует probabilistic logloss и естественно выдаёт probability estimates.

### SVM

Оптимизирует margin-based objective и выдаёт decision score.

Если важны calibrated probabilities, Logistic Regression часто проще.

Если важна maximum-margin linear classification, SVM может быть сильным candidate.

## 9. Scaling для SVM критичен

SVM использует distances/dot products и regularization weights.

Если feature A:

```text
0–1
```

а feature B:

```text
0–1 000 000
```

геометрия пространства и penalty будут искажены scale.

Практический pipeline:

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

model = make_pipeline(
    StandardScaler(),
    SVC(C=1.0, kernel="rbf"),
)
```

Scaler обязательно fit только на train folds.

## 10. Когда linear boundary недостаточно

Представьте classes в форме concentric circles:

```text
центр → class A
кольцо → class B
```

Никакая прямая их не разделит.

Можно вручную добавить nonlinear features. Но SVM предлагает более общий инструмент — kernels.

## 11. Kernel trick: основная идея

Представим transformation:

\[
\phi(x)
\]

в новое feature space, где classes становятся linearly separable.

Наивно можно было бы явно считать все новые coordinates.

Kernel позволяет вычислять inner product:

\[
K(x,z)=\langle\phi(x),\phi(z)\rangle
\]

без явного построения `φ(x)`.

Это и есть **kernel trick**.

SVM работает через pairwise similarities, выраженные kernel function.

## 12. RBF kernel

Популярный RBF kernel:

\[
K(x,z)=\exp(-\gamma\|x-z\|^2).
\]

Если points близки:

```text
K ≈ 1
```

если далеко:

```text
K ≈ 0
```

SVM может собрать nonlinear decision boundary из локальных similarity relationships.

## 13. Что делает gamma

В RBF:

\[
\exp(-\gamma distance^2).
\]

### Маленькая `gamma`

Влияние одного training point распространяется далеко.

Boundary получается более гладкой.

### Большая `gamma`

Similarity быстро исчезает с distance.

Каждый point влияет локально.

Boundary может стать очень извилистой и переобучиться.

Поэтому `C` и `gamma` подбирают совместно.

## 14. Интуитивная карта C × gamma

```text
small C + small gamma
→ сильная regularization, smooth boundary
→ risk underfit

large C + large gamma
→ локальная сложная boundary
→ risk overfit
```

Но это не точная формула качества — validation decides.

## 15. Polynomial kernel

Пример:

\[
K(x,z)=(\gamma x^Tz+c)^d.
\]

Позволяет учитывать polynomial interactions определённой степени.

В современном tabular ML RBF/linear candidates встречаются чаще, но polynomial kernel полезен для понимания kernel idea.

## 16. Что происходит при `fit()` SVC

Концептуально solver ищет support vectors и coefficients, удовлетворяющие soft-margin optimization.

После fit хранится подмножество support vectors, а prediction определяется через их contributions и kernel similarities.

Это отличает SVC от kNN:

- kNN может использовать весь train neighborhood;
- SVM boundary определяется support vectors.

## 17. `SVC` и `LinearSVC` — не одно и то же

### `SVC`

LibSVM-based implementation.

Поддерживает kernels:

```text
linear
rbf
poly
sigmoid
precomputed
```

Но training complexity плохо масштабируется с большим числом samples. В официальной документации SVC/SVR подчёркивается, что kernel implementations могут становиться тяжёлыми уже на десятках тысяч объектов в зависимости от задачи.

### `LinearSVC`

Специализирован под linear SVM и лучше масштабируется на большие sparse/high-dimensional datasets.

Если kernel не нужен и features очень много, `LinearSVC` часто логичнее.

## 18. Probability estimates

`SVC` не является probability model в том же смысле, что Logistic Regression.

По умолчанию:

```python
SVC(probability=False)
```

`predict_proba` недоступен.

Если включить:

```python
SVC(probability=True)
```

fit становится заметно дороже: libsvm выполняет дополнительную probability calibration procedure; документация sklearn указывает внутреннюю 5-fold CV для этой оценки.

Поэтому не включайте probability автоматически, если нужен только decision score/ROC-AUC.

## 19. `decision_function`

```python
scores = model.decision_function(X_valid)
```

выдаёт continuous score относительно decision boundary.

Для ranking metrics вроде ROC-AUC probability не обязательна — часто достаточно decision score.

## 20. Multiclass

Kernel `SVC` внутри обучает pairwise one-vs-one classifiers между классами, а затем строит multiclass decision.

`decision_function_shape` может представлять output в удобной OvR форме, но underlying training strategy libsvm остаётся pairwise.

Для начального понимания важнее binary geometry.

## 21. Почему SVM не всегда первый выбор на современных tabular data

SVM остаётся фундаментальным и полезным методом, но на больших heterogeneous tabular datasets tree boosting часто удобнее:

- нативнее работает с nonlinear interactions;
- меньше требует scaling;
- легче справляется с mixed structure после подходящего preprocessing;
- обычно лучше масштабируется в популярных implementations.

Но SVM всё ещё силён:

- на medium-sized datasets;
- в high-dimensional sparse spaces;
- при хорошей margin structure;
- когда нужен strong linear/kernel baseline.

## 22. Реальный code example

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV

pipeline = make_pipeline(
    StandardScaler(),
    SVC(kernel="rbf"),
)

params = {
    "svc__C": [0.1, 1, 10],
    "svc__gamma": ["scale", 0.01, 0.1],
}

search = GridSearchCV(
    pipeline,
    params,
    cv=5,
    scoring="roc_auc",
)

search.fit(X_train, y_train)
```

Смысл Pipeline здесь особенно важен: scaling fit внутри CV fold.

## 23. Failure modes

### Без scaling

Geometry dominated by large-scale features.

### C слишком большое

Boundary пытается слишком строго удовлетворить train.

### gamma слишком большая

RBF boundary становится локальной и шумной.

### Очень много samples

Kernel SVC становится дорогим.

### Очень много noisy features

Similarity geometry ухудшается.

### Leakage

SVM не защищает от неверной experimental design.

## 24. Интерактивная визуализация

### Сцена 1: margin

2D linearly separable points.

Пользователь двигает boundary. Показывать width margin и ближайшие support vectors.

Кнопка:

```text
Показать maximum-margin boundary
```

### Сцена 2: C

Добавить noisy outlier.

Slider `C` показывает:

- small C → wider margin, violation allowed;
- large C → boundary изгибается/сдвигается ради train point.

### Сцена 3: RBF gamma

Nonlinear circles dataset.

Slider `gamma`:

- small → smooth underfit;
- medium → useful boundary;
- huge → islands around points.

## 25. Типичные ошибки

**«SVM всегда линейный».**\
Kernel SVM может строить nonlinear boundary.

**«Support vector — любой train object».**\
Нет, это points, активно определяющие margin/solution.

**«C больше → regularization сильнее».**\
Обычно наоборот.

**«gamma — то же самое, что C».**\
Нет: gamma управляет locality RBF kernel.

**«SVC обязательно выдаёт probabilities».**\
Нет, probability disabled by default.

**«Scaling не нужен, ведь kernel всё сделает».**\
Неверно. Kernel distance geometry крайне чувствительна к scale.

**«Kernel trick явно создаёт миллионы features».**\
Смысл trick как раз в вычислении inner products без явного формирования feature map.

## 26. Проверка понимания

1. Что такое margin?
2. Почему support vectors важнее далёких points?
3. Чем hard margin отличается от soft margin?
4. Что делает C?
5. Что такое hinge loss?
6. Почему scaling критичен?
7. В чём идея kernel trick?
8. Что делает gamma в RBF?
9. Чем SVC отличается от LinearSVC?
10. Зачем `decision_function`?
11. Почему `probability=True` делает fit дороже?
12. Когда kernel SVM может переобучиться?

## 27. Мини-практика

RBF SVM имеет:

```text
Model A: C=0.1, gamma=0.001
Model B: C=10, gamma=1
```

На train/validation:

```text
A: 0.75 / 0.74 ROC-AUC
B: 0.99 / 0.79 ROC-AUC
```

1. Какая выглядит более flexible?
2. У какой больше train–validation gap?
3. Как изменение gamma влияет на locality?
4. Что попробовать между A и B?
5. Почему нельзя выбрать модель только по train?
6. Как изменится план, если samples = 2 000 000 и features sparse?

## Что нужно унести

1. Linear SVM ищет maximum-margin boundary.
2. Support vectors определяют решение сильнее остальных points.
3. Soft margin разрешает нарушения ради generalization.
4. Маленький C означает более сильную regularization.
5. Hinge loss штрафует points внутри/за неправильной стороной margin.
6. Scaling для SVM критичен.
7. Kernel trick позволяет nonlinear boundaries через similarity functions.
8. В RBF gamma контролирует locality.
9. SVC и LinearSVC имеют разные scaling properties по размеру dataset.
10. Probability estimates для SVC — отдельная дорогая процедура, не базовая природа SVM.

## Куда дальше

Мы завершили первый большой блок моделей:

```text
Linear Regression
→ regularization
→ Logistic Regression
→ kNN
→ Naive Bayes
→ SVM
```

Следующая группа методов меняет сам способ представления prediction function: вместо глобальной формулы или distance rule строится последовательность условий `if/else`.

Это **решающие деревья (Decision Trees)** — начало блока Trees & Boosting.

### Источники

- scikit-learn User Guide — Support Vector Machines.
- scikit-learn API — SVC, LinearSVC, RBF kernel.
- Yandex ML Handbook — линейные модели / SVM.
- Stanford CS229 — maximum margin classifiers and kernels.
