---
title: "Интерпретация модели и важность признаков — как понять, на что опирается prediction"
id: concept.datapath-v2.058
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 58
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Интерпретация модели и важность признаков

Высокая validation metric отвечает:

> **насколько хорошо model предсказывает?**

Но не отвечает:

> **почему она предсказывает именно так?**

Интерпретация нужна для:

- debugging;
- обнаружения leakage;
- проверки здравого смысла;
- объяснения отдельных predictions;
- анализа bias;
- общения с бизнесом;
- regulatory requirements.

Но здесь есть одна критическая граница:

> **то, на что model опирается для prediction, не обязательно является тем, что причинно важно в реальном мире.**

Feature importance — прежде всего характеристика **модели в конкретном dataset**, а не автоматический ответ на причинный вопрос.

---

## 1. Три разных вопроса

Нужно различать:

### 1. Глобальный вопрос

> Какие features сильнее всего влияют на behavior model в среднем?

### 2. Локальный вопрос

> Почему этот конкретный object получил prediction 0.81?

### 3. Причинный вопрос

> Что произойдёт с outcome, если реально изменить feature?

Первые два относятся к model interpretation. Третий — уже causal inference.

Нельзя автоматически переходить от:

```text
feature important for prediction
```

к:

```text
changing feature causes target to change
```

---

## 2. Коэффициенты линейной модели

Для:

\[
\hat y=b+w_1x_1+\dots+w_px_p
\]

коэффициент показывает изменение prediction при изменении feature на единицу при фиксированных остальных features.

Это очень прозрачная structure.

Но есть ловушки:

- разные scales;
- correlated features;
- nonlinear relationships;
- preprocessing;
- interaction terms.

Поэтому absolute coefficient без context — слабый importance measure.

---

## 3. Стандартизованные коэффициенты

Если features стандартизованы, coefficients становятся более сопоставимыми по scale.

Но даже после scaling:

> correlated features могут делить signal между собой и делать отдельные coefficients нестабильными.

То есть standardized coefficient всё равно не превращается в «истинную важность».

---

## 4. `feature_importances_` в деревьях

Tree ensembles часто имеют:

```python
model.feature_importances_
```

В scikit-learn это impurity-based importance, часто называемая MDI — mean decrease in impurity.

Идея:

```text
feature использовался в splits
→ split уменьшил impurity
→ накопить reduction
→ усреднить/нормировать по ensemble
```

Если feature часто создаёт сильные splits, importance растёт.

---

## 5. Почему MDI может вводить в заблуждение

У impurity importance есть известные ограничения.

### High cardinality

Feature с большим числом возможных split points может получить больше шансов найти случайно хороший train split.

### Training-based

Importance вычисляется по structure model на training data.

Если model overfit, importance может отражать noise.

### Correlated features

Два почти одинаковых features могут делить полезный signal.

Если убрать один, второй легко его заменит.

Поэтому маленькая individual importance не доказывает бесполезность information group.

---

## 6. Permutation importance

**Перестановочная важность (permutation importance)** задаёт более прямой predictive вопрос:

> насколько ухудшится качество уже обученной model, если разрушить информацию одного feature?

Алгоритм:

```text
1. посчитать baseline metric;
2. перемешать значения feature j между objects;
3. снова посчитать metric;
4. importance = baseline - permuted score;
5. повторить несколько раз.
```

В scikit-learn это:

```python
from sklearn.inspection import permutation_importance
```

---

## 7. Почему permutation лучше считать на validation

Если считать на training data, overfit model может показывать importance features, полезных только для memorization.

На holdout/validation мы спрашиваем:

> какая information реально нужна для generalization?

Пример:

```python
result = permutation_importance(
    model,
    X_valid,
    y_valid,
    scoring="average_precision",
    n_repeats=20,
    random_state=42,
)
```

Результат включает mean и std importance по repeats.

---

## 8. Correlated features ломают простую permutation interpretation

Пусть:

```text
income_monthly
income_yearly
```

почти полностью дублируют друг друга.

Если permute `income_monthly`, model всё ещё использует `income_yearly`.

Metric почти не падает.

Можно ошибочно решить:

> monthly income бесполезен.

Но information просто продублирована.

Permutation importance отвечает:

> насколько **уникальна** информация feature для этой model при наличии остальных?

Это не то же самое, что общая semantic importance.

---

## 9. Grouped permutation

Если несколько features образуют одну semantic group, иногда разумно permute их вместе.

Например:

```text
income_monthly
income_yearly
income_bucket
```

Так можно оценить вклад всей income-information group.

Это особенно полезно при feature engineering с множеством correlated derivatives.

---

## 10. Partial Dependence Plot

**Частичная зависимость (Partial Dependence, PDP)** спрашивает:

