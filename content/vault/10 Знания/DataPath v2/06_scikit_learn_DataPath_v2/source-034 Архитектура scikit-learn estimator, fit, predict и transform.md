---
title: "Архитектура scikit-learn: estimator, fit, predict и transform"
id: concept.datapath-v2.034
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 34
canonical_course: "scikit-learn"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Архитектура scikit-learn: estimator, fit, predict и transform

scikit-learn кажется набором отдельных алгоритмов, пока не замечаешь общий контракт. LogisticRegression, StandardScaler, PCA и Pipeline устроены вокруг одного принципа: объект создаётся с гиперпараметрами, `fit` изучает состояние по данным, а затем `predict/transform` используют это состояние на новых объектах.

## Estimator API

Обычно объект создаётся так: `Model(param=value)`. Конструктор задаёт гиперпараметры, но не должен обучаться на данных. После `fit(X, y)` fitted attributes часто имеют суффикс `_`: например `coef_`, `classes_`, `mean_`.

## `fit`

`fit` извлекает из training data состояние, нужное далее. Для scaler это mean/std; для PCA — компоненты; для classifier — параметры decision function. Поэтому `fit` на validation/test означает leakage.

## `transform`

Transformer преобразует X, используя состояние из `fit`. `StandardScaler.transform` применяет train mean/std; `OneHotEncoder.transform` использует обученный vocabulary.

## `fit_transform`

Семантически `fit` + `transform` на той же выборке, хотя некоторые классы могут иметь оптимизированную реализацию. Его удобно использовать на train, но не на validation: validation получает только `transform`.

## `predict`, `predict_proba`, `decision_function`

Разные estimators предоставляют разные методы. `predict` возвращает final labels/values. `predict_proba` — probabilities, если model их определяет. `decision_function` — raw/margin-like scores и не обязан быть probability.

## Cloneability

sklearn model selection создаёт независимые copies estimator из constructor parameters. Поэтому параметры конструктора должны однозначно описывать unfitted estimator; fitted state хранится отдельно.

## Feature names and shapes

Современные sklearn transformers часто умеют работать с DataFrame/feature names, но нельзя полагаться на случайный column order. Schema должна быть стабильной.

## Один объект на всём жизненном цикле

Рассмотрим `StandardScaler`. До обучения объект хранит только выбранные гиперпараметры. Вызов `fit(X_train)` вычисляет среднее и масштаб каждого признака и сохраняет их в атрибутах `mean_` и `scale_`. Затем `transform(X_valid)` использует именно эти обучающие значения; validation не должна менять состояние объекта.

У классификатора жизненный цикл тот же. `LogisticRegression(C=1.0)` задаёт конфигурацию, `fit` подбирает коэффициенты, `decision_function` возвращает числовой score, `predict_proba` преобразует его в вероятности классов, а `predict` применяет правило выбора метки. Эти методы отвечают на разные вопросы и не являются взаимозаменяемыми.

Подчёркивание в конце обученного атрибута помогает отличать результат `fit` от гиперпараметра конструктора. Если обратиться к `coef_` до обучения, состояние ещё не существует. При кросс-валидации scikit-learn клонирует не обученный объект по параметрам конструктора и отдельно обучает копию на каждом fold.

Чтобы избежать тихих ошибок, фиксируйте контракт входа: названия и порядок колонок, типы, допустимые пропуски. Модель, получившая те же числа в другом порядке, выполнит вычисление, но даст бессмысленный прогноз.

## Практический код

```python
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

scaler = StandardScaler()
scaler.fit(X_train)

X_train_scaled = scaler.transform(X_train)
X_valid_scaled = scaler.transform(X_valid)

model = LogisticRegression()
model.fit(X_train_scaled, y_train)

proba = model.predict_proba(X_valid_scaled)[:, 1]
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- fit scaler/encoder на полном dataset
- считать `decision_function` probability
- искать `coef_` до fit
- менять column order между train/inference
- путать hyperparameters и fitted attributes

## Проверка понимания

1. Что делает constructor estimator?
2. Что делает fit?
3. Почему fitted attributes часто заканчиваются `_`?
4. fit_transform где допустим?
5. predict_proba vs decision_function?
6. Почему preprocessing fit only train?

## Мини-практика

Возьмите `StandardScaler` и `LogisticRegression`. Для каждого перечислите: гиперпараметры до fit, fitted state после fit и методы, используемые на validation.

## Что нужно унести

scikit-learn строится вокруг чёткого lifecycle: configure → fit on train → reuse fitted state on unseen data. Эта дисциплина и делает Pipeline естественным следующим шагом.

## Куда дальше

Следующий урок объединит preprocessing и model в один Pipeline, чтобы leakage было сложнее создать случайно.
