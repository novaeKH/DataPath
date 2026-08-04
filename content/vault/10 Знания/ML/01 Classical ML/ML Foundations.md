---
title: ML Foundations
type: concept
area: ml
status: active
aliases:
  - Основы машинного обучения
  - Bias variance overfitting
tags:
  - ml/classical
  - ml/foundations
math_depth: 1
id: concept.ml.ml-foundations
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# ML Foundations

## Идея за 30 секунд

Machine Learning выбирает функцию по данным так, чтобы она хорошо работала на новых объектах. Качество определяется не только алгоритмом: сначала фиксируют объект, target, момент прогноза, доступные признаки, split и metric. Training error показывает fit к наблюдённой выборке; generalization проверяется на данных, которые не участвовали в выборе модели.

## Типы задач

- **Regression** — численный target.
- **Classification** — класс или probability класса.
- **Ranking** — порядок кандидатов.
- **Clustering** — структура без labels.
- **Dimensionality reduction** — компактное представление.
- **Anomaly detection** — редкие нетипичные объекты.
- **Recommendation** — персональный retrieval/ranking.
- **Forecasting** — prediction с временным порядком.

Supervised learning использует target. Unsupervised learning ищет структуру без размеченной цели. Self-supervised learning создаёт supervision из самих данных, например предсказывает masked или next token.

## Постановка задачи

До выбора модели нужно ответить:

1. что является одной строкой или sequence;
2. какой estimand/target нужен бизнесу;
3. в какой момент строится prediction;
4. какие данные реально доступны в этот момент;
5. какое решение будет принято по prediction.

Ошибка в постановке может дать высокий offline score для бесполезной или утечечной модели.

## Parameters, hyperparameters и learning

Parameters оцениваются из train data:

- coefficients linear model;
- split thresholds и leaf values;
- weights neural network.

Hyperparameters задают family или процесс:

- regularization strength;
- tree depth;
- number of neighbors;
- learning rate.

Hyperparameters тоже выбираются по данным — через validation/CV. Поэтому test не должен участвовать ни в feature engineering decisions, ни в tuning.

## Baseline

Baseline — самое простое разумное решение:

- mean/median для regression;
- frequent class или calibrated prevalence для classification;
- popularity для recommendation;
- last observed value для forecasting;
- linear model до сложного ensemble.

Baseline проверяет target, metric, split и оправданность complexity. Сложная модель без корректного baseline не доказывает ценность.

## Bias и variance

Bias — systematic error из слишком ограниченного model family или неверных assumptions. Variance — чувствительность fitted model к конкретной train sample.

Рабочая диагностика:

- train и validation плохи → вероятен высокий bias, слабые features или optimization problem;
- train хорош, validation заметно хуже → вероятен высокий variance, leakage или distribution mismatch;
- оба хороши offline, production плох → проверить shift, feedback loops, latency и feature availability.

Bias–variance — mental model, а не единственная причина error. Label noise и irreducible uncertainty остаются даже у правильной модели.

## Overfitting

Overfitting — модель использует закономерности train sample, которые не воспроизводятся на новых данных.

Проверять в порядке:

1. честность split и отсутствие leakage;
2. корректность metric и implementation;
3. стабильность по folds, time и segments;
4. capacity модели;
5. regularization и early stopping;
6. качество и объём данных.

«Уменьшить depth» не лечит leakage, а «добавить данных» не исправляет неверный target.

## Underfitting

Причины:

- model family не выражает нужную зависимость;
- features не содержат signal;
- regularization слишком сильна;
- optimization не сошлась;
- label/target сформирован неверно.

Увеличивать complexity стоит после проверки pipeline и baseline.

## Feature selection

- **Filter**: variance, correlation, mutual information без fitted final model.
- **Wrapper**: сравнение feature subsets через model/CV.
- **Embedded**: L1, tree splits и другие model-specific mechanisms.

Любой data-driven selection выполняется внутри training/CV. Feature importance не является доказательством causality.

## Связи

- [[Validation Splits and Data Leakage]] — честная оценка generalization.
- [[ML Metrics and Threshold Selection]] — измерение качества с учётом задачи и решения.
- [[Regularization]] — управляет trade-off между fit и stability.
- [[Linear Regression]] — прозрачный regression baseline.
- [[Logistic Regression]] — вероятностный classification baseline.
- [[ML Basics and Linear Models — Interview]] — короткая проверка знаний.