> как в среднем меняется prediction model при разных значениях feature, если усреднить over dataset?

Концептуально:

```text
выбрать value x_j
→ всем objects временно поставить x_j
→ получить predictions
→ усреднить
→ повторить для grid values
```

В scikit-learn есть `PartialDependenceDisplay`.

---

## 11. Что PDP показывает хорошо

Например:

```text
feature = age
```

PDP может показать:

```text
до 25 risk почти не меняется
25–50 растёт
после 60 выходит на plateau
```

Это помогает увидеть nonlinear behavior black-box model.

---

## 12. Главная проблема PDP: коррелированные features

Если:

```text
age
years_of_experience
```

сильно correlated, PDP может создавать artificial combinations:

```text
age=18
experience=30
```

которых в реальности нет.

Model forced to predict out-of-distribution combinations.

Поэтому PDP требует осторожности при dependent features.

---

## 13. ICE plots

**Individual Conditional Expectation (ICE)** похож на PDP, но не усредняет сразу всех objects.

Для каждого observation рисуется своя curve.

Это позволяет увидеть heterogeneity:

```text
для одной группы feature ↑ → prediction ↑
для другой почти не меняется
```

Средний PDP мог бы скрыть эти interactions.

---

## 14. Local explanation

Иногда нас интересует конкретный client:

```text
prediction default = 0.82
```

Нужно разложить:

```text
baseline risk
+ income effect
+ previous_delays effect
+ age effect
+ ...
= final prediction
```

Для этого часто используют SHAP-like attribution methods.

---

## 15. SHAP: идея Shapley values

SHAP опирается на Shapley values из cooperative game theory.

Model prediction — «выигрыш», features — «игроки».

Нужно распределить difference между baseline prediction и prediction конкретного object по features.

Упрощённо:

\[
f(x)=E[f(X)]+\sum_j \phi_j.
\]

Где:

- \(E[f(X)]\) — baseline;
- \(\phi_j\) — contribution feature j;
- сумма contributions возвращает model output в выбранном output space.

---

## 16. Tree SHAP

Для tree models библиотека SHAP имеет `TreeExplainer`.

В актуальной документации Tree SHAP описывается как эффективный метод объяснения outputs tree ensembles.

Важно задавать вопрос:

> **какой output мы объясняем?**

Это может быть:

- raw margin;
- probability;
- log loss.

Например для некоторых XGBoost configurations default raw output — log-odds, а не `predict_proba`.

Поэтому нельзя интерпретировать SHAP numbers, не понимая output space.

---

## 17. Зависимость features и background data

SHAP explanations зависят от assumptions о том, как учитывать dependent/correlated features и какой background dataset используется.

Это не техническая мелочь.

Если features correlated, вопрос:

> «что значит убрать один feature, оставив остальные?»

становится неочевидным.

Поэтому SHAP — сильный инструмент, но не магическая истина.

---

## 18. Local ≠ global

Для одного object:

```text
income contribution = -0.8
```

не означает, что income globally always reduces risk.

Чтобы получить global picture, смотрят distributions absolute SHAP values, dependence plots, segments.

И наоборот, feature с большой global importance может почти не влиять на конкретный object.

---

## 19. Interpretation как leakage detector

Представим top features:

```text
days_after_default
final_status
collection_result
```

Модель quality великолепна.

Но importance сразу показывает: estimator читает post-event information.

Interpretation очень полезна как sanity check:

> «Если model такая хорошая — на чём именно она это делает?»

---

## 20. Interpretation как debugging

Другой пример:

ожидали, что модель использует:

```text
transaction history
income
age
```

а top importance:

```text
row_index
file_number
timestamp_of_export
```

Это сигнал проверить data generation.

Иногда «объяснение модели» важнее для разработчика, чем для конечного пользователя.

---

## 21. Stability explanations

Если feature importance полностью меняется между folds:

```text
fold 1 → A
fold 2 → C
fold 3 → B
```

возможны:

- correlated features;
- маленький dataset;
- unstable model;
- drift между folds.

Поэтому важность полезно оценивать не на одном fit, а с учётом validation stability.

---

## 22. Interpretation и causal inference

Допустим SHAP говорит:

```text
high number of doctor visits → higher predicted disease risk
```

Нельзя заключить:

> уменьшение doctor visits снизит disease risk.

Visits могут быть следствием уже существующей болезни.

Prediction explanation отвечает:

> как model использует observed associations.

Causal question требует другого design: experiments, causal assumptions, DAGs, treatment/control и т.д.

---

## 23. Практический код: permutation importance

```python
from sklearn.inspection import permutation_importance

result = permutation_importance(
    model,
    X_valid,
    y_valid,
    scoring="roc_auc",
    n_repeats=20,
    random_state=42,
)

importance = pd.Series(
    result.importances_mean,
    index=X_valid.columns,
).sort_values(ascending=False)
```

