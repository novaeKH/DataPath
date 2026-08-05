---
title: ML Foundations
id: concept.ml.ml-foundations
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
aliases:
- Основы машинного обучения
- Machine Learning Foundations
tags:
- ml/classical
- ml/foundations
math_depth: 1
---

# ML Foundations

## Что такое машинное обучение

Машинное обучение строит правило по примерам. Вместо ручного набора условий мы задаём данные, target, допустимый класс моделей и критерий качества. Алгоритм подбирает параметры так, чтобы хорошо работать не только на известных строках, но и на новых объектах.

Пример: для каждого клиента известны возраст, история покупок и факт оттока. Мы хотим оценить вероятность оттока для клиента, которого модель не видела при обучении.

## Четыре части ML-задачи

1. **Объект** — одна строка, для которой делается prediction.
2. **Features** $x$ — информация, доступная в момент решения.
3. **Target** $y$ — правильный ответ, сформированный позже или размеченный человеком.
4. **Metric и action** — как измеряется качество и что происходит после prediction.

Без prediction time и action задача сформулирована неполно. Один и тот же target может требовать разных моделей, если меняются horizon, стоимость ошибки или доступные признаки.

## Обучение с учителем

Есть пары $(x_i, y_i)$.

- classification предсказывает класс или вероятность;
- regression предсказывает число;
- ranking упорядочивает объекты;
- forecasting предсказывает будущее с учётом времени.

Модель $f_\theta(x)$ имеет параметры $\theta$. Обучение минимизирует loss:

$$
\widehat{\theta}
=\arg\min_\theta
\frac{1}{n}\sum_{i=1}^{n}L(y_i,f_\theta(x_i)).
$$

Loss нужен optimizer. Business metric может отличаться: модель обучается на LogLoss, а решение оценивается по стоимости false positive и false negative.

## Обучение без учителя

Target отсутствует. Алгоритм ищет структуру по выбранному objective:

- clustering;
- dimensionality reduction;
- anomaly detection;
- representation learning.

Найденный cluster не является «истинным типом клиента» автоматически. Полезность проверяется устойчивостью, интерпретацией и downstream-задачей.

## Train, validation и test

- train — подобрать параметры;
- validation — выбрать модель, признаки, hyperparameters и threshold;
- test — один раз оценить зафиксированный pipeline.

Split должен имитировать deployment. Для повторяющихся пользователей нужен group split, для будущего — time split. Random split не является универсальным default.

## Generalization

Train score показывает, насколько модель описала известные данные. Нас интересует expected quality на новых данных из production distribution.

Разница возникает из-за:

- конечной выборки;
- noise;
- слишком большой или малой capacity;
- drift;
- leakage;
- неверной validation scheme.

## Bias и variance

**Bias** — систематическая ошибка слишком простой модели. **Variance** — чувствительность к конкретной train-выборке.

- простая linear model может недоучить nonlinear pattern: high bias;
- глубокое дерево может запомнить случайные детали: high variance;
- regularization уменьшает variance ценой некоторого bias;
- ансамбли уменьшают variance или bias разными способами.

Не нужно буквально вычислять bias/variance для каждого проекта: это ментальная модель диагностики underfit и overfit.

## Parameters и hyperparameters

Parameters обучаются из данных: коэффициенты regression, split tree, neural weights.

Hyperparameters задают процесс и capacity: глубина дерева, strength regularization, learning rate, число neighbours. Их выбирают только по validation/CV.

## Preprocessing как часть модели

Imputer, scaler, encoder, PCA и feature selection должны fit только на train. Поэтому настоящий объект оценки — полный pipeline, а не только estimator.

```text
raw data → validation-safe preprocessing → model → calibration/threshold
```

## Baseline

Baseline отвечает: даёт ли сложность реальный выигрыш?

Примеры:

- majority class;
- mean/median;
- logistic/linear regression;
- shallow tree;
- popularity;
- last known value.

Baseline должен быть честным и проходить тот же split.

## Data leakage

Leakage — информация, которая недоступна в реальном prediction или попала из validation/test в обучение.

Типичные источники:

- post-outcome признаки;
- aggregation после cutoff;
- один пользователь в train и validation;
- scaling/PCA на полном dataset;
- target encoding с собственной label;
- многократный подбор по test.

## От score к решению

Модель часто выдаёт score или probability. Business action требует threshold или top-K. Threshold выбирается на validation с учётом costs и capacity, а не автоматически как `0.5`.

## Рабочий цикл

```text
задача → data contract → split → baseline → pipeline → CV
→ error analysis → улучшение → финальный test → monitoring
```

Каждая итерация должна проверять гипотезу, а не добавлять случайную сложность.

## Визуализация

Компонент `bias-variance-playground`:

- пользователь меняет complexity;
- видит train и validation error;
- переключает noise и sample size;
- наблюдает underfit, optimal region и overfit;
- сравнивает один split и несколько train samples.

## Частые ошибки и заблуждения

- высокая train metric означает хорошую модель;
- более сложная модель всегда лучше;
- cross-validation исправляет неверный split;
- feature importance показывает причинность;
- unsupervised cluster имеет объективный смысл;
- test можно смотреть после каждой идеи;
- хороший offline score гарантирует business effect.

## Сравнение: обучение с учителем и без

| | С учителем | Без учителя |
|---|---|---|
| Данные | есть target | нет target |
| Задача | предсказать target | найти структуру |
| Примеры | классификация, регрессия | кластеризация, снижение размерности |
| Оценка | метрики против истины | внутренние метрики, ручная проверка |

Выбор зависит от того, что доступно: если есть размеченные ответы и решение меняется от прогноза — supervised; если нужно понять структуру данных — unsupervised.

## Простой пример

Задача оттока: объект — один клиент, признаки — история покупок к моменту прогноза, target — отток в следующие 30 дней, момент прогноза — конец текущего дня. Это supervised-задача: есть прошлые примеры «ушёл/остался», и решение (скидка, звонок) меняется после прогноза.

## Связи

- [[Validation Splits and Data Leakage]]
- [[ML Metrics and Threshold Selection]]
- [[Regularization]]
- [[From EDA to ML Pipeline]]
- [[Model Selection and Hyperparameter Tuning]]
