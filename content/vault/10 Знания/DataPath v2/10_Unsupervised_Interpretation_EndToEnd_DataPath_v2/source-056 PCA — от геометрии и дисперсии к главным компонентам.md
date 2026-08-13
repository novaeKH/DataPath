---
title: "PCA — от геометрии и дисперсии к главным компонентам"
id: concept.datapath-v2.056
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 56
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# PCA: от геометрии и дисперсии к главным компонентам

Представим dataset с 50 признаками.

Часть features сильно коррелирована:

```text
height_cm
height_m
arm_span
leg_length
```

Формально dimensions много, но реальная структура данных может лежать в пространстве гораздо меньшей размерности.

Метод главных компонент (Principal Component Analysis, PCA) задаёт вопрос:

> **Можно ли повернуть систему координат так, чтобы несколько новых осей объясняли большую часть разброса данных?**

PCA не выбирает «лучшие исходные признаки». Он создаёт **новые признаки** — линейные комбинации старых.

Главная цель урока — увидеть PCA сразу с трёх сторон:

1. геометрия;
2. дисперсия;
3. линейная алгебра.

---

## 1. Почему уменьшение размерности вообще возможно

Представим два features:

```text
height
weight
```

Точки образуют вытянутое диагональное облако.

Если смотреть по исходным axes X и Y, нужны две coordinates.

Но большая часть variation идёт вдоль одной диагональной оси.

Можно повернуть coordinate system:

```text
PC1 → вдоль облака
PC2 → поперёк облака
```

Если spread по PC2 очень маленький, можно приблизительно оставить только PC1.

Мы потеряем немного информации, но уменьшим dimensionality с 2 до 1.

---

## 2. PCA ищет направления максимальной variance

Первая главная компонента (principal component) — direction, вдоль которого projection данных имеет максимальную variance.

Вторая component:

- перпендикулярна первой;
- среди оставшихся orthogonal directions объясняет максимум variance.

И так далее.

Получаем axes:

\[
PC_1,PC_2,\dots
\]

отсортированные по explained variance.

---

## 3. Почему variance здесь трактуется как информация

Если вдоль direction все points почти одинаковы, coordinate почти ничего не различает.

Если values сильно различаются, direction помогает разделять observations.

PCA использует variance как меру структуры.

Но важно:

> высокая variance не гарантирует высокую predictive value для target.

PCA — unsupervised method. Он не смотрит на y.

Feature с маленькой variance может быть очень важен для classification.

---

## 4. Centering — обязательная идея

Перед PCA данные центрируются:

\[
x_{centered}=x-\bar x.
\]

Почему?

Мы хотим анализировать **variation вокруг среднего**, а не положение cloud относительно origin.

Если облако points далеко от нуля, но почти не имеет внутреннего spread, абсолютное положение не должно становиться первой principal direction.

В scikit-learn `PCA` центрирует input автоматически.

---

## 5. Но scikit-learn PCA не делает scaling

Это критически важно.

`PCA` в scikit-learn:

```text
centers data
but does not scale each feature
```

Если:

```text
feature A: values около 0–1
feature B: values около 0–1 000 000
```

variance B может доминировать только из-за units.

Поэтому перед PCA часто используют `StandardScaler`, если features измеряются в несопоставимых scales и нет причины сохранять исходную variance magnitude.

Pipeline:

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

pipe = Pipeline([
    ("scale", StandardScaler()),
    ("pca", PCA(n_components=2)),
])
```

---

## 6. Маленький геометрический пример

Points:

```text
(1,1)
(2,2)
(3,3)
(4,4)
```

Они лежат точно на линии:

\[
y=x.
\]

В исходных coordinates две features.

Но real intrinsic dimension равна 1.

Главная direction:

\[
v_1=
\frac{1}{\sqrt2}
\begin{bmatrix}
1\\
1
\end{bmatrix}.
\]

Перпендикулярная:

\[
v_2=
\frac{1}{\sqrt2}
\begin{bmatrix}
1\\
-1
\end{bmatrix}.
\]

Projection на \(v_2\) после centering почти всегда равна нулю.

Значит PC2 не несёт дополнительной variance.

---

## 7. Projection руками

Centered point:

\[
x=
\begin{bmatrix}
1\\
1
\end{bmatrix}.
\]

Direction:

\[
v=
\frac1{\sqrt2}
\begin{bmatrix}
1\\
1
\end{bmatrix}.
\]

Coordinate на новой axis:

\[
z=x^Tv
=
\frac{2}{\sqrt2}
=
\sqrt2.
\]

PCA transform по сути вычисляет coordinates objects в новой basis.

---

![Учебная иллюстрация: PCA. Облако точек, PC1/PC2, ортогональная проекция и потерянная вариация.](content-assets/datapath-v2/figures/56_pca.png "Облако точек, PC1/PC2, ортогональная проекция и потерянная вариация.")

## 8. Covariance matrix

Для centered data covariance matrix показывает, как features изменяются вместе.

Для двух features:

\[
\Sigma=
\begin{bmatrix}
Var(x_1) & Cov(x_1,x_2)\\
Cov(x_1,x_2) & Var(x_2)
\end{bmatrix}.
\]

Если covariance сильная, cloud повёрнуто относительно исходных axes.

Principal directions совпадают с eigenvectors covariance matrix, а corresponding eigenvalues показывают variance вдоль этих directions.

Так возникает классическая формулировка PCA через собственные векторы.

---

## 9. Eigenvectors и eigenvalues без магии

Eigenvector матрицы — direction, которое при линейном transformation не меняет направление, а только масштабируется.

Для covariance matrix:

```text
eigenvector
→ special direction variation

