---
title: Trees and Random Forest — Interview
type: interview
area: career
status: active
aliases:
  - Trees Random Forest Interview
tags:
  - interview/ml
id: interview.career.trees-and-random-forest-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Trees and Random Forest — Interview

> Knowledge: [[Decision Trees]], [[Bagging and Random Forest]].

## Вопрос 1 — Как дерево выбирает split?

### Ответ 20–30 секунд

Для candidate split дерево сравнивает impurity parent с weighted impurity children и выбирает maximum gain. В classification используют Gini/entropy, в regression часто squared error. Алгоритм greedy: лучший локальный split не гарантирует globally optimal tree.

### Если попросят глубже

Criterion — surrogate и может не совпадать с business metric. Для numeric feature проверяют границы между sorted distinct values.

### Follow-up

- Почему scaling дереву обычно не нужен?
- Что хранится в regression leaf?

### Связанные знания

- [[Decision Trees]]

## Вопрос 2 — Почему дерево переобучается?

### Ответ 20–30 секунд

Deep tree может создавать leaves на единичных объектах и запоминать noise. Tree нестабилен: небольшой change sample меняет early split и большую часть structure. Ограничиваю `max_depth`, `min_samples_leaf`, leaves или применяю pruning, выбирая параметры по честной validation.

### Если попросят глубже

Сначала исключаю leakage и duplicates: structural regularization не лечит неверный split.

### Follow-up

- Чем `min_samples_split` отличается от `min_samples_leaf`?
- Почему probabilities малых leaves нестабильны?

### Связанные знания

- [[Decision Trees]]
- [[Validation Splits and Data Leakage]]

## Вопрос 3 — Почему Random Forest снижает variance?

### Ответ 20–30 секунд

Forest усредняет predictions high-variance trees. Bootstrap меняет train sample, random feature subsets уменьшают correlation trees. Variance average падает с числом trees только для не полностью correlated errors; общий correlated component остаётся.

### Если попросят глубже

Меньший `max_features` повышает diversity, но может увеличить bias. Больше trees стабилизирует Monte Carlo average, но увеличивает latency/memory.

### Follow-up

- Зачем random features, если bootstrap уже различает trees?
- Может ли forest overfit?

### Связанные знания

- [[Bagging and Random Forest]]
- [[Expectation Variance Covariance and Correlation]]

## Вопрос 4 — Что такое OOB?

### Ответ 20–30 секунд

В bootstrap sample остаётся примерно $63.2\%$ unique train objects; около $36.8\%$ не попадает в конкретный tree и называется OOB. Prediction объекта агрегируют по trees, где он OOB, получая internal validation estimate.

### Если попросят глубже

OOB не заменяет GroupKFold/time split и не защищает от preprocessing leakage. Многократный tuning по OOB тоже создаёт selection bias.

### Follow-up

- Откуда берутся 63.2%?
- Можно ли калибровать probabilities по OOB?

### Связанные знания

- [[Bagging and Random Forest]]
- [[Validation Splits and Data Leakage]]

## Вопрос 5 — Random Forest или Gradient Boosting?

### Ответ 20–30 секунд

Forest обучает trees независимо и усредняет — primarily снижает variance и хорошо parallelizes. Boosting обучает последовательно по gradients и часто снижает bias сильнее, но чувствительнее к tuning/early stopping. Выбираю по одинаковым folds, metric, latency и stability.

### Если попросят глубже

Оба используют trees, но optimization objective и dependence learners различаются.

### Follow-up

- Почему boosting нельзя обучить полностью параллельно по trees?
- Что лучше при малом noisy dataset?

### Связанные знания

- [[Bagging and Random Forest]]
- [[Gradient Boosting]]
