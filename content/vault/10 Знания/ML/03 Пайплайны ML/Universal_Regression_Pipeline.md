---
title: Универсальная схема регрессии
aliases:
  - Regression Pipeline
  - Шаблон регрессии
tags:
  - ml
  - regression
  - sklearn
  - validation
  - pipeline
type: practice
area: ml
status: active
rag: exclude
id: practice.ml.universal-naia-skhema-regressii
schema_version: 2
language: ru
app: source
---
# Универсальная схема регрессии

> [!summary] Главная формула
> **Постановка → final test → baseline → Pipeline → одинаковая CV → выбор модели → OOF-диагностика → fit на всех development data → test один раз → вывод.**

Эта заметка — основной маршрут для табличной регрессии: цена, спрос, длительность, сумма, расход, рейтинг и другие числовые цели.

> [!important] Как пользоваться заметкой
> Идти по разделам сверху вниз. Для первой рабочей модели достаточно выполнить основной маршрут полностью. Дополнительные методы применять только после того, как диагностика показала конкретную проблему.

## Связанные заметки

- Подготовка признаков и выбор кодирования: [[Tabular_ML_Preprocessing]]
- OOF, остатки, сегменты и интерпретация: [[Regression_Error_Analysis]]
- Логарифмирование, выбросы, robust loss и tuning: [[Regression_Optional_Methods]]
- Общие операции с таблицами: [[Universal_Pandas_Data_Work_Pipeline]]
- Аналогичный шаблон классификации: [[Универсальная схема бинарной классификации]]

---

## 0. Сформулировать задачу

До кода ответить:

1. Что является одним объектом?
2. Что именно предсказывает модель?
3. В каких единицах измеряется target?
4. В какой момент выполняется прогноз?
5. Какие признаки доступны в этот момент?
6. Какая ошибка дороже: на `10 000` или на `100 000`?
7. Ошибка важна в исходных единицах или в процентах?
8. Как прогноз будет использоваться в реальном решении?

> [!warning] Главная проверка на утечку
> Признак нельзя использовать, если он появляется после момента прогноза или напрямую содержит информацию о target.

### Выбрать основную метрику заранее

| Метрика | Что измеряет | Когда выбирать |
|---|---|---|
| `MAE` | среднюю абсолютную ошибку | все ошибки растут примерно линейно |
| `RMSE` | сильнее штрафует большие ошибки | крупные промахи особенно дороги |
| `R²` | улучшение относительно прогноза средним | дополнительная понятная характеристика |
| `MAPE` | относительную ошибку в процентах | target положителен и не близок к нулю |

Обычно выбирают одну главную метрику, а остальные используют для диагностики.

> [!note] Про R²
> `R² = 0.8` не означает «точность 80%». Это означает, что модель объясняет около 80% вариации target относительно baseline, предсказывающего среднее.

---

## 1. Отделить финальный test

Test отделяется до EDA, подбора моделей и параметров.

```python
from sklearn.model_selection import train_test_split

X = df.drop(columns="target")
y = df["target"]

X_dev, X_test, y_dev, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)
```

`development data` — данные, на которых разрешены CV, сравнение моделей и анализ ошибок. `test` — финальный экзамен.

### Выбрать схему разбиения по структуре данных

| Структура | Final split и CV |
|---|---|
| Независимые строки | случайный split + `KFold` |
| Несколько строк одного объекта | разделение по группам + `GroupKFold` |
| Прогноз будущего | разделение по времени + `TimeSeriesSplit` |
| Пространственные или иерархические данные | разделение по независимым группам |

> [!danger] Нельзя
> Помещать один объект одновременно в train и validation, перемешивать будущее с прошлым или выбирать схему split только потому, что она даёт более высокую метрику.

---

## 2. Провести короткий аудит development data

```python
print("X_dev:", X_dev.shape)
print("X_test:", X_test.shape)

display(y_dev.describe())

audit = pd.DataFrame({
    "dtype": X_dev.dtypes,
    "missing": X_dev.isna().sum(),
    "missing_pct": X_dev.isna().mean(),
    "unique": X_dev.nunique(dropna=False),
}).sort_values("missing_pct", ascending=False)

display(audit)
```

