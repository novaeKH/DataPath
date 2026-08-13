---
title: "Выбор модели и настройка гиперпараметров — как искать улучшения без переобучения на validation"
id: concept.datapath-v2.059
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 59
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Выбор модели и настройка гиперпараметров

После нескольких недель работы можно получить:

```text
Logistic Regression
Random Forest
CatBoost
XGBoost
SVM
```

и десятки parameters для каждого.

Возникает соблазн:

> перебрать как можно больше вариантов и взять максимальный score.

Но model selection сама является процессом обучения.

Если долго выбирать по одному validation set, можно **переобучиться на validation**, даже если каждый estimator никогда напрямую не обучался на этих labels.

Главная цель урока:

```text
baseline
→ reasonable candidate families
→ cross-validation
→ bounded search
→ analyze stability
→ freeze choice
→ final test
```

---

## 1. Параметры и гиперпараметры

**Параметры model** находятся во время `fit()`:

```text
linear coefficients
tree splits
neural weights
```

**Гиперпараметры (hyperparameters)** задают configuration обучения:

```text
max_depth
C
learning_rate
n_estimators
```

Их выбирает Data Scientist или search procedure.

---

## 2. Почему нельзя тюнить до baseline

Если сразу открыть Optuna и запустить 5000 trials, мы не знаем:

- сколько дал algorithm family;
- сколько дал preprocessing;
- сколько дал tuning;
- нужен ли вообще complex estimator.

Сначала:

```text
simple baseline
→ stronger default models
→ только потом tuning
```

Так легче объяснить реальный incremental value.

---

## 3. Сравнивать нужно на одинаковых folds

Плохо:

```text
LogReg → random split A
RF     → random split B
Cat    → random split C
```

Разница score может отражать разницу split.

Правильно:

> candidate models получают одинаковую validation scheme.

Для time/group data — одинаковые time/group folds.

---

## 4. Среднее и разброс

Модель A:

```text
0.81, 0.82, 0.80, 0.81, 0.82
```

Модель B:

```text
0.85, 0.73, 0.87, 0.75, 0.86
```

Mean B может быть похож или выше, но instability намного больше.

Поэтому сравниваем:

- mean;
- std;
- worst folds;
- segment metrics;
- train–validation gap;
- latency.

---

## 5. GridSearchCV

**Grid search** перебирает все combinations заданной сетки.

```python
param_grid = {
    "max_depth": [3, 5, 8],
    "min_samples_leaf": [5, 20, 50],
}
```

Получается 9 configurations.

Плюс: полный контроль.

Минус: combinatorial explosion.

10 values для 5 parameters:

\[
10^5=100000
\]

configurations.

Grid полезен для маленького осмысленного пространства.

---

## 6. RandomizedSearchCV

**Randomized search** выбирает ограниченное число configurations из distributions.

В scikit-learn:

```python
from sklearn.model_selection import RandomizedSearchCV

search = RandomizedSearchCV(
    estimator=model,
    param_distributions=params,
    n_iter=50,
    scoring="average_precision",
    cv=cv,
    random_state=42,
)
```

Главный плюс:

> computational budget задаётся напрямую через `n_iter`.

Для continuous parameters разумнее sampling distributions, чем грубая grid.

---

## 7. Почему random search часто эффективнее grid

Представим 5 parameters, но реально quality сильно зависит только от двух.

Grid тратит много trials на variation мало влияющих dimensions.

Random search чаще исследует больше разных values важных parameters при том же budget.

Это не значит, что random всегда лучше. Для финальной локальной области маленькая grid может быть очень удобна.

---

## 8. Log scale для scale-like parameters

Параметры:

```text
C
alpha
learning_rate
regularization strength
```

часто разумнее исследовать по log scale:

```text
1e-4
1e-3
1e-2
1e-1
1
10
100
```

Разница между 0.001 и 0.01 часто важнее, чем между 100.0 и 100.01.

---

## 9. Pipeline parameters

Если model внутри Pipeline:

```python
Pipeline([
    ("prep", preprocessor),
    ("model", LogisticRegression()),
])
```

parameters задаются:

```text
model__C
prep__...
```

Это позволяет tuning preprocessing и estimator внутри одной CV boundary.

Но не надо делать search space гигантским без hypothesis.

---

## 10. `best_score_` не является честной final estimate

Search выбирает configuration с максимальным CV score среди множества candidates.

Из-за selection noise winner обычно имеет оптимистичное отклонение.

Поэтому scikit-learn documentation отдельно напоминает:

> validation score, по которому hyperparameters выбраны, уже biased как estimate final generalization.

Нужен untouched test.

---

## 11. Multiple metrics

Можно оценивать сразу:

```text
AP
ROC-AUC
fit_time
```

`RandomizedSearchCV`/`GridSearchCV` поддерживают несколько scorers.

Но для автоматического выбора нужно заранее решить:

> какая metric primary?

Иначе после search легко post-hoc выбрать metric, где любимая model выглядит лучше.

---

## 12. Business constraints в model selection

Пусть:

| Model | AP | Latency |
|---|---:|---:|
| A | 0.61 | 2 ms |
| B | 0.63 | 80 ms |

Если SLA:

```text
< 10 ms
```

B не победитель.

Model selection objective может включать:

- quality;
- latency;
- memory;
- explainability;
- retraining time;
- dependency complexity.

---

## 13. Learning curves

Learning curve показывает train/validation score при разных training sizes.

Если обе curves низкие и близкие:

```text
high bias
```

добавление ещё data может мало помочь.

Если train high, validation заметно ниже и gap уменьшается с data:

```text
variance problem
```

больше data потенциально полезно.

scikit-learn предоставляет `learning_curve`.

---

## 14. Validation curves

