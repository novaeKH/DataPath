# DataPath — MVP Content Coverage (Фаза 6A.1)

Покрытие 6 тем MVP-маршрута по 15 измерениям качества.
Статусы: **good** / **partial** / **missing** / **needs correction** / **N/A**.

## Decision Tree (урок 07)

- **Content ID:** `concept.ml.decision-trees`
- **Lesson ID:** `lesson.classic-ml.trees.tree`
- **Skills:** `ml.tree_ensembles`
- **Source:** `10 Знания/ML/01 Classical ML/Decision Trees.md`

| Измерение | Статус | Примечание |
|---|---|---|
| motivation | good | Есть «Идея за 30 секунд» |
| intuition | good | «Как строится prediction» |
| mechanism/algorithm | good | Split gain, criteria |
| mathematics | good | Gini, Entropy, Gain, MSE |
| example | good | Численный пример Gain с Gini и checkpoint |
| visualization | missing | Нет графика дерева |
| code | good | Псевдокод структуры дерева |
| hyperparameters | partial | Упомянуты depth, leaves, но без таблицы |
| pitfalls | good | Overfit, scaling, importance bias |
| comparison | N/A | — |
| practice | good | 2 лаборатории (split + overfitting) |
| review | good | 3 review templates |
| case | partial | Участвует в ensemble-кейсе |
| interview answer | good | «Ответ для собеседования» (3–4 предложения) |
| RAG readiness | good | Чёткие H2, самодостаточные секции |

**Что сделано хорошо:** структура, математика, pitfalls.
**Чего не хватает:** численный пример split, визуализация дерева, ответ для собеседования.

---

## Bias/Variance (урок 06)

- **Content ID:** `concept.ml.regularization`
- **Lesson ID:** `lesson.classic-ml.linear.regularization`
- **Skills:** `ml.bias_variance_regularization`
- **Source:** `10 Знания/ML/01 Classical ML/Regularization.md`

| Измерение | Статус | Примечание |
|---|---|---|
| motivation | good | «Идея за 30 секунд» |
| intuition | good | Penalized objective |
| mechanism/algorithm | good | L2/L1/Elastic Net, Bayesian interpretation |
| mathematics | good | Все формулы с расшифровкой |
| example | partial | Нет численного примера coefficients |
| visualization | missing | Нет графика coefficient paths |
| code | partial | Только предупреждение о scaling leakage |
| hyperparameters | partial | Упомянуты alpha, lambda, но без таблицы |
| pitfalls | good | Scaling, intercept, неверная сила |
| comparison | partial | L2 vs L1 vs Elastic Net |
| practice | partial | 1 лаборатория (overfitting, косвенно) |
| review | good | 3 review templates |
| case | partial | Участвует в ensemble-кейсе |
| interview answer | good | «Ответ для собеседования» (3–4 предложения) |
| RAG readiness | good | Чёткая структура |

**Что сделано хорошо:** математика, Bayesian интерпретация.
**Чего не хватает:** численный пример, визуализация coefficient paths, interview.

---

## Random Forest (урок 08)

- **Content ID:** `concept.ml.bagging-and-random-forest`
- **Lesson ID:** `lesson.classic-ml.trees.forest`
- **Skills:** `ml.tree_ensembles`, `ml.bias_variance_regularization`
- **Source:** `10 Знания/ML/01 Classical ML/Bagging and Random Forest.md`

| Измерение | Статус | Примечание |
|---|---|---|
| motivation | good | «Идея за 30 секунд» |
| intuition | good | Bootstrap + aggregation |
| mechanism/algorithm | good | Bagging, RF steps, Extra Trees |
| mathematics | good | Variance decomposition, OOB |
| example | partial | Нет численного примера |
| visualization | missing | Нет схемы RF |
| code | missing | Нет кода |
| hyperparameters | partial | Упомянуты n_estimators, max_features |
| pitfalls | good | Failure modes (time series, categories) |
| comparison | partial | Bagging vs RF vs Extra Trees |
| practice | good | 1 лаборатория (ensemble-comparison) |
| review | good | 3 review templates |
| case | partial | Участвует в ensemble-кейсе |
| interview answer | good | «Ответ для собеседования» (3–4 предложения) |
| RAG readiness | good | Чёткая структура |

**Что сделано хорошо:** объяснение variance reduction, OOB, failure modes.
**Чего не хватает:** код, визуализация, interview.

---

## Gradient Boosting (урок 09)

- **Content ID:** `concept.ml.gradient-boosting`
- **Lesson ID:** `lesson.classic-ml.trees.boosting`
- **Skills:** `ml.tree_ensembles`, `ml.error_analysis`
- **Source:** `10 Знания/ML/01 Classical ML/Gradient Boosting.md`

