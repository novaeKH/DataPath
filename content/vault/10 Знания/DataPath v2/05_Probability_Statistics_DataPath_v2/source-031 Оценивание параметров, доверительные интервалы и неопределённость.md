---
title: "Оценивание параметров, доверительные интервалы и неопределённость"
id: concept.datapath-v2.031
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 31
canonical_course: "Вероятность и статистика"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Оценивание параметров, доверительные интервалы и неопределённость

Одно число `conversion=12.4%` создаёт ложное ощущение точности. Любая оценка по sample имеет uncertainty. Confidence interval показывает диапазон, построенный процедурой с заданным coverage при повторении эксперимента.

## Point estimate

Sample mean, proportion, median — point estimates population parameters. Good estimator оценивают по bias, variance, consistency и robustness.

## Bias and variance estimator

Estimator может систематически смещаться или сильно колебаться между samples. Unbiased не всегда означает practically best if variance huge.

## Confidence interval interpretation

95% confidence interval в frequentist смысле: если многократно повторять sampling и строить interval той же процедурой, около 95% intervals покроют fixed true parameter. После получения конкретного интервала parameter не становится random в этой интерпретации.

## Mean interval

При large n часто используют estimate ± critical_value * SE. Для small sample normal model with unknown variance появляется Student t distribution.

## Proportion

Для binary conversion simple normal approximation может быть плохой при small n/extreme p; существуют Wilson/exact approaches. Важно не использовать одну формулу механически.

## Bootstrap

Resample observations with replacement from sample, recompute statistic many times. Это approximates sampling variability. При grouped/time-dependent data resampling unit должен уважать dependence.

## Практический код

## Как читать доверительный интервал

Допустим, средний чек в выборке равен 1000 рублей, а стандартная ошибка — 50 рублей. При приближённом 95%-м интервале получаем \(1000\pm1.96\cdot50\), то есть примерно от 902 до 1098 рублей. Ширина отражает неопределённость процедуры, а не диапазон, в котором лежат 95% отдельных чеков.

В частотной интерпретации параметр фиксирован, а границы интервала случайны до получения данных. Если многократно повторять корректный отбор и строить интервал тем же способом, около 95% таких интервалов накроют истинный параметр. После расчёта конкретного интервала нельзя буквально говорить о 95%-й случайности уже фиксированного параметра.

Bootstrap имитирует повторные выборки, извлекая наблюдения с возвращением из имеющихся данных. Для медианы или сложной метрики это часто удобнее аналитической формулы. Но единица пересэмплирования должна сохранять зависимость: если у клиента много строк, обычно пересэмплируют клиентов целиком, а не отдельные события.

Интервал имеет смысл только вместе с дизайном данных. Систематическое смещение выборки не исчезает от большого `n`: узкий интервал вокруг неверной оценки остаётся неверным.

```python
import numpy as np

rng = np.random.default_rng(42)
x = rng.normal(10, 2, size=100)

mean = x.mean()
se = x.std(ddof=1) / np.sqrt(len(x))

ci_approx = (
    mean - 1.96 * se,
    mean + 1.96 * se,
)
print(ci_approx)
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- говорить '95% chance true mean inside this fixed interval' как frequentist definition
- игнорировать sample dependence
- использовать normal approximation для tiny proportions без проверки
- считать narrower interval всегда better без учета bias
- bootstrap individual rows при clustered data

## Проверка понимания

1. Point estimate?
2. Estimator bias vs variance?
3. Correct frequentist CI interpretation?
4. Why t distribution appears?
5. What bootstrap simulates?
6. Why group bootstrap may be needed?

## Мини-практика

Оцените mean order amount и 95% uncertainty interval обычным approximation и bootstrap. Сравните на skewed data и объясните differences.

## Что нужно унести

Интервал — честный способ показать sampling uncertainty. Его качество зависит не только от formula, но и от sampling design/assumptions.

## Куда дальше

Следующий урок — hypothesis testing и A/B: как принимать решения, контролируя false positives и power.