Проверить:

- смысл одной строки;
- дубликаты объектов;
- единицы измерения;
- пропуски и их смысл;
- идентификаторы;
- даты и момент доступности признаков;
- подозрительно прямую связь признака с target.

Подробные команды находятся в [[Universal_Pandas_Data_Work_Pipeline]].

---

## 3. Настроить CV и метрики

Для независимых строк:

```python
from sklearn.model_selection import KFold

cv = KFold(
    n_splits=5,
    shuffle=True,
    random_state=42,
)
```

Единый набор метрик:

```python
scoring = {
    "mae": "neg_mean_absolute_error",
    "rmse": "neg_root_mean_squared_error",
    "r2": "r2",
}
```

> [!note] Почему MAE и RMSE отрицательные в sklearn
> sklearn считает, что большее значение scoring должно быть лучше. Поэтому ошибки возвращаются со знаком минус. Для обычного отображения результат умножается на `-1`.

---

## 4. Посчитать простой baseline

Baseline отвечает на вопрос: модель вообще лучше простого правила?

```python
from sklearn.dummy import DummyRegressor
from sklearn.model_selection import cross_validate

baseline = DummyRegressor(strategy="mean")

baseline_scores = cross_validate(
    estimator=baseline,
    X=X_dev,
    y=y_dev,
    cv=cv,
    scoring=scoring,
    n_jobs=-1,
)

print(
    "Baseline CV MAE:",
    -baseline_scores["test_mae"].mean(),
)

print(
    "Baseline CV RMSE:",
    -baseline_scores["test_rmse"].mean(),
)

print(
    "Baseline CV R²:",
    baseline_scores["test_r2"].mean(),
)
```

Для MAE иногда полезно дополнительно проверить `DummyRegressor(strategy="median")`.

---

## 5. Собрать preprocessing внутри Pipeline

Списки признаков определяются по смыслу, а не только по `dtype`:

```python
numeric_features = [
    # "age",
    # "income",
]

categorical_features = [
    # "city",
    # "product_type",
]
```

Стандартный preprocessing:

```python
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

numeric_pipeline = Pipeline(steps=[
    (
        "imputer",
        SimpleImputer(strategy="median"),
    ),
    (
        "scaler",
        StandardScaler(),
    ),
])

categorical_pipeline = Pipeline(steps=[
    (
        "imputer",
        SimpleImputer(
            strategy="constant",
            fill_value="Missing",
        ),
    ),
    (
        "onehot",
        OneHotEncoder(
            handle_unknown="ignore",
            min_frequency=5,
        ),
    ),
])

preprocessor = ColumnTransformer(transformers=[
    (
        "numeric",
        numeric_pipeline,
        numeric_features,
    ),
    (
        "categorical",
        categorical_pipeline,
        categorical_features,
    ),
])
```

> [!important] Почему всё находится внутри Pipeline
> На каждом CV-фолде imputer, scaler и OHE должны обучаться только на train-части этого фолда. Иначе возникает утечка.

Особенности масштабирования, категорий высокой кардинальности, дат, идентификаторов и CatBoost вынесены в [[Tabular_ML_Preprocessing]].

---

## 6. Сравнить несколько семейств моделей

Сначала сравниваются семейства, а не десятки почти одинаковых настроек одной модели.

```python
import numpy as np
import pandas as pd

from sklearn.base import clone
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline

models = {
    "Ridge": Ridge(alpha=10),
    "Random Forest": RandomForestRegressor(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    ),
    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.03,
        max_depth=2,
        min_samples_leaf=10,
        random_state=42,
    ),
}

candidates = {}
comparison = []

for model_name, estimator in models.items():
    candidate = Pipeline(steps=[
        (
            "preprocessor",
            clone(preprocessor),
        ),
        (
            "model",
            clone(estimator),
        ),
    ])

    candidates[model_name] = candidate

    scores = cross_validate(
        estimator=candidate,
        X=X_dev,
        y=y_dev,
        cv=cv,
        scoring=scoring,
        return_train_score=True,
        n_jobs=-1,
    )

    train_rmse = -scores["train_rmse"]
    cv_rmse = -scores["test_rmse"]

    comparison.append({
        "model": model_name,
        "train_rmse": train_rmse.mean(),
        "cv_mae": -scores["test_mae"].mean(),
        "cv_rmse": cv_rmse.mean(),
        "cv_rmse_std": cv_rmse.std(),
        "cv_r2": scores["test_r2"].mean(),
        "overfit_gap": (
            cv_rmse.mean()
            - train_rmse.mean()
        ),
    })

comparison = (
    pd.DataFrame(comparison)
    .sort_values("cv_rmse")
    .reset_index(drop=True)
)

display(comparison)
```

