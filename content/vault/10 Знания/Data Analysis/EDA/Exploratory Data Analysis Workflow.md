---
title: Exploratory Data Analysis Workflow
id: concept.eda.workflow
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
- EDA
- Разведочный анализ данных
tags:
- eda/core
- data/analysis
---

# Exploratory Data Analysis Workflow

## Что такое EDA

EDA — управляемое исследование данных перед моделированием. Его цель не «построить все графики», а понять структуру выборки, качество, ограничения и риски leakage, сформулировать гипотезы и определить честный pipeline.

## Шаг 1. Сформулировать задачу

Запишите:

- объект prediction;
- target;
- prediction time и horizon;
- доступные признаки в этот момент;
- business action;
- unit одной строки;
- ожидаемые новые объекты в production.

Без этого невозможно отличить хороший признак от утечки.

## Шаг 2. Инвентаризация таблиц

Для каждой таблицы:

- grain;
- primary key;
- foreign keys;
- число строк и колонок;
- период;
- источник;
- частота обновления;
- дубликаты;
- пропуски;
- типы.

```python
summary = {
    "shape": frame.shape,
    "duplicates": int(frame.duplicated().sum()),
    "missing": frame.isna().mean().sort_values(ascending=False).head(20),
}
```

## Шаг 3. Проверка target

Для classification:

- prevalence;
- unknown/invalid labels;
- class balance по времени и сегментам;
- момент формирования label;
- задержка созревания target.

Для regression:

- distribution;
- хвосты;
- нули и отрицательные значения;
- единицы;
- censoring;
- изменение по времени.

## Шаг 4. Data quality

Проверяйте:

- невозможные значения;
- единицы измерения;
- дубликаты;
- несогласованные категории;
- пропуски;
- временной порядок;
- резкие скачки объёма;
- признаки после cutoff.

Ошибки лучше оформлять как reproducible checks, а не оставлять только в notebook.

## Шаг 5. Univariate analysis

Для numerical:

- quantiles;
- histogram/ECDF;
- доля нулей;
- outliers;
- уникальность;
- log scale при длинном хвосте.

Для categorical:

- cardinality;
- frequency;
- rare categories;
- missing/unknown;
- новые значения во времени.

## Шаг 6. Relationships

Исследуйте связь с target и между features, но соблюдайте split и cutoff.

- numerical–numerical: scatter/hexbin/correlation;
- numerical–categorical: distributions по группам;
- categorical–categorical: contingency table;
- feature–target: segment metrics, not only averages;
- time: trend, seasonality, drift.

## Шаг 7. Leakage audit

Для каждого сильного признака спросите:

1. Когда он вычислен?
2. Доступен ли до prediction?
3. Использует ли label или future?
4. Содержит ли post-outcome status?
5. Не повторяется ли entity в train и validation?
6. Не fit ли transformation на полном dataset?

Подозрительно высокий baseline — повод проверить pipeline, а не сразу радоваться.

## Шаг 8. Split и baseline

Выберите random, group или time split исходя из deployment. Затем создайте простой baseline. EDA без честного holdout легко адаптируется к шуму всей выборки.

## Шаг 9. Зафиксировать выводы

Хороший EDA заканчивается артефактами:

- data dictionary;
- список quality issues;
- prediction contract;
- split strategy;
- список допустимых признаков;
- preprocessing decisions;
- baseline;
- риски и вопросы к владельцу данных.

## Что не является EDA

- автоматически вызвать `describe()` и correlation heatmap;
- удалить все outliers;
- построить сотню графиков без вопросов;
- выбрать features по test;
- сделать causal conclusion из correlation;
- считать missing value ошибкой без контекста.

## Мини-чеклист

1. Что означает одна строка?
2. Уникален ли ключ?
3. Когда появляется target?
4. Какие признаки недоступны в prediction time?
5. Где повторяются users/groups?
6. Как меняются данные по времени?
7. Какие quality checks должны стать кодом?
8. Какая схема validation имитирует production?

## Связи

- [[Data Quality Missing Values and Outliers]] — глубокая диагностика качества.
- [[EDA Relationships Time and Groups]] — связи и temporal patterns.
- [[From EDA to ML Pipeline]] — превращение выводов в pipeline.
- [[Validation Splits and Data Leakage]] — честная оценка.
