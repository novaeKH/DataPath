---
title: EDA Relationships Time and Groups
id: concept.eda.relationships-time-groups
type: concept
area: eda
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Связи признаков EDA
tags:
- eda/relationships
- eda/time
---

# EDA: Relationships, Time and Groups

## Связь не равна причинности

EDA показывает ассоциации. Correlation может возникать из-за confounder, selection bias, leakage или общего trend. Вывод «признак влияет» требует causal design, а не scatter plot.

## Numerical–numerical

Используйте:

- scatter для небольших данных;
- alpha/hexbin для плотных данных;
- Pearson для linear relation;
- Spearman для monotonic relation;
- residual plots;
- анализ по сегментам.

Correlation около нуля не исключает U-shaped или threshold relation.

## Numerical–categorical

Сравнивайте distribution, а не только mean:

- boxplot/violin/ECDF;
- quantiles;
- sample size;
- missing rate;
- uncertainty.

Разница может объясняться другим composition групп.

## Categorical–categorical

Contingency table:

```python
table = pd.crosstab(frame["segment"], frame["target"], normalize="index")
```

Показывайте counts рядом с rates. Высокая rate в категории из трёх объектов не является устойчивым выводом.

## Высокая cardinality

Для тысяч категорий:

- top frequencies;
- cumulative coverage;
- rare share;
- new/unknown over time;
- target statistics только leakage-safe;
- grouping by domain hierarchy.

Не стройте bar chart на 500 значений.

## Время

Проверяйте:

- число объектов по периоду;
- target prevalence;
- missing rate;
- feature quantiles;
- новые категории;
- latency формирования label;
- seasonality;
- резкие изменения pipeline источника.

Rolling average сглаживает шум, но может скрыть резкий drift. Показывайте и raw support.

## Groups и повторные наблюдения

Если у одного user много строк, обычный scatter переоценивает effective sample size. Анализируйте:

- distribution числа строк на group;
- within-group и between-group variation;
- group-level aggregates;
- наличие group leakage;
- влияние крупных groups.

## Simpson's paradox

Aggregate relation может иметь противоположное направление внутри сегментов. Поэтому важные связи проверяют по времени, продукту, региону и другим возможным confounders.

## Feature–target analysis без утечки

EDA target relation проводите на train portion. Не выбирайте десятки transformations по test. Для временной задачи смотрите stability relation по периодам.

## Practical sequence

1. Сформулировать вопрос.
2. Выбрать unit и subset.
3. Посчитать support.
4. Построить подходящий plot.
5. Проверить сегменты/time.
6. Найти альтернативное объяснение.
7. Сформулировать testable hypothesis.
8. Проверить на validation.

## Связи

- [[Seaborn Statistical Visualization]] — инструменты графиков.
- [[Hypothesis Testing and Confidence Intervals]] — uncertainty.
- [[Validation Splits and Data Leakage]] — отделение test.
