---
title: Preprocessing табличных данных для ML
aliases:
  - Tabular ML Preprocessing
  - Подготовка признаков для моделей
tags:
  - ml
  - preprocessing
  - sklearn
  - pipeline
  - data-quality
type: practice
area: ml
status: active
rag: exclude
id: practice.ml.preprocessing-tablichnykh-dannykh-dlia-ml
schema_version: 2
language: ru
app: source
---
# Preprocessing табличных данных для ML

> [!summary] Главная формула
> **Сначала split → затем fit преобразований только на train → transform validation/test теми же параметрами.**

Эта заметка отвечает на вопрос: что делать с числовыми, категориальными, временными признаками, пропусками и идентификаторами перед обучением модели.

## Навигация

- Основной маршрут регрессии: [[Universal_Regression_Pipeline]]
- Основной маршрут классификации: [[Универсальная схема бинарной классификации]]
- Команды pandas и проверка таблиц: [[Universal_Pandas_Data_Work_Pipeline]]

---

## 1. Что означают fit, transform и predict

| Метод | Что делает |
|---|---|
| `fit(X, y)` | изучает параметры по данным |
| `transform(X)` | применяет уже изученное преобразование |
| `fit_transform(X)` | сначала обучает, затем преобразует те же данные |
| `predict(X)` | выдаёт прогноз обученной модели |
| `predict_proba(X)` | выдаёт вероятности классов; модель не обучает |

Пример со scaler:

```python
scaler.fit(X_train)

X_train_scaled = scaler.transform(X_train)
X_valid_scaled = scaler.transform(X_valid)
```

Средние и масштабы вычисляются только по `X_train`.

> [!danger] Утечка
> `fit_transform` на всём датасете до split позволяет validation/test повлиять на параметры обработки.

---

## 2. Определять тип признака по смыслу

`dtype` не всегда совпадает со смыслом:

- `client_id` может быть числом, но является идентификатором;
- номер месяца может быть числом, но часто удобнее как категория или циклический признак;
- почтовый индекс — обычно категория, а не непрерывное число;
- рейтинг `1–5` может быть порядковой категорией;
- дата требует привязки к моменту прогноза.

```python
numeric_features = [
    "age",
    "income",
]

categorical_features = [
    "city",
    "product_type",
    "month_number",
]
```

Автоматическое начало списка:

```python
numeric_candidates = (
    X_dev.select_dtypes(include="number")
    .columns
    .tolist()
)

categorical_candidates = (
    X_dev.select_dtypes(
        include=["object", "string", "category"]
    )
    .columns
    .tolist()
)
```

После этого списки обязательно проверяются вручную.

---

## 3. Универсальный sklearn-preprocessor

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

Полная модель:

```python
from sklearn.linear_model import Ridge

pipeline = Pipeline(steps=[
    (
        "preprocessor",
        preprocessor,
    ),
    (
        "model",
        Ridge(alpha=10),
    ),
])
```

---

## 4. Числовые признаки

### Пропуски

Стандартный безопасный baseline — медиана:

```python
SimpleImputer(strategy="median")
```

Медиана устойчивее среднего к экстремальным значениям.

Иногда пропуск сам несёт информацию:

```python
SimpleImputer(
    strategy="median",
    add_indicator=True,
)
```

Это добавляет бинарный индикатор для столбцов, где на этапе `fit` были пропуски.

### Когда допустим ноль

Заполнять `0` можно, только если он означает известное отсутствие величины:

- нет гаража → площадь гаража `0`;
- не было покупок → число покупок `0`;
- доход неизвестен → это не обязательно `0`.

### Масштабирование