### Как выбирать модель

Смотреть одновременно на:

1. основную CV-метрику;
2. разброс между фолдами;
3. разницу train и CV;
4. улучшение относительно baseline;
5. скорость и сложность модели;
6. стабильность результата.

| Train | CV | Возможный вывод |
|---|---|---|
| Плохо | Плохо | недообучение, высокий bias |
| Очень хорошо | заметно хуже | переобучение, высокий variance |
| Хорошо | немного хуже | нормальное обобщение |

> [!warning] Overfit gap не является отдельной целью
> Модель с маленьким gap может одинаково плохо работать и на train, и на CV. Сначала важно качество CV, затем устойчивость и сложность.

---

## 7. Зафиксировать выбранную конфигурацию

```python
from sklearn.base import clone

best_model_name = "Gradient Boosting"
best_pipeline = clone(candidates[best_model_name])
```

Название здесь выбирается после осмысленного сравнения таблицы, а не автоматически по test.

> [!tip] Когда нужен tuning
> Если базовая конфигурация уже значительно лучше baseline, сначала завершить весь маршрут. Подбор параметров нужен, когда улучшение действительно важно. Шаблон находится в [[Regression_Optional_Methods#2. Подбор гиперпараметров]].

---

## 8. Получить OOF-прогнозы выбранной модели

OOF-прогноз для строки создаёт модель, которая не обучалась на этой строке.

```python
from sklearn.model_selection import cross_val_predict

oof_pred = cross_val_predict(
    estimator=best_pipeline,
    X=X_dev,
    y=y_dev,
    cv=cv,
    method="predict",
    n_jobs=-1,
)
```

Честные development-метрики:

```python
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

oof_mae = mean_absolute_error(y_dev, oof_pred)

oof_rmse = np.sqrt(
    mean_squared_error(y_dev, oof_pred)
)

oof_r2 = r2_score(y_dev, oof_pred)

print("OOF MAE:", oof_mae)
print("OOF RMSE:", oof_rmse)
print("OOF R²:", oof_r2)
```

Минимальная таблица ошибок:

```python
error_df = X_dev.copy()

error_df["actual"] = y_dev
error_df["predicted"] = oof_pred
error_df["residual"] = (
    error_df["actual"]
    - error_df["predicted"]
)
error_df["absolute_error"] = (
    error_df["residual"].abs()
)
```

На основном маршруте достаточно ответить на три вопроса:

1. Есть ли несколько огромных ошибок?
2. Модель систематически завышает или занижает target?
3. Есть ли явно слабый важный сегмент?

Подробные графики и группировки находятся в [[Regression_Error_Analysis]].

> [!note] Временные данные
> Обычный `cross_val_predict` подходит не для каждой временной схемы. Для walk-forward validation OOF-прогнозы собирают вручную по фолдам — см. [[Regression_Error_Analysis#8. OOF для временных данных]].

---

## 9. Обучить одну модель на всех development data

```python
final_model = clone(best_pipeline)
final_model.fit(X_dev, y_dev)
```

CV-модели были временными. Теперь одна модель использует все development data.

---

## 10. Один раз оценить final test

```python
test_pred = final_model.predict(X_test)

test_mae = mean_absolute_error(
    y_test,
    test_pred,
)

test_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        test_pred,
    )
)

test_r2 = r2_score(
    y_test,
    test_pred,
)

final_report = pd.DataFrame({
    "sample": ["OOF", "Final test"],
    "MAE": [oof_mae, test_mae],
    "RMSE": [oof_rmse, test_rmse],
    "R2": [oof_r2, test_r2],
})

display(final_report)
```

### Как читать итог

- Test близок к OOF — оценка стабильна.
- Test немного хуже — нормальная случайная разница возможна.
- Test намного хуже — проверить split, drift, группы, время и утечки.
- Test лучше OOF — test мог оказаться проще; это не причина продолжать настройку.

> [!danger] После final test
> Не выбирать по нему другую модель, не менять признаки и не подбирать параметры. Иначе test превращается в validation.

---

## 11. Перевести метрики в понятный вывод

Шаблон:

> Baseline получил `RMSE = ...`. На одинаковой 5-fold CV были сравнены линейная модель, случайный лес и градиентный бустинг. Выбрана модель `...` с `OOF RMSE = ...`, `MAE = ...` и `R² = ...`. На нетронутом test получено `RMSE = ...`. Средняя абсолютная ошибка составляет около `...` единиц target. Основные ошибки наблюдаются в сегменте `...`.

Не говорить «точность модели равна R²».

---

## 12. Сохранить весь Pipeline

```python
import joblib

joblib.dump(
    final_model,
    "regression_pipeline.joblib",
)
```

Загрузка и прогноз:

```python
loaded_model = joblib.load(
    "regression_pipeline.joblib"
)

new_predictions = loaded_model.predict(
    new_data
)
```

Сохранять нужно весь Pipeline, а не только последнюю модель: иначе потеряются imputer, scaler и OHE.

---

## 13. Когда открывать дополнительные заметки

| Наблюдение | Куда перейти |
|---|---|
| Ошибки обработки, пропуски, OHE, scaling | [[Tabular_ML_Preprocessing]] |
| Непонятно, где и почему ошибается модель | [[Regression_Error_Analysis]] |
| Скошенный target или важны проценты | [[Regression_Optional_Methods#3. Преобразование target]] |
| Реальные экстремальные значения ломают модель | [[Regression_Optional_Methods#5. Robust-модели и функции потерь]] |
| Есть подозрительные выбросы | [[Regression_Optional_Methods#6. Работа с выбросами]] |
| Нужно аккуратно подобрать параметры | [[Regression_Optional_Methods#2. Подбор гиперпараметров]] |

Дополнительный метод применяется только при наличии симптома и сравнивается той же CV с исходным решением.

---

## 14. Типовые ошибки

- Начать со сложной модели без baseline.
- Обрабатывать весь датасет до split.
- Выбирать split без учёта групп или времени.
- Сравнивать модели на разных фолдах.
- Сравнивать train одной модели с CV другой.
- Забыть поменять знак у отрицательных sklearn scoring.
- Выбрать модель только по минимальному train RMSE.
- Автоматически удалять строки с большими residual.
- Считать R² процентом точности.
- Подбирать преобразование target по final test.
- Сохранять только модель без preprocessing.

---

## 15. Короткий чек-лист

- [ ] Определены объект, target, момент прогноза и основная метрика.
- [ ] Проверена доступность признаков и отсутствие утечек.
- [ ] Final test отделён до экспериментов.
- [ ] Split и CV учитывают группы или время.
- [ ] Посчитан mean/median baseline.
- [ ] Preprocessing находится внутри Pipeline.
- [ ] Несколько семейств моделей сравнены на одинаковых фолдах.
- [ ] Проверены CV mean, CV std и train–CV gap.
- [ ] Конфигурация зафиксирована до final test.
- [ ] Получены OOF-прогнозы и проведена короткая диагностика.
- [ ] Final test использован один раз.
- [ ] Метрика переведена в единицы задачи.
- [ ] Сохранён весь Pipeline.

---

## Формула для собеседования

> Сначала формулирую объект, target, момент прогноза и стоимость ошибки. Отделяю финальный test с учётом групп или времени. Внутри Pipeline собираю preprocessing, затем на одинаковых CV-фолдах сравниваю baseline и несколько семейств моделей по заранее выбранной метрике. Для выбранной конфигурации получаю OOF-прогнозы и анализирую residual без обращения к test. После фиксации решения обучаю модель на всех development data и один раз оцениваю final test.
