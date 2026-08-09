---
title: sklearn End-to-End Classification — Practice
type: practice
area: ml
status: active
aliases:
  - sklearn классификация end-to-end
tags:
  - practice/sklearn
  - ml/classification
rag: include
id: practice.ml.sklearn-end-to-end-classification-practice
schema_version: 2
language: ru
rag_collection: practice
app: source
---


**Рекомендуемое время:** 60–75 минут.

## Результаты обучения
- понимать maximum margin и support vectors
- объяснять soft margin, C и hinge loss
- понимать kernel trick и gamma
- оценивать scaling и вычислительные ограничения

## Вход в тему

SVM ищет не просто разделяющую линию, а линию с максимально широким безопасным коридором между классами. Решение определяется объектами, которые ближе всего к границе — support vectors.

## Полная теория

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

## Визуальная демонстрация

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

## Частые ошибки

- не scaling;
- путать `C` с regularization strength напрямую: большое C = слабее regularization;
- считать score probability;
- подбирать C/gamma на test;
- использовать RBF на огромном dataset без оценки complexity;
- интерпретировать все train points как одинаково важные.

## Обязательная визуальная демонстрация

Точки, boundary, margin и support vectors; C, gamma, outlier и kernel toggles.

## Практика

#### Задание 1. C

Что произойдёт с margin и ошибками при очень большом C?

#### Задание 2. Gamma

Как большое gamma меняет RBF boundary?

#### Задание 3. Scaling

Почему SVM особенно чувствителен к scale?

#### Задание 4. Model choice

Когда LinearSVC разумнее RBF SVC?

## Разбор практики

**1.** Ошибки/violations сильнее штрафуются, margin обычно сужается, риск overfit растёт.

**2.** Влияние каждого point становится очень локальным, boundary — сложной.

**3.** Objective зависит от dot products/distances; признаки большого масштаба доминируют.

**4.** При большом n и high-dimensional sparse data, например text.

## Checkpoint для приложения

#### Checkpoint 1

**Вопрос:** Support vectors — это...

- A. все train points
- B. точки, определяющие margin/boundary
- C. test samples
- D. PCA axes

**Правильный ответ:** B

**Объяснение:** Именно ближайшие к границе точки входят в решение.

#### Checkpoint 2

**Вопрос:** Большое C означает...

- A. сильнее regularization
- B. слабее tolerance к violations
- C. меньше features
- D. обязательный linear kernel

**Правильный ответ:** B

**Объяснение:** Ошибки сильнее штрафуются, effective regularization слабее.

#### Checkpoint 3

**Вопрос:** RBF gamma контролирует...

- A. локальность влияния точки
- B. число классов
- C. train size
- D. calibration bins

**Правильный ответ:** A

**Объяснение:** Большое gamma делает kernel узким и локальным.

## Мини-проект / применение

Используй небольшой воспроизводимый dataset и оформи результат как карточку эксперимента: постановка задачи, split, baseline, pipeline, metric, результат, error analysis и ограничения. Код должен запускаться сверху вниз без ручных скрытых шагов.

## Критерий завершения урока

Ученик может своими словами объяснить механизм, решить хотя бы одно числовое задание, написать минимальный sklearn pipeline, назвать две типичные ошибки и обосновать, когда метод применять не стоит.
