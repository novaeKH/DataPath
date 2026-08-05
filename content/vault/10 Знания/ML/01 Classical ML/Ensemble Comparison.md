---
title: Ensemble Comparison
type: concept
area: ml
status: active
aliases:
  - Сравнение ансамблей
  - Model comparison
  - Как выбрать модель для табличных данных
tags:
  - ml/classical
  - ml/ensembles
math_depth: 1
id: concept.ml.ensemble-comparison
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
skills:
  - ml.tree_ensembles
  - ml.bias_variance_regularization
  - ml.error_analysis
---
# Ensemble Comparison

## Идея за 30 секунд

Для табличных данных baseline — Random Forest (стабилен, не требует сложной предобработки, даёт честную OOB-оценку). Если нужно максимальное качество — Gradient Boosting (XGBoost/LightGBM/CatBoost). CatBoost предпочтителен при обилии категориальных признаков. Decision Tree — для интерпретируемости и как building block ансамблей. Выбор всегда проверяется на одинаковых folds, metric и latency constraints.

## Сравнительная таблица

| Критерий | Decision Tree | Random Forest | Gradient Boosting |
|---|---|---|---|
| **Интерпретируемость** | Отличная (видны правила) | Средняя (feature importance) | Низкая (чёрный ящик) |
| **Качество (tabular)** | Низкое–среднее | Хорошее | Отличное (SOTA) |
| **Скорость обучения** | Быстрая | Средняя (можно параллельно) | Медленная (последовательно) |
| **Скорость инференса** | Быстрая | Средняя ($M$ деревьев) | Средняя ($M$ деревьев) |
| **Чувствительность к шуму** | Высокая (overfit) | Низкая (averaging) | Средняя (early stopping) |
| **Пропуски в данных** | Поддерживает (surrogate splits) | Не нативно | Зависит от библиотеки |
| **Категориальные признаки** | Требуют кодирования | Требуют кодирования | CatBoost: нативно |
| **Out-of-bag оценка** | Нет | Да (честная валидация) | Нет (нужен validation set) |
| **GPU-обучение** | Нет | Нет | Да (XGBoost, LightGBM, CatBoost) |

## Decision framework — когда что выбирать

### Быстрый выбор

**Меньше 1 000 объектов:**
Decision Tree (интерпретируемость) или Random Forest (качество). Boosting при таком объёме почти всегда overfit.

**1 000 – 100 000 объектов:**
- Нужна интерпретируемость → Decision Tree (визуализация правил).
- Табличные данные, смешанные типы → Random Forest (хороший baseline).
- Нужно максимальное качество → Gradient Boosting с early stopping.

**Больше 100 000 объектов:**
- Много категориальных признаков → CatBoost (ordered encoding без leakage).
- Важна скорость обучения → LightGBM (histograms, leaf-wise growth).
- Нужна тонкая настройка → XGBoost (зрелая экосистема, explicit regularization).

### Практические правила

1. **Всегда начинать с Random Forest как baseline** — стабилен, мало гиперпараметров, честная OOB-оценка заменяет validation set для грубой прикидки.
2. **Переходить к boosting только если RF-качество недостаточно** — boosting требует больше tuning и validation discipline.
3. **Сравнивать модели честно:** одинаковые folds, одинаковая метрика, одинаковый preprocessing, early stopping на validation, calibration вероятностей перед сравнением.
4. **Не выбирать модель по одной метрике:** смотреть на latency инференса, память, стабильность на разных random seeds, calibration quality.

## Типичные ошибки выбора

1. **Использовать глубокое дерево на малых данных** — переобучение; RF или GB с early stopping лучше.
2. **Настраивать XGBoost без валидации** — tuning по test-выборке даёт смещённую оценку качества.
3. **Игнорировать CatBoost для категорий** — ручное кодирование (OneHot, Label) часто хуже ordered target statistic.
4. **Выбирать boosting, когда важна интерпретируемость** — банки и медицина часто требуют explainability → Decision Tree или RF с SHAP.
5. **Сравнивать модели без калибровки вероятностей** — RF и GB дают разные шкалы «уверенности»; требуется Platt scaling или isotonic regression.
6. **Считать feature importance causal** — impurity-based importance biased в пользу continuous/high-cardinality признаков; permutation importance на validation ближе к реальности, но тоже страдает при корреляции.

## Ответ для собеседования

«Для табличных данных baseline — Random Forest: стабилен, не требует сложного тюнинга, даёт честную OOB-оценку. Если нужно максимальное качество — Gradient Boosting (XGBoost/LightGBM/CatBoost). CatBoost предпочтителен при большом количестве категориальных признаков — ordered encoding защищает от data leakage. LightGBM быстрее на больших данных за счёт histogram-based обучения. Decision Tree использую для интерпретируемости, визуализации правил и как building block для ансамблей. Важно: boosting-модели нельзя обучать параллельно — каждый шаг зависит от предыдущего. Всегда сравниваю на одинаковых folds с early stopping и калибрую вероятности перед сравнением по вероятностным метрикам.»

## Связи

- [[Decision Trees]] — base learner и интерпретируемый baseline.
- [[Bagging and Random Forest]] — parallel averaging, OOB, variance reduction.
- [[Gradient Boosting]] — sequential correction, pseudo-residuals.
- [[XGBoost LightGBM and CatBoost]] — инженерные реализации, таблица сравнения библиотек.
- [[Regularization]] — bias/variance trade-off, лежащий в основе выбора модели.
- [[ML Foundations]] — bias–variance decomposition.
- [[03 Мини-кейс — Выбор ансамбля для оттока]] — практический кейс выбора модели.