Также полезно смотреть:

```python
result.importances_std
```

чтобы видеть variation repeats.

---

## 24. Практический PDP

```python
from sklearn.inspection import PartialDependenceDisplay

PartialDependenceDisplay.from_estimator(
    model,
    X_valid,
    features=["age", "income"],
)
```

PDP надо строить только после того, как model вообще имеет acceptable generalization.

Объяснять плохую model бессмысленно.

---

## 25. SHAP conceptual code

Для tree ensemble:

```python
import shap

explainer = shap.TreeExplainer(model, X_background)
explanation = explainer(X_sample)
```

Но конкретный output shape зависит от model type и числа outputs.

В production lesson не нужно заучивать один indexing snippet без проверки installed SHAP version.

---

## 26. Какой метод для какого вопроса

### Коэффициенты

Хороши для transparent linear model.

### MDI

Быстрый internal tree signal.

### Permutation importance

Model-agnostic predictive dependency на holdout.

### PDP

Average response shape.

### ICE

Heterogeneity individual response curves.

### SHAP

Local additive attribution и global aggregation.

Нет одного «лучшего интерпретатора».

---

## 27. Интерактивная визуализация DataPath

### Экран 1. Correlated features

Два почти одинаковых features.

Показать:

```text
MDI
permutation A
permutation B
grouped permutation
```

Пользователь видит, почему individual importance мала.

### Экран 2. PDP vs ICE

Несколько subgroups с разным relationship.

Средний PDP скрывает divergence, ICE показывает.

### Экран 3. Local attribution

Baseline score + contributions → final score.

Переключатель output:

```text
raw score
probability
```

Показать, что numbers в разных spaces отличаются.

---

## 28. Типичные ошибки

**«feature_importances_ показывает реальную важность feature в жизни».**\
Нет.

**«Большой coefficient автоматически = самый важный feature».**\
Нет.

**«Permutation importance не имеет проблем с correlated features».**\
Имеет.

**«PDP показывает causal effect».**\
Нет.

**«SHAP объясняет причинность».**\
Нет.

**«Если SHAP положительный, feature всегда повышает target».**\
Это local attribution.

**«Interpretability нужна только бизнесу».**\
Она критична для debugging.

---

## 29. Проверка понимания

1. Global vs local explanation?
2. Почему coefficient зависит от scale?
3. Что измеряет MDI?
4. Как работает permutation importance?
5. Почему correlated features уменьшают individual permutation importance?
6. Что показывает PDP?
7. Чем ICE отличается от PDP?
8. Что суммируют SHAP values?
9. Почему output space SHAP важен?
10. Почему model explanation не causal explanation?

---

## 30. Мини-практика

Model AP = 0.62.

Importance:

```text
post_default_call_count   0.31
income                    0.08
age                       0.02
```

Ответьте:

1. почему первый feature подозрителен;
2. что проверить во времени;
3. можно ли утверждать, что income причинно влияет на default;
4. как проверить unique contribution двух correlated income features;
5. какие local explanations построить для false positives.

---

## 31. Как объяснить на собеседовании

### Что такое permutation importance?

**Коротко.**\
Сначала измеряем baseline quality, затем перемешиваем один feature и смотрим, насколько упала metric. Чем сильнее падение, тем больше model зависела от информации feature на этом dataset.

### Ограничение?

Correlated features могут взаимно заменять друг друга, поэтому individual importance занижается.

### SHAP?

Метод additive attributions: prediction раскладывается относительно baseline на contributions features. Для tree ensembles Tree SHAP вычисляет такие attributions эффективно, но interpretation зависит от output space и assumptions о dependent features.

---

## 32. Что нужно унести

1. Predictive importance ≠ causal importance.
2. Interpretation бывает global и local.
3. Linear coefficients требуют scale/correlation context.
4. MDI основан на impurity reductions training tree.
5. Permutation importance измеряет падение holdout metric после разрушения feature.
6. Correlated features усложняют importance.
7. PDP показывает average model response.
8. ICE показывает individual curves.
9. SHAP раскладывает model output на additive contributions.
10. Output space и feature dependence важны.
11. Interpretation — мощный leakage/debugging инструмент.
12. Сначала проверяем quality model, потом объясняем её.

## Куда дальше

Мы умеем измерять качество и исследовать behavior model. Но в реальном проекте остаётся вопрос:

> **Как выбрать между десятком моделей и сотнями hyperparameters, не переобучившись на validation?**

Следующий урок — выбор модели и настройка гиперпараметров.

## Источники
- scikit-learn Inspection — permutation importance, PDP/ICE.
- SHAP official documentation — Explainer and TreeExplainer.
