---
title: "Матожидание, дисперсия, ковариация и корреляция"
id: concept.datapath-v2.029
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 29
canonical_course: "Вероятность и статистика"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Матожидание, дисперсия, ковариация и корреляция

Среднее говорит, где distribution находится; variance — насколько разбросана; covariance/correlation — как две величины меняются вместе. Эти понятия лежат под PCA, regression и uncertainty analysis.

## Матожидание

E[X] — долгосрочный средний уровень random variable, взвешенный probabilities. Sample mean оценивает expectation по наблюдениям.

## Variance

Var(X)=E[(X-E[X])²]. Squaring делает deviations nonnegative и сильнее penalizes large deviations. Standard deviation — sqrt variance и возвращает исходные units.

## Covariance

Cov(X,Y)=E[(X-E[X])(Y-E[Y])]. Positive: tend move together; negative: opposite. Magnitude depends units, поэтому covariance неудобна для сравнения разных scales.

## Correlation

Pearson corr = Cov(X,Y)/(stdX*stdY), range [-1,1]. It measures linear association. Corr=0 не гарантирует independence; correlation не доказывает causality.

## Covariance matrix

Для d features covariance matrix содержит variance по diagonal и pairwise covariance вне diagonal. PCA использует структуру этой matrix/эквивалентный SVD.

## Sample estimates

Дисперсию выборки часто оценивают с делителем n-1 для unbiased estimate population variance при standard assumptions. В NumPy это `ddof=1` vs default `ddof=0`.

## Практический код

```python
import numpy as np

x = np.array([1., 2., 3., 4.])
y = np.array([2., 4., 6., 8.])

print(x.mean())
print(x.var(ddof=1))
print(np.cov(x, y))
print(np.corrcoef(x, y))
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- путать variance и standard deviation
- сравнивать covariance разных units как normalized measure
- corr=0 трактовать как independence
- correlation трактовать как causal effect
- не различать population/sample variance conventions

## Проверка понимания

1. Что такое expectation?
2. Variance units?
3. Covariance sign?
4. Почему correlation normalized?
5. Corr=0 означает independence?
6. Что на diagonal covariance matrix?

## Мини-практика

Придумайте nonlinear зависимость Y=X² при симметричном X и объясните, почему Pearson correlation может быть близка к 0 при сильной зависимости.

## Что нужно унести

Expectation описывает центр, variance — spread, covariance/correlation — совместное изменение. Correlation — association, не causal importance.

## Куда дальше

Следующий урок — почему sample statistics становятся стабильнее при увеличении выборки: LLN и Central Limit Theorem.
