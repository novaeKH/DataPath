---
title: "MLE, MAP и оптимизация: мост от вероятности к обучению модели"
id: concept.datapath-v2.033
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 33
canonical_course: "Вероятность и статистика"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# MLE, MAP и оптимизация: мост от вероятности к обучению модели

Почему linear regression минимизирует MSE, а logistic regression — log loss? Один ответ: такие objectives возникают из probabilistic assumptions и maximum likelihood estimation.

## Likelihood

Пусть model with parameters theta assigns probability/density observed data. Likelihood L(theta)=P(data|theta) рассматривается как функция parameters при fixed observations.

## MLE

Maximum Likelihood Estimation выбирает theta, при котором observed data наиболее вероятны: theta_hat=argmax L(theta).

## Log-likelihood

Products probabilities превращаются в sums logs: log(prod p_i)=sum log p_i. Максимизация likelihood эквивалентна log-likelihood, но numerical computation устойчивее.

## Gaussian noise → MSE

Если regression assumes y=f_theta(x)+epsilon, epsilon~Normal(0,sigma²), negative log-likelihood отличается от sum squared errors на constants/scaling. Поэтому least squares имеет probabilistic interpretation.

## Bernoulli → log loss

Для binary y with predicted p, likelihood product p^y(1-p)^(1-y). Negative log gives binary cross-entropy/log loss.

## MAP

Maximum A Posteriori maximizes P(theta|data) ∝ likelihood * prior. In log form: data loss + penalty from prior. Gaussian prior on weights relates to L2-like regularization; Laplace prior — L1-like.

## Optimization bridge

Probabilistic formulation задаёт objective, а gradient descent/Newton/solver — способ его оптимизировать. Не путайте loss definition и optimization algorithm.

## Практический код

## Числовой мост от вероятности к функции потерь

Пусть для трёх объектов модель предсказала вероятности положительного класса `0.9, 0.2, 0.7`, а истинные ответы равны `1, 0, 1`. Вероятность наблюдать именно эти ответы при независимости объектов равна \(0.9\cdot(1-0.2)\cdot0.7=0.504\). Это likelihood как функция параметров модели при фиксированных данных.

Произведения многих вероятностей становятся очень малы, поэтому переходят к логарифмам. Максимизация log-likelihood эквивалентна максимизации likelihood, а смена знака превращает задачу в минимизацию log loss. Для одного объекта вклад равен (-[y\log p+(1-y)\log(1-p)]): берётся логарифм вероятности фактически наблюдённого класса.

MLE выбирает параметры, лучше всего объясняющие данные в рамках модели. MAP дополнительно учитывает prior — предпочтение параметров до наблюдения текущей выборки. После логарифмирования некоторые priors превращаются в знакомые штрафы: гауссов prior связан с L2-регуляризацией, лапласов — с L1.

Важно разделять два слоя. Вероятностная модель определяет objective, а optimizer решает, как искать её минимум. Одну и ту же loss можно оптимизировать разными алгоритмами; хороший optimizer не исправит неверные предпосылки вероятностной модели.

```python
import numpy as np

# Bernoulli negative log-likelihood
y = np.array([1, 0, 1])
p = np.array([0.9, 0.2, 0.7])

nll = -np.sum(
    y * np.log(p)
    + (1 - y) * np.log(1 - p)
)
print(nll)
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- путать probability P(theta|data) и likelihood P(data|theta)
- считать MLE Bayesian method
- путать objective и optimizer
- думать, что prior всегда subjective guess only
- не замечать связь regularization с MAP interpretation

## Проверка понимания

1. Что такое likelihood?
2. MLE?
3. Почему log-likelihood?
4. Gaussian noise gives which regression loss?
5. Bernoulli gives which classification loss?
6. MLE vs MAP?
7. How prior relates to regularization?

## Мини-практика

Выведите без лишней алгебры идею: почему binary observations с predicted probabilities приводят к `-[y log p + (1-y) log(1-p)]`. Объясните каждый term.

## Что нужно унести

MLE связывает probability model и loss; MAP добавляет prior/regularization. Optimizer — отдельный механизм поиска параметров.

## Куда дальше

Математический фундамент готов. Следующий блок — scikit-learn architecture: `fit`, `transform`, Pipeline и cross-validation без leakage.