| Измерение | Статус | Примечание |
|---|---|---|
| motivation | good | «Идея за 30 секунд» |
| intuition | good | Additive model, residuals |
| mechanism/algorithm | good | Pseudo-residuals, sequential training |
| mathematics | good | Loss derivatives, squared error, LogLoss |
| example | partial | Нет численного примера boosting steps |
| visualization | missing | Нет схемы ансамбля |
| code | good | Псевдокод boosting |
| hyperparameters | good | Learning rate, iterations, subsampling |
| pitfalls | good | Failure modes |
| comparison | partial | Упомянуто отличие от bagging |
| practice | good | 1 лаборатория (ensemble-comparison) |
| review | good | 3 review templates |
| case | partial | Участвует в ensemble-кейсе |
| interview answer | good | «Ответ для собеседования» (3–4 предложения) |
| RAG readiness | good | Чёткая структура |

**Что сделано хорошо:** математика pseudo-residuals, hyperparameters.
**Чего не хватает:** численный пример шагов, визуализация, interview.

---

## CatBoost / Libraries (урок 10)

- **Content ID:** `concept.ml.xgboost-lightgbm-and-catboost`
- **Lesson ID:** `lesson.classic-ml.trees.libraries`
- **Skills:** `ml.tree_ensembles`
- **Source:** `10 Знания/ML/01 Classical ML/XGBoost LightGBM and CatBoost.md`

| Измерение | Статус | Примечание |
|---|---|---|
| motivation | good | «Идея за 30 секунд» |
| intuition | good | Общая основа GB |
| mechanism/algorithm | good | XGBoost 2nd order, LGBM histogram, CB ordered |
| mathematics | good | Все формулы (Gain, Hessian, ordered TS) |
| example | partial | Нет сравнительного примера на данных |
| visualization | missing | Нет графиков сравнения |
| code | good | Псевдокод |
| hyperparameters | good | Tuning order описан |
| pitfalls | good | Failure modes для каждой библиотеки |
| comparison | good | Таблица сравнения трёх библиотек |
| practice | good | 1 лаборатория (ensemble-comparison) |
| review | good | 2 review templates |
| case | partial | Участвует в ensemble-кейсе |
| interview answer | good | «Ответ для собеседования» (3–4 предложения) |
| RAG readiness | good | Чёткая структура |

**Что сделано хорошо:** сравнение библиотек, tuning order, pitfalls.
**Чего не хватает:** пример на данных, визуализация, interview.

---

## Model Comparison

- **Content ID:** `concept.ml.ensemble-comparison` (новая concept-заметка, Phase 6A.1)
- **Кейс:** `case.classic-ml.tree-ensemble-choice`

| Измерение | Статус |
|---|---|
| Каноническая concept-заметка | **good** (создана `Ensemble Comparison.md`) |
| Сравнительная таблица | good (в concept-заметке + в уроке 10) |
| Decision framework | good («Decision framework — когда что выбирать») |
| Interview answer | good («Ответ для собеседования») |
| Standalone lesson | N/A (не создавался — требует code changes; текущий MVP-маршрут сохранён) |
| Связи | good (связан с DT, RF, GB, CB, regularization, case) |

---

## Сводка по MVP-маршруту

| Тема | Общая оценка | Приоритетные пробелы |
|---|---|---|
| Decision Tree | Solid | Визуализация |
| Bias/Variance | Solid | Визуализация |
| Random Forest | Solid | Код, визуализация |
| Gradient Boosting | Solid | Визуализация |
| CatBoost | Solid | Визуализация |
| Model Comparison | Solid | Визуализация |

## Сцены шести тем (Фаза 6A, фактические значения через текущий parser)

| Тема | Lesson ID | Source content ID | Сцен было | Сцен сейчас |
|---|---|---|---|---|
| Decision Tree | `lesson.classic-ml.trees.tree` | `concept.ml.decision-trees` | 26 | 18 |
| Bias/Variance | `lesson.classic-ml.linear.regularization` | `concept.ml.regularization` | 30 | 19 |
| Random Forest | `lesson.classic-ml.trees.forest` | `concept.ml.bagging-and-random-forest` | 22 | 18 |
| Gradient Boosting | `lesson.classic-ml.trees.boosting` | `concept.ml.gradient-boosting` | 28 | 21 |
| CatBoost | `lesson.classic-ml.trees.libraries` | `concept.ml.xgboost-lightgbm-and-catboost` | 35 | 25 |
| Model Comparison | нет отдельного урока; concept-заметка `concept.ml.ensemble-comparison` + кейс `case.classic-ml.tree-ensemble-choice` + сцены «Сравнение»/«Практический tuning order» внутри урока CatBoost | `concept.ml.ensemble-comparison` | — | — |

**Общий вывод:** MVP-маршрут имеет хорошую теоретическую базу (Solid по всем 6 темам). После Phase 6A.1: численные примеры (Gain, boosting steps, CatBoost leakage), interview answers и concept-заметка сравнения ансамблей интегрированы. Оставшиеся пробелы: визуализации (графики, Mermaid-диаграммы), код (sklearn-примеры), доп. checkpoints. Критических проблем с контентом нет. Готово к Phase 6B RAG-индексации.

