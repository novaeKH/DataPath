---
title: "Выборка, закон больших чисел и центральная предельная теорема"
id: concept.datapath-v2.030
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 30
canonical_course: "Вероятность и статистика"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Выборка, закон больших чисел и центральная предельная теорема

Мы почти никогда не видим всю population. Мы видим sample и пытаемся судить о population. Закон больших чисел объясняет стабилизацию sample mean, а центральная предельная теорема — форму uncertainty этого среднего.

## Population vs sample

Population — концептуальная совокупность интереса; sample — наблюдаемая часть. Главная проблема не только sample size, но и representativeness: большой biased sample остаётся biased.

## Sampling variability

Если многократно брать samples, их means различаются. Distribution статистики по повторным samples называется sampling distribution.

## Закон больших чисел

При стандартных условиях sample mean сходится к expectation при n→∞. Он не говорит, что data distribution становится Gaussian.

## Central Limit Theorem

Для независимых/слабо зависимых observables с finite variance при определённых условиях standardized sample mean приближается к Normal distribution при росте n. Исходные observations могут быть non-normal.

## Standard error

Для mean: SE ≈ sigma/sqrt(n), на практике sigma заменяют sample std. Чтобы уменьшить SE в 2 раза, нужно примерно в 4 раза больше observations.

## Dependence

Если observations correlated — например repeated rows одного user — effective information меньше, чем raw n. Обычные iid formulas могут недооценить uncertainty.

## Практический код

```python
import numpy as np

rng = np.random.default_rng(42)

means = []
for _ in range(5000):
    sample = rng.exponential(scale=1.0, size=50)
    means.append(sample.mean())

print(np.mean(means), np.std(means))
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- говорить, что CLT делает исходные данные normal
- считать большой biased sample хорошим
- забывать dependence/repeated users
- думать, что SE падает линейно с n
- путать sample distribution и sampling distribution

## Проверка понимания

1. Population vs sample?
2. What LLN says?
3. What CLT says?
4. What is sampling distribution?
5. How SE scales with n?
6. Why correlated observations matter?

## Мини-практика

Смоделируйте exponential population. Для n=5, 30, 200 постройте distribution 5000 sample means и объясните, что меняется.

## Что нужно унести

LLN объясняет convergence статистики, CLT — approximate uncertainty distribution. Но оба результата требуют assumptions и не исправляют selection bias.

## Куда дальше

Дальше — estimation и confidence intervals: как превратить sampling uncertainty в интервал.
