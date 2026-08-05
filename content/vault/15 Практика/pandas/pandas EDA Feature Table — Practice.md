---
title: pandas EDA Feature Table — Practice
id: practice.pandas.eda-feature-table
type: practice
area: pandas
schema_version: 2
language: ru
status: active
rag: include
rag_collection: practice
app: source
practice_kind: mini-case
skill_ids:
- pandas.groupby
- pandas.merge
- eda.quality
estimated_minutes: 90
tags:
- practice/pandas
- practice/eda
---

# pandas EDA Feature Table — Practice

## Сценарий

Есть `users`, `orders`, `events`. Постройте feature table на cutoff date.

## Требования

1. Определить grain каждой таблицы.
2. Проверить ключи и join cardinality.
3. Посчитать historical count/sum/recency до cutoff.
4. Не включить future events.
5. Добавить data-quality report.
6. Построить три графика, каждый отвечает на конкретный вопрос.
7. Подготовить список features для sklearn Pipeline.

## Артефакты

- `features.parquet`;
- notebook/report с выводами;
- функции построения features;
- tests на cutoff и row count.

## Связи

- [[pandas GroupBy Merge and Reshape]]
- [[Exploratory Data Analysis Workflow]]
- [[From EDA to ML Pipeline]]