| Модель | Нужно масштабирование? | Почему |
|---|---|---|
| Linear/Ridge/Lasso/ElasticNet | да | коэффициенты и регуляризация зависят от масштаба |
| Logistic Regression | да | оптимизация и регуляризация |
| KNN | обязательно | расстояние зависит от масштаба |
| SVM | обычно да | расстояния и margin |
| Neural Network | обычно да | устойчивость оптимизации |
| Decision Tree | нет | важен порядок значений |
| Random Forest/Extra Trees | нет | основаны на деревьях |
| Gradient Boosting на деревьях | нет | основан на пороговых разбиениях |
| CatBoost | нет | основан на деревьях |

Один общий preprocessor со scaler допустим при сравнении линейных и древесных моделей: для деревьев линейное масштабирование обычно не меняет порядок значений.

---

## 5. Категориальные признаки

### Низкая и средняя кардинальность

Использовать OHE:

```python
OneHotEncoder(
    handle_unknown="ignore",
    min_frequency=5,
)
```

- `handle_unknown="ignore"` не ломает predict при новой категории;
- `min_frequency=5` объединяет редкие категории и уменьшает число столбцов.

### Бинарная категория

Её тоже можно передать в OHE. Ручное кодирование `0/1` допустимо, если соответствие явно зафиксировано:

```python
mapping = {
    "no": 0,
    "yes": 1,
}

df["has_loan"] = df["has_loan"].map(mapping)
```

После `map` нужно проверить неизвестные значения.

### Высокая кардинальность

Пример: 10 000 городов, товаров или организаций.

Варианты:

1. объединить редкие категории через `min_frequency`;
2. извлечь более общий осмысленный признак;
3. использовать CatBoost с нативными категориями;
4. использовать frequency encoding;
5. использовать target encoding только внутри CV.

> [!danger] Target encoding до CV
> Если среднее target по категории рассчитано по всему датасету, validation напрямую влияет на свой признак. Это утечка.

Frequency encoding без target:

```python
frequency = (
    X_train["category"]
    .value_counts(normalize=True)
)

X_train["category_frequency"] = (
    X_train["category"].map(frequency)
)

X_valid["category_frequency"] = (
    X_valid["category"]
    .map(frequency)
    .fillna(0)
)
```

Для CV это преобразование тоже должно быть частью fold-safe transformer или вычисляться отдельно внутри каждого фолда.

---

## 6. CatBoost как отдельная ветка preprocessing

CatBoost обычно не требует OHE и scaling. Категориальные признаки передаются по именам.

```python
def prepare_catboost_frame(
    X,
    categorical_features,
):
    X_cb = X.copy()

    for column in categorical_features:
        X_cb[column] = (
            X_cb[column]
            .fillna("Missing")
            .astype(str)
        )

    return X_cb
```

```python
X_dev_cb = prepare_catboost_frame(
    X_dev,
    categorical_features,
)

X_test_cb = prepare_catboost_frame(
    X_test,
    categorical_features,
)
```

```python
from catboost import CatBoostRegressor

catboost_model = CatBoostRegressor(
    iterations=1000,
    learning_rate=0.03,
    depth=6,
    l2_leaf_reg=5,
    loss_function="RMSE",
    random_seed=42,
    verbose=False,
    allow_writing_files=False,
)
```

Оценка на тех же CV-фолдах:

```python
catboost_scores = cross_validate(
    estimator=catboost_model,
    X=X_dev_cb,
    y=y_dev,
    cv=cv,
    scoring=scoring,
    return_train_score=True,
    n_jobs=-1,
    params={
        "cat_features": categorical_features,
    },
)
```

Так как `scoring` задан словарём с ключами `mae`, `rmse`, `r2`, результаты называются:

```python
catboost_scores["test_mae"]
catboost_scores["test_rmse"]
catboost_scores["test_r2"]
```

> [!important] Не смешивать две ветки
> sklearn-модели получают `Pipeline(preprocessor, model)`. CatBoost получает исходные столбцы с подготовленными строковыми категориями. Сравниваются они по одинаковым фолдам и метрикам, но preprocessing у них разный.

---

## 7. Даты и время