eigenvalue
→ amount of variance along it
```

PCA сортирует directions по eigenvalues от больших к меньшим.

---

## 10. Почему в реальном коде часто говорят про SVD

Вместо явного:

```text
compute covariance
→ eigen decomposition
```

можно работать напрямую с centered data matrix через Singular Value Decomposition (SVD):

\[
X=U\Sigma V^T.
\]

Rows/columns этих matrices дают связь с principal directions и strengths components.

В scikit-learn `PCA` реализован через SVD-based approaches и выбирает solver в зависимости от shape и `n_components`.

Главное для понимания:

> covariance eigenvectors и right singular vectors centered X ведут к тем же principal axes.

---

## 11. `components_`

После:

```python
pca.fit(X_train)
```

можно посмотреть:

```python
pca.components_
```

Каждая row — principal axis в original feature space.

Например:

```text
PC1:
height  +0.58
weight  +0.55
armspan +0.60

PC2:
height  -0.10
weight  +0.80
armspan -0.45
```

Это loadings/direction coefficients.

Но component sign неоднозначен:

```text
v
```

и:

```text
-v
```

описывают одну и ту же axis.

Поэтому знак PCA component сам по себе не имеет абсолютного смысла.

---

## 12. `explained_variance_`

`explained_variance_` показывает variance каждой selected component.

`explained_variance_ratio_` — долю общей variance, объяснённую component.

Например:

```text
PC1 → 0.62
PC2 → 0.21
PC3 → 0.09
PC4 → 0.04
...
```

Первые две вместе:

\[
0.62+0.21=0.83.
\]

То есть около 83% variation data находится в двумерном subspace этих components.

---

## 13. Cumulative explained variance

Чтобы выбрать `n_components`, часто смотрят cumulative curve:

```text
1 component  → 62%
2            → 83%
3            → 92%
4            → 96%
...
```

Можно выбрать threshold:

```text
95% explained variance
```

В `PCA` некоторые режимы позволяют задавать `n_components` как долю variance при подходящем solver.

Но 95% — heuristic, а не универсальный standard.

Для downstream ML лучше дополнительно проверить validation quality.

---

## 14. Reconstruction

Если оставить только несколько components, можно приблизительно восстановить исходные features.

Схема:

```text
X
→ PCA transform
→ Z reduced
→ inverse_transform
→ X_reconstructed
```

Чем больше discarded variance, тем выше reconstruction error.

Это другой способ понять PCA:

> мы ищем low-dimensional linear subspace, который хорошо приближает data.

---

## 15. PCA и compression

Допустим image имеет тысячи pixel features.

Если data lives near lower-dimensional subspace, можно хранить fewer component coordinates.

Но PCA compression linear.

Сложные nonlinear structures он может сжимать хуже neural autoencoder или manifold methods.

---

## 16. PCA и шум

Если high-variance components содержат signal, а small-variance tail в основном noise, удаление последних components может улучшить downstream model.

Но это не гарантировано.

Иногда predictive signal лежит именно в low-variance direction.

Поскольку PCA не знает y, он может удалить useful target signal.

---

## 17. PCA перед supervised model

Правильная оценка:

```text
Pipeline:
scaler
→ PCA
→ classifier
```

и вся конструкция внутри CV.

Нельзя:

```text
PCA.fit_transform(X whole dataset)
→ cross-validation
```

Потому что PCA components уже использовали validation fold distribution.

Это unsupervised preprocessing leakage.

Даже transform без target может течь через validation statistics.

---

## 18. Пример Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression

model = Pipeline([
    ("scale", StandardScaler()),
    ("pca", PCA(n_components=0.95)),
    ("classifier", LogisticRegression(max_iter=1000)),
])
```

Внутри каждого CV fold scaler и PCA должны `fit` только на training part.

---

## 19. Когда PCA особенно полезен

- много correlated numerical features;
- visualization high-dimensional data в 2D/3D;
- noise reduction;
- compression;
- preprocessing distance-based models;
- speeding downstream algorithms.

---

## 20. Когда PCA неудобен

### Интерпретируемость

PC1 — mixture десятков features. Объяснять business user сложнее.

### Categories

OHE + PCA возможно математически, но interpretation становится сложной, а centering sparse matrix может быть дорого.

Для sparse text features часто используют `TruncatedSVD`, который не требует centering.

### Nonlinear manifolds

Если structure curved, linear projection может её не раскрыть.

