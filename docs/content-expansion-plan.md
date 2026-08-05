# DataPath — Content Expansion Plan (Фаза 6A)

План расширения Obsidian-хранилища, упорядоченный по приоритетам.
Ничего не изменяется автоматически — все правки требуют ручного подтверждения
и выполняются непосредственно в Obsidian.

## Коррекции из completion-паса Фазы 6A (требуют правки content/vault)

| # | Target ID | Файл | Проблема | Предлагаемое исправление | Статус |
|---|---|---|---|---|---|
| C1 | Все lesson | `05 Курсы/Классический ML/Уроки/*.md` | datapath `source_heading: "Коротко"/"Интуиция"` не существует в source-заметках; аудит показывает `source_heading_fallback` | Обновить `source_heading` на реальные H2 | **исправлено (Phase 6A.1)**: «Коротко»→«Идея за 30 секунд» (12 уроков, →«Цель» для 13-го), «Интуиция»→ближайший H2 |
| C2 | `concept.ml.xgboost-lightgbm-and-catboost` | `10 Знания/ML/01 Classical ML/XGBoost LightGBM and CatBoost.md` | Список критериев сравнения («на одинаковых folds; …») — валидный Markdown; маркеры терял frontend | Правка vault НЕ требуется (рендер исправлен: `list-disc`/`list-decimal` в MarkdownContent) | закрыто без правки vault |
| C3 | `concept.ml.decision-trees` | `10 Знания/ML/01 Classical ML/Decision Trees.md` | Gain formula: источник корректен; проблема была в sanitize (KaTeX style) | Правка vault НЕ требуется (исправлено в `MarkdownContent.tsx`) | закрыто без правки vault |

Черновиков в `docs/content-drafts/`: **7 файлов** (см. раздел «Черновики»).

## Priority 1 — до RAG (критические исправления) — **ВЫПОЛНЕНО (Phase 6A.1)**

| # | Target ID | Файл | Проблема | Предлагаемые секции | Статус |
|---|---|---|---|---|---|
| 1.1 | Все lesson | `05 Курсы/.../Уроки/*.md` | datapath source_heading не совпадает | Обновить source_heading на реальные H2 | ✅ исправлено |
| 1.2 | `concept.ml.decision-trees` | `10 Знания/ML/01 Classical ML/Decision Trees.md` | Нет численного примера split | ## Пример расчёта Gain с числами | ✅ интегрировано |
| 1.3 | `concept.ml.regularization` | `10 Знания/ML/01 Classical ML/Regularization.md` | Нет численного примера coefficients | ## Пример: Lasso vs Ridge | ⏸ deferred (пример bias/variance для деревьев добавлен в DT) |
| 1.4 | Все concept | `10 Знания/ML/01 Classical ML/*.md` | Нет interview-ответов | ## Ответ для собеседования | ✅ интегрировано (DT, BV, RF, GB, CB, Ensemble) |

**Skills:** `ml.tree_ensembles`, `ml.bias_variance_regularization`, `ml.error_analysis`
**Scene roles:** example, interview_summary
**Нужно:** текст

---

## Priority 2 — качество MVP

| # | Target ID | Файл | Проблема | Предлагаемые секции | Цель |
|---|---|---|---|---|---|
| 2.1 | `concept.ml.decision-trees` | То же | Нет визуализации | ## Визуализация дерева (Mermaid или описание графика) | Уровень Solid |
| 2.2 | `concept.ml.regularization` | То же | Нет графика coefficient paths | ## Визуализация: L1 vs L2 paths | Уровень Solid |
| 2.3 | `concept.ml.bagging-and-random-forest` | `Bagging and Random Forest.md` | Нет кода | ## Пример: Random Forest на sklearn | Уровень Solid |
| 2.4 | `concept.ml.gradient-boosting` | `Gradient Boosting.md` | Нет численного примера | ## Пример: 3 шага boosting на synthetic data | ✅ интегрировано (Phase 6A.1) |
| 2.5 | Новый `concept.ml.ensemble-comparison` | Новый файл | Нет канонического сравнения | ## Когда что выбирать: DT/RF/GB/CB | ✅ интегрировано (Phase 6A.1, concept-заметка) |
| 2.6 | `concept.ml.xgboost-lightgbm-and-catboost` | То же | Нет графика сравнения | ## Визуализация: learning curves трёх библиотек | Уровень Solid |
| 2.7 | Все concept | Все файлы | Нет interview-ответов | ## Ответ для собеседования | ✅ интегрировано (Phase 6A.1) |
| 2.8 | Все concept | Все файлы | Нет checkpoints | Дополнительные вопросы в lessons | Уровень Solid |

**Skills:** все навыки MVP-маршрута
**Scene roles:** example, code, visualization, comparison, interview_summary
**Нужно:** текст, код, график (Mermaid/SVG), таблица

---

## Priority 3 — расширение базы (после качественного MVP)

Темы для добавления после завершения MVP-маршрута:

| Тема | Content ID | Приоритет |
|---|---|---|
| Linear Regression | `concept.ml.linear-regression` | high |
| Logistic Regression | `concept.ml.logistic-regression` | high |
| Метрики классификации | `concept.ml.classification-metrics` | high |
| Preprocessing | `concept.ml.preprocessing` | medium |
| Feature Engineering | `concept.ml.feature-engineering` | medium |
| K-Means | `concept.ml.kmeans` | medium |
| PCA | `concept.ml.pca` | medium |
| KNN | `concept.ml.knn` | medium |
| Naive Bayes | `concept.ml.naive-bayes` | medium |
| XGBoost/LightGBM deep | `concept.ml.xgboost-deep` | low |
| Deep Learning intro | `concept.dl.intro` | low |
| Transformers | `concept.dl.transformers` | low |
| NLP basics | `concept.nlp.basics` | low |
| Recommendation Systems | `concept.ml.recsys` | low |
| SQL for DS | `concept.sql.basics` | low |
| A/B Testing | `concept.stats.ab-testing` | low |
| Time Series | `concept.ml.time-series` | low |
| MLOps intro | `concept.mlops.intro` | low |

---

## Зависимости

- Priority 1 изменения **не зависят** друг от друга (можно выполнять параллельно);
- Priority 2.5 (comparison note) зависит от 1.2–1.4 (нужны примеры для сравнения);
- Priority 3 — полностью независимо от 1 и 2.