Сырая дата как строка редко полезна. Обычно извлекают признаки, доступные в момент прогноза:

```python
reference_date = pd.Timestamp("2026-01-01")

df["event_year"] = df["event_date"].dt.year
df["event_month"] = df["event_date"].dt.month
df["event_day_of_week"] = df["event_date"].dt.dayofweek

df["days_since_event"] = (
    reference_date - df["event_date"]
).dt.days
```

`reference_date` должна соответствовать моменту прогноза, а не сегодняшнему дню.

Циклическое кодирование месяца или часа:

```python
df["month_sin"] = np.sin(
    2 * np.pi * df["month"] / 12
)

df["month_cos"] = np.cos(
    2 * np.pi * df["month"] / 12
)
```

Для деревьев часто достаточно номера месяца или категории; для линейных моделей sin/cos лучше отражают близость декабря и января.

---

## 8. Идентификаторы

Обычно чистый ID не передают модели:

```python
X = df.drop(columns=[
    "client_id",
    "transaction_id",
])
```

Но ID полезен для:

- группового split;
- поиска дубликатов;
- объединения таблиц;
- анализа ошибок;
- связывания прогноза с объектом.

Иногда ID содержит структуру: регион, филиал, тип продукта. Тогда извлекается осмысленная часть, а не передаётся произвольный номер целиком.

---

## 9. Признаки, требующие особой осторожности

### Агрегаты по объектам

Количество заявок клиента допустимо, если оно рассчитано только по прошлому относительно момента прогноза.

### Статистика по target

Средний target по городу, товару или пользователю — target encoding. Его нельзя считать по всему датасету.

### Данные после события

Примеры утечки:

- длительность завершённого звонка при выборе клиента до звонка;
- сумма окончательного ремонта при прогнозе его стоимости;
- статус возврата при прогнозе возврата;
- итоговая дата закрытия при прогнозе длительности.

---

## 10. Как проверить готовый preprocessing

```python
pipeline.fit(X_dev, y_dev)
```

Проверить predict:

```python
pred = pipeline.predict(X_dev.head(5))
print(pred)
```

Посмотреть число признаков после обработки:

```python
X_transformed = (
    pipeline
    .named_steps["preprocessor"]
    .transform(X_dev.head(10))
)

print(X_transformed.shape)
```

Названия выходных признаков:

```python
feature_names = (
    pipeline
    .named_steps["preprocessor"]
    .get_feature_names_out()
)
```

Проверить, что новая категория не ломает обработку:

```python
example = X_dev.head(1).copy()
example["city"] = "never_seen_city"

pipeline.predict(example)
```

---

## 11. Типовые ошибки

- Определять смысл признака только по dtype.
- Вызывать `StandardScaler`, `SimpleImputer` или OHE на всём датасете до split.
- Заполнять все пропуски нулём.
- Масштабировать деревья и считать это обязательным улучшением.
- Делать OHE для почти уникального ID.
- Выполнять target encoding до CV.
- Забывать `handle_unknown="ignore"`.
- Вычислять возраст или давность относительно сегодняшней даты вместо момента прогноза.
- Использовать разные правила обработки на train и production.
- Сохранять модель отдельно от preprocessing.

---

## Короткий чек-лист

- [ ] Типы признаков проверены по смыслу.
- [ ] ID сохранены для split/анализа, но не переданы модели без причины.
- [ ] Пропуски интерпретированы, а не автоматически заменены нулём.
- [ ] Scaling используется для чувствительных моделей.
- [ ] Категории кодируются fold-safe способом.
- [ ] Даты привязаны к моменту прогноза.
- [ ] Все обучаемые преобразования находятся внутри Pipeline или внутри CV-фолда.
- [ ] Validation/test проходят только `transform` и `predict`.
- [ ] Новые категории не ломают predict.
- [ ] Весь Pipeline можно сохранить и загрузить.
