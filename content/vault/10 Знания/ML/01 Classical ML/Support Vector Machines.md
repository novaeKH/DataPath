---
title: Support Vector Machines
type: concept
area: ml
status: active
aliases:
  - SVM
  - Support Vector Machine
  - Метод опорных векторов
tags:
  - ml/classical
  - ml/margin
math_depth: 2
id: concept.ml.support-vector-machines
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Support Vector Machines

## Идея за 30 секунд

Linear SVM ищет separating hyperplane с большим margin. На objective влияют в основном support vectors — объекты около границы или нарушающие её. Parameter $C$ балансирует wide margin и training violations. Kernel позволяет linear separation в implicit feature space, но scaling и tuning $C/\gamma$ критичны.

## Linear score и margin

Для $y_i\in\{-1,+1\}$:

$$
f(x)=w^\top x+b.
$$

Signed functional margin:

$$
y_i f(x_i).
$$

Classification correct, если значение положительно. Геометрический margin нормируется на $\lVert w\rVert_2$.

Hard-margin objective для linearly separable data:

$$
\min_{w,b}\frac{1}{2}\lVert w\rVert_2^2
$$

при constraints:

$$
y_i(w^\top x_i+b)\ge1.
$$

Minimization norm эквивалентна maximization geometric margin.

## Soft margin и hinge loss

Реальные данные не separable. Soft-margin SVM:

$$
\min_{w,b}
\frac{1}{2}\lVert w\rVert_2^2
+C\sum_{i=1}^{n}
\max\left(0,1-y_if(x_i)\right).
$$

Hinge loss:

$$
\ell_i=\max(0,1-y_if(x_i)).
$$

- $y_if(x_i)\ge1$: loss zero, объект за margin.
- $0<y_if(x_i)<1$: class correct, но margin нарушен.
- $y_if(x_i)\le0$: misclassification.

$C$:

- large $C$ сильнее штрафует violations → более сложная/чувствительная boundary;
- small $C$ допускает violations → wider margin и stronger regularization.

## Support vectors

Только objects с active constraints/near margin получают non-zero dual coefficients и определяют boundary. Удаление далёких правильно classified points часто не меняет solution.

Это делает model sparse по train objects в dual representation, но inference cost растёт с числом support vectors.

## Kernel trick

В dual objective observations входят через dot products. Kernel заменяет:

$$
x_i^\top x_j
$$

на:

$$
K(x_i,x_j)=\phi(x_i)^\top\phi(x_j)
$$

без явного вычисления high-dimensional $\phi(x)$.

RBF kernel:

$$
K(x,z)
=\exp\left(
-\gamma\lVert x-z\rVert_2^2
\right).
$$

$\gamma$:

- large → очень local influence, high variance;
- small → smooth global influence, high bias.

Tuning $C$ и $\gamma$ взаимосвязан.

## Почему scaling необходим

Margin, dot products и RBF distance зависят от units. Feature с большим численным scale доминирует и меняет effective $\gamma$.

Scaler fit только внутри train/folds. Для sparse data нужен transformer, сохраняющий sparsity.

## Probabilities и calibration

SVM выдаёт signed decision score, а не probability. Probability estimate обычно получают отдельной calibration procedure, например Platt scaling или isotonic regression, обученной на held-out/CV predictions.

Calibration на тех же predictions, что fit SVM, переобучается.

## Multiclass

Распространённые схемы:

- one-vs-rest;
- one-vs-one.

Конкретная библиотека выбирает strategy и aggregation; interpretation `decision_function` зависит от неё.

## Когда использовать

- medium-size data;
- high-dimensional sparse features;
- чёткий margin;
- nonlinear boundary при умеренном $n$ и подходящем kernel.

Kernel SVM плохо масштабируется на очень большой $n$; linear solvers или approximate feature maps практичнее.

## Failure modes

- не масштабировать features;
- tuning по test;
- считать decision score probability;
- использовать RBF default без проверки $\gamma$;
- применять kernel SVM к огромному dataset без latency/memory оценки;
- интерпретировать support vectors как «аномалии» автоматически.

## Связи

- [[Linear Algebra for ML]] — dot product, norm и distance.
- [[Regularization]] — margin objective содержит L2 и trade-off $C$.
- [[K-Nearest Neighbors]] — оба зависят от geometry, но используют её по-разному.
- [[ML Foundations]] — $C$ и $\gamma$ управляют bias–variance.
- [[Validation Splits and Data Leakage]] — scaler, calibration и tuning внутри folds.
