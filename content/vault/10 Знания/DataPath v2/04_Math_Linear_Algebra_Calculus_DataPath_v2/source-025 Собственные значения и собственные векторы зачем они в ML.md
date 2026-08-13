---
title: "Собственные значения и собственные векторы: зачем они в ML"
id: concept.datapath-v2.025
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 25
canonical_course: "Математика для ML"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Собственные значения и собственные векторы: зачем они в ML

PCA ищет особые направления, вдоль которых данные имеют максимальную дисперсию. Математически это приводит к eigenvectors covariance matrix. Поэтому собственные значения важны не сами по себе, а как язык устойчивых направлений линейного преобразования.

## Определение

Vector \(v\neq0\) — собственный, если \(Av=\lambda v\). Transformation не меняет его направление, только масштабирует (и при отрицательной lambda переворачивает).

## Eigenvalue

\(\lambda\) показывает scale вдоль eigenvector. Большое абсолютное значение означает сильное действие transformation в этом направлении.

## Covariance matrix

Для centered data covariance matrix симметрична. Её eigenvectors образуют orthogonal directions, а eigenvalues соответствуют variance вдоль этих directions.

## PCA bridge

PCA сортирует eigen-directions по explained variance и выбирает top-k. На практике библиотеки часто используют SVD напрямую, что численно удобно и не требует явно строить covariance matrix.

## Spectral intuition

Eigenvalues также появляются в stability, Markov chains, graph methods и optimization. Но для DS важнее уметь объяснить geometric meaning, чем вручную решать characteristic polynomial.

## Практический код

```python
import numpy as np

A = np.array([
    [2., 0.],
    [0., 1.],
])

values, vectors = np.linalg.eig(A)

# Для PCA обычно используем готовую реализацию,
# а не ручной eig на production data.
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- думать, что любой vector eigenvector
- путать eigenvalue с vector
- считать PCA обязательным eig(cov) в коде
- забывать центрирование перед covariance/PCA
- интерпретировать component sign как уникально фиксированный

## Проверка понимания

1. Что значит Av=lambda v?
2. Что делает eigenvalue?
3. Почему covariance matrix важна PCA?
4. Что выбирает PCA?
5. Почему SVD часто используется вместо явного eig(cov)?

## Мини-практика

Возьмите диагональную матрицу `diag(3,1)`. Назовите eigenvectors/eigenvalues без вычислений и опишите, что transformation делает с unit circle.

## Что нужно унести

Eigenvector — направление, сохраняемое линейным преобразованием; eigenvalue — масштаб. В PCA эта пара становится «направление компоненты + объяснённая дисперсия».

## Куда дальше

Следующий урок — производные и gradients: как модель узнаёт, в какую сторону менять параметры.