Validation curve меняет один hyperparameter и показывает train/validation score.

Например:

```text
max_depth = 1,2,3,...,15
```

Можно увидеть:

```text
маленькая depth → underfit
средняя → optimum
большая → train растёт, validation падает
```

Это полезно для понимания behavior, а не только automation search.

---

## 15. Early stopping как hyperparameter selection

Boosting/DL может иметь:

```text
maximum 5000 iterations
```

а best iteration выбирается по validation trajectory.

Это тоже tuning.

Нельзя затем использовать ту же best validation score как полностью unbiased final estimate.

---

## 16. Nested CV

Если dataset маленький и нужна строгая оценка whole model-selection process, можно использовать nested cross-validation.

Outer folds:

```text
оценивают generalization
```

Inner folds:

```text
выбирают hyperparameters
```

Схема дорогая, но методологически чистая.

В обычном production project отдельный final test + train-CV часто проще.

---

## 17. Successive halving

Идея:

```text
дать многим candidates мало ресурсов
→ плохие отбросить
→ перспективным дать больше
```

scikit-learn имеет successive-halving search methods как experimental/advanced option.

Это полезно, когда training resource можно постепенно увеличивать.

---

## 18. Bayesian/Optuna-style optimization

Advanced search methods используют историю trials, чтобы выбирать promising parameters.

Но они не отменяют:

- CV;
- correct split;
- primary metric;
- final test;
- bounded budget.

Сильный optimizer может просто эффективнее переобучить вас на плохую validation scheme.

---

## 19. Не тюнить лишние параметры

Хороший hierarchy для tree boosting:

```text
1. validation scheme
2. learning_rate + iterations
3. tree complexity
4. sampling
5. regularization
```

Для Logistic Regression:

```text
1. preprocessing
2. regularization family
3. C
4. class weighting / threshold if needed
```

Каждый parameter должен иметь hypothesis.

---

## 20. Когда разница слишком мала

CV:

```text
A = 0.621 ± 0.008
B = 0.624 ± 0.010
```

Разница 0.003 может быть noise.

Нужно смотреть:

- fold-level paired differences;
- repeat stability;
- operational cost;
- complexity.

Не превращать leaderboard mindset в production model selection.

---

## 21. `cv_results_`

Search object хранит полную таблицу trials:

```python
results = pd.DataFrame(search.cv_results_)
```

Полезно смотреть:

- params;
- mean/std test score;
- train score;
- fit time;
- rank.

Не ограничиваться:

```python
search.best_params_
```

Иногда несколько configurations практически эквивалентны, и проще выбрать более дешёвую.

---

## 22. Refit

`GridSearchCV`/`RandomizedSearchCV` могут после выбора parameters заново fit best estimator на всём input dataset поиска.

Это `refit`.

Важно понимать lifecycle:

```text
CV выбирает hyperparameters
→ refit на full training data
→ затем independent test
```

Test не включается в search/refit.

---

## 23. Типичные ошибки

**«Больше trials всегда лучше».**\
Можно сильнее overfit validation.

**«best_score_ = final quality».**\
Нет.

**«GridSearch всегда тщательнее, значит лучше».**\
Не при огромном space и ограниченном budget.

**«Тюнить нужно все parameters».**\
Нет.

**«Разница 0.001 — победа».**\
Не обязательно.

**«Model с max metric всегда production winner».**\
Не учитывает latency/complexity.

**«Optuna исправит неправильный split».**\
Нет.

---

## 24. Проверка понимания

1. Parameter vs hyperparameter?
2. Зачем baseline до tuning?
3. Grid vs randomized search?
4. Почему continuous params лучше sample distributions?
5. Что значит `n_iter`?
6. Почему best CV score optimistic?
7. Для чего learning curve?
8. Для чего validation curve?
9. Что такое nested CV?
10. Почему latency входит в model selection?

---

## 25. Мини-практика

Candidates:

| Model | CV AP | std | Train time | Latency |
|---|---:|---:|---:|---:|
| Logistic | 0.48 | 0.01 | 5 s | 1 ms |
| CatBoost A | 0.57 | 0.02 | 3 min | 8 ms |
| CatBoost B | 0.575 | 0.04 | 20 min | 35 ms |

SLA latency < 10 ms.

Ответьте:

1. какие models реально candidates;
2. является ли B winner;
3. что означает больший std B;
4. что оценить на final test;
5. какие reasons могут оставить A даже при чуть худшем score.

---

## 26. Как объяснить на собеседовании

### Grid vs Random Search

Grid перебирает все заданные combinations. Randomized search фиксирует budget `n_iter` и samples configurations из distributions, что часто эффективнее в high-dimensional search spaces.

### Почему нужен test после tuning?

Потому что hyperparameters выбраны по validation/CV. Эта estimate уже участвовала в model selection и становится оптимистичной.

---

## 27. Что нужно унести

1. Model selection сама может overfit.
2. Candidate models сравниваются на одинаковой validation scheme.
3. Mean и variance CV важны вместе.
4. Grid хорош для компактного space.
5. Random search задаёт fixed computational budget.
6. Scale parameters удобно search по log scale.
7. `best_score_` не final test quality.
8. Learning/validation curves помогают диагностировать bias/variance.
9. Operational constraints входят в selection.
10. Tuning должен быть hypothesis-driven.
11. Финальный test остаётся untouched до freeze решения.

## Куда дальше

Теперь все части известны по отдельности. Осталось собрать их в одну последовательность от неизвестного dataset до работающего model artifact.

Следующий урок — полный **end-to-end ML pipeline**.

## Источники
- scikit-learn Model Selection User Guide.
- scikit-learn RandomizedSearchCV / GridSearchCV.
- scikit-learn learning and validation curves.
