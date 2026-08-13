---
title: "Случайные величины и основные распределения"
id: concept.datapath-v2.028
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 28
canonical_course: "Вероятность и статистика"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Случайные величины и основные распределения

Случайная величина переводит случайный исход в число. Распределение описывает, какие значения возможны и насколько они вероятны. В ML распределения появляются в likelihood, noise assumptions, confidence intervals и generative models.

## Discrete vs continuous

Discrete variable принимает счётное множество значений, например число покупок. Continuous — например measurement. Для continuous probability exact single point обычно 0; probabilities живут на intervals через density/CDF.

## Bernoulli

X∈{0,1}, P(X=1)=p. Модель одного binary outcome: click/no click, default/no default.

## Binomial

Число successes в n независимых Bernoulli trials с одинаковым p. Mean np, variance np(1-p). Assumptions важны: trials не всегда independent/equal-p.

## Normal distribution

Gaussian определяется mean и variance. Возникает как useful approximation из Central Limit Theorem и noise model, но реальные данные не становятся normal автоматически.

## Poisson

Моделирует count events при определённой rate-structure. Mean и variance равны lambda в базовой модели; real overdispersed counts могут требовать other distributions.

## Exponential

Continuous waiting time между events в memoryless Poisson-process model. Memoryless assumption часто нереалистично, поэтому это модель, а не универсальный закон.

## CDF and quantiles

CDF F(x)=P(X≤x). Quantile q_p — значение, ниже которого лежит p доля distribution. Quantiles robust и особенно полезны для skewed data.

## Практический код

```python
import numpy as np

rng = np.random.default_rng(42)

bernoulli = rng.binomial(1, 0.2, size=1000)
normal = rng.normal(loc=0, scale=1, size=1000)
poisson = rng.poisson(lam=3, size=1000)

print(np.quantile(normal, [0.05, 0.5, 0.95]))
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- считать любой bell-shaped sample точно Gaussian
- путать density и probability point
- использовать binomial без independence/equal-p check
- забывать assumptions Poisson/exponential
- считать distribution названием графика, а не моделью uncertainty

## Проверка понимания

1. Discrete vs continuous?
2. Bernoulli?
3. Binomial assumptions?
4. Почему Gaussian часто появляется?
5. Что такое CDF?
6. Что такое quantile?

## Мини-практика

Для трёх задач выберите candidate distribution и объясните assumptions: число кликов из 20 показов; время до следующего звонка; measurement noise вокруг true value.

## Что нужно унести

Distribution — математическая модель случайной величины. Выбор distribution означает набор assumptions о support, variability и dependence.

## Куда дальше

Следующий урок — числовые характеристики distribution: expectation, variance, covariance и correlation.