### Important low-variance signal

PCA может его отбросить.

---

## 21. Whitening

`PCA(whiten=True)` дополнительно масштабирует transformed components так, чтобы outputs были uncorrelated и имели unit component-wise variance.

Это удаляет relative variance scale components.

Иногда полезно downstream estimators, которые предполагают comparable scales.

Но information о том, что PC1 объясняла намного больше variance, в whitened representation больше не выражается scale component.

Whitening — не default и не «улучшенный PCA».

---

## 22. PCA vs feature selection

Feature selection:

```text
оставить:
x2, x7, x11
```

Original meaning сохраняется.

PCA:

```text
PC1 = 0.4*x1 - 0.2*x2 + ...
```

создаёт новые features.

Плюс PCA: может эффективно объединять correlated information.

Минус: interpretation хуже.

---

## 23. PCA vs t-SNE/UMAP mental model

PCA — linear global projection.

t-SNE/UMAP часто применяют для nonlinear visualization/manifold structure.

Но 2D красивый t-SNE plot нельзя автоматически использовать как доказательство реальных clusters.

PCA остаётся гораздо прозрачнее математически и имеет `transform` для новых data.

---

## 24. Интерактивная визуализация DataPath

### Режим 1. Rotate axis

2D point cloud.

Пользователь вращает direction.

Показывать variance projection.

Maximum отмечается как PC1.

### Режим 2. PC2

После фиксации PC1 показывать perpendicular PC2.

### Режим 3. Scaling

Один feature умножить на 100.

PCA axis резко поворачивается.

Затем включить StandardScaler.

### Режим 4. Reconstruction

Slider:

```text
1 component
2 components
3 components
```

Показать original и reconstructed data/error.

---

## 25. Типичные ошибки

**«PCA выбирает самые важные исходные features».**\
Нет, создаёт linear combinations.

**«PCA использует target».**\
Нет.

**«Высокая explained variance = высокая predictive importance».**\
Не обязательно.

**«scikit-learn PCA сам делает StandardScaler».**\
Нет. Он центрирует, но не масштабирует features.

**«95% variance всегда правильный threshold».**\
Нет.

**«PCA нельзя переобучить, потому что нет y».**\
Preprocessing leakage всё равно возможен.

**«Знак component имеет абсолютный смысл».**\
Нет.

---

## 26. Проверка понимания

1. Что максимизирует PC1?
2. Почему PCA центрирует data?
3. Почему scaling часто нужен до PCA?
4. Чем component отличается от original feature?
5. Что означает `explained_variance_ratio_`?
6. Почему PCA может удалить predictive signal?
7. Что делает SVD?
8. Почему PCA должен fit внутри CV?
9. Чем PCA отличается от feature selection?
10. Что делает whitening?

---

## 27. Мини-практика

Dataset:

```text
100 numeric features
many correlated
20 000 samples
binary target
```

Baseline Logistic Regression без PCA: AP=0.42.

С PCA:

```text
10 PCs → 70% variance, AP=0.35
30 PCs → 92% variance, AP=0.43
60 PCs → 99% variance, AP=0.42
```

Ответьте:

1. какой вариант выглядит разумнее;
2. почему max explained variance не дала max AP;
3. как CV должна включать scaler/PCA;
4. что теряем по interpretation;
5. зачем сравнить training time.

---

## 28. Как объяснить на собеседовании

### Что такое PCA?

**Коротко.**\
Линейный метод уменьшения размерности. Он ищет ортогональные directions, на которые projections data имеют максимальную variance, и позволяет оставить первые components, объясняющие большую часть variability.

### Нужно ли масштабировать features?

scikit-learn PCA центрирует input, но не масштабирует features. Если units несопоставимы, scaling обычно нужен, иначе features с большой variance в исходных units будут доминировать.

### Как связан PCA с eigenvectors?

Principal axes — eigenvectors covariance matrix centered data; eigenvalues соответствуют explained variance. Практически PCA удобно вычислять через SVD.

---

## 29. Что нужно унести

1. PCA создаёт новые orthogonal features.
2. PC1 максимизирует projection variance.
3. Следующие PCs ортогональны и объясняют оставшуюся variance.
4. Data центрируются.
5. scikit-learn PCA не делает feature scaling автоматически.
6. PCA связан с eigenvectors covariance и SVD.
7. `explained_variance_ratio_` показывает долю variance.
8. PCA — unsupervised, поэтому variance не равна target usefulness.
9. PCA должен жить внутри CV Pipeline.
10. Reconstruction показывает, сколько information потеряно.
11. Whitening дополнительно нормирует component variance.
12. PCA улучшает compression, но ухудшает interpretation.

## Куда дальше

PCA ищет основную структуру данных. Но иногда нас интересует противоположное:

> **какие объекты вообще не похожи на нормальную структуру?**

Следующий урок — поиск аномалий: Isolation Forest, Local Outlier Factor и различие между outlier detection и novelty detection.

## Источники
- scikit-learn PCA User Guide and API.
- scikit-learn dimensionality reduction documentation.
