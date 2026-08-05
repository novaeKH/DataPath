---
title: Support Vector Machines
id: concept.ml.support-vector-machines
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
- SVM
- Метод опорных векторов
tags:
- ml/classical
- ml/margin
math_depth: 2
---

# Support Vector Machines

## Интуиция

Для binary classification SVM ищет boundary с максимальным margin — расстоянием до ближайших train points разных классов. Эти ближайшие points называются support vectors и определяют решение.

## Linear hard-margin SVM

Для labels $y_i\in\{-1,+1\}$:

$$
\min_{w,b}\frac12\lVert w\rVert^2
$$

при ограничениях:

$$
y_i(w^\top x_i+b)\ge1.
$$

Margin обратно пропорционален $\lVert w\rVert$. Hard margin требует идеально separable data и чувствителен к outliers.

## Soft margin

Добавляются slack variables $\xi_i$:

$$
\min_{w,b,\xi}
\frac12\lVert w\rVert^2+C\sum_i\xi_i,
$$

$$
y_i(w^\top x_i+b)\ge1-\xi_i,\quad \xi_i\ge0.
$$

Большое `C` сильнее штрафует ошибки и делает boundary гибче; малое `C` усиливает regularization и допускает violations.

## Hinge loss

Equivalent unconstrained idea:

$$
\max(0,1-yf(x)).
$$

Correct point outside margin имеет zero loss. Point внутри margin или ошибочный — positive loss.

## Kernel trick

Kernel вычисляет inner product в feature space:

$$
K(x,z)=\langle\phi(x),\phi(z)\rangle.
$$

RBF:

$$
K(x,z)=\exp(-\gamma\lVert x-z\rVert^2).
$$

Большое $\gamma$ создаёт локальное влияние и сложную boundary; малое — smooth boundary.

## Scaling

SVM основан на distances/dot products, поэтому scaling критичен. `C` и `gamma` имеют смысл только относительно scale features.

## Probability

Обычный SVM выдаёт decision score, не probability. `probability=True` добавляет calibration-like fit и увеличивает стоимость обучения. Часто лучше отдельно calibrate на held-out/OOF predictions.

## Multiclass

Используются One-vs-Rest или One-vs-One стратегии. Implementation определяет детали.

## Complexity

Kernel SVM может быть дорогим по memory/time на больших $n$, потому что работает с pairwise similarities. Linear SVM подходит для high-dimensional sparse features.

## Визуализация

Компонент `svm-margin-kernel-lab`:

- points и support vectors;
- margin lines;
- sliders `C` и `gamma`;
- linear/RBF toggle;
- outlier toggle;
- scaling toggle.

## sklearn пример

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

pipeline = Pipeline([
    ("scale", StandardScaler()),
    ("model", SVC(C=1.0, kernel="rbf", gamma="scale")),
])
```

## Когда использовать

- medium-size dataset;
- high-dimensional sparse text с linear kernel;
- сложная smooth boundary при не слишком большом n;
- когда inference по support vectors приемлем.

Для больших tabular datasets tree boosting часто проще и быстрее.

## Ответ для собеседования

> SVM ищет разделяющую гиперплоскость с максимальным зазором (margin); для нелинейных границ используется kernel trick — признаки неявно проецируются в пространство большей размерности. Обучение — решение задачи квадратичного программирования (или dual), штраф за ошибки задаёт параметр C, форму границы — kernel и gamma. SVM хорошо работает на малых/средних данных, но не выдаёт вероятности без дополнительной калибровки.

## Частые ошибки

- не scaling;
- путать `C` с regularization strength напрямую: большое C = слабее regularization;
- считать score probability;
- подбирать C/gamma на test;
- использовать RBF на огромном dataset без оценки complexity;
- интерпретировать все train points как одинаково важные.

## Связи

- [[Regularization]]
- [[K-Nearest Neighbors]]
- [[Probability Calibration]]
- [[Data Preprocessing and Feature Engineering]]
