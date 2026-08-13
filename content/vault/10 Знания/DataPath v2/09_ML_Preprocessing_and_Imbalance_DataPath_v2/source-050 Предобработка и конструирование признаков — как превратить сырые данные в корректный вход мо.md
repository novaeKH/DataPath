---
title: "Предобработка и конструирование признаков — как превратить сырые данные в корректный вход модели"
id: concept.datapath-v2.050
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 50
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Предобработка и конструирование признаков

После деревьев и бустинга легко решить, что главная задача Data Scientist — выбрать сильную модель. На практике огромное количество качества теряется раньше: в типах, пропусках, утечках, агрегациях и несогласованном preprocessing.

Модель видит не реальный мир, а матрицу признаков. Поэтому вопрос **«что именно попадает в `fit()`?»** не менее важен, чем выбор estimator.

## 1. Сырые данные редко готовы

Таблица:

```text
client_id
birth_date
city
monthly_income
last_login
transactions_90d
target_churn
```

Сразу есть вопросы: `birth_date` — дата или строка? `city` — category. `monthly_income` может иметь пропуски. `last_login` лучше преобразовать в recency. `client_id` чаще нужен для grouping, а не как число. `transactions_90d` может содержать leakage, если окно рассчитано после prediction moment.

Прямой `model.fit(raw_df, y)` редко отражает корректный ML-процесс.

## 2. Preprocessing и feature engineering — разные задачи

**Предобработка данных (preprocessing)** приводит existing features к форме, пригодной estimator: imputation, scaling, encoding, conversion.

**Конструирование признаков (feature engineering)** создаёт новое представление информации:

```text
birth_date → age
last_login → days_since_last_login
transactions → count_30d, sum_30d, mean_check_30d
```

Первое отвечает «как корректно представить feature?», второе — «какую полезную информацию можно из данных извлечь?».

## 3. Прежде чем трансформировать, понять смысл

Для каждого column спросите:

- что он означает физически;
- когда он известен;
- одинаково ли рассчитывается на train и production;
- что означает `NaN`;
- не является ли он следствием target.

`NaN` может означать потерянное значение, отсутствие события, неприменимость feature или реальный ноль. Поэтому `fillna(0)` не нейтральная операция.

## 4. Пропуски

Если `days_since_last_purchase = NaN`, это может означать, что покупки не было никогда. Замена на 0 будет означать «покупка была сегодня» — противоположный смысл.

Частые стратегии: median, mean, constant, most frequent, model-based imputation. Но выбор должен исходить из семантики.

И главное: statistics imputer должны оцениваться только на train.

Плохо:

```text
посчитать median на всём dataset
→ заполнить
→ split
```

Правильно:

```text
split
→ fit imputer на train
→ transform train
→ transform validation/test
```

## 5. Масштабирование

`StandardScaler` использует:

\[
z=\frac{x-\mu}{\sigma}.
\]

Scaling особенно важен там, где mechanism зависит от численного масштаба: kNN, SVM, PCA, регуляризованные linear models, gradient-based optimizers.

Для обычных decision trees масштаб почти не влияет на threshold structure, потому что порядок значений сохраняется.

## 6. Почему kNN без scaling может сломаться

Features:

```text
age: 18–80
income: 20 000–500 000
```

Euclidean distance почти полностью определяется income. Возраст практически исчезает. Scaling не делает признаки одинаково важными, но убирает доминирование единиц измерения.

## 7. RobustScaler и выбросы

Mean/std чувствительны к extreme values. Если один income в сотни раз больше остальных, обычная standardization сильно изменится.

`RobustScaler` опирается на более устойчивые statistics вроде median и interquartile range.

Но наличие extreme value не означает автоматическое удаление. Сначала понять природу объекта.

## 8. Нелинейные transforms

Для сильно skewed positive feature иногда полезен:

```text
log1p(x)
```

Это может уменьшить огромный dynamic range и помочь linear model. Trees часто меньше нуждаются в таких transforms, потому что сами работают порогами.

## 9. Даты как источник признаков

Из timestamp можно получить:

- месяц;
- день недели;
- час;
- возраст объекта;
- days since event;
- сезонность.

Самая важная temporal идея: feature рассчитывается относительно **prediction moment**.

\[
recency = prediction\_date - last\_purchase\_date.
\]

## 10. Агрегации

Transaction table:

```text
client_id | date | amount
```

превращается в client features:

```text
count_7d
count_30d
sum_30d
mean_amount_90d
days_since_last_txn
```

Но окно должно заканчиваться в prediction moment.

Если prediction — 1 июня, `sum_30d` не может использовать июльские транзакции.

Полезная схема:

```text
<---- feature window ---->| prediction |---- label window ---->
```

## 11. Идентификаторы

`client_id` обычно не является обычным numeric feature. Число 1000 не «больше» клиента 20 в полезном смысле.

Но ID важен для:

- join;
- group split;
- aggregation;
- entity history.

Часто полезнее исторические признаки клиента, чем сам identifier.

## 12. Polynomial features и interactions

Линейная модель не создаёт interaction автоматически:

\[
x_1x_2.
\]

Можно добавить polynomial/interactions вручную или через `PolynomialFeatures`.

Но dimensionality быстро растёт. Feature engineering должно выражать гипотезу, а не максимизировать число columns.

## 13. Отношения

Иногда ratio лучше raw values:

\[
debt\_burden=\frac{monthly\_payment}{income}.
\]

Другие примеры:

```text
returns / orders
spend / transaction_count
purchases / active_days
```

Всегда продумать нулевой denominator.

## 14. Trees не отменяют feature engineering

Trees сами находят thresholds и interactions, но не могут восстановить информацию, которой нет на входе.

Domain features вроде recency/frequency/rolling statistics могут улучшить даже сильный boosting.

## 15. ColumnTransformer

Разные columns требуют разных transforms:

```python
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

num_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

cat_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("ohe", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("num", num_pipe, numeric_columns),
    ("cat", cat_pipe, categorical_columns),
])
```

`ColumnTransformer` применяет разные transformers к разным subsets columns и объединяет output.

## 16. Полный Pipeline

```python
from sklearn.linear_model import LogisticRegression

pipeline = Pipeline([
    ("preprocess", preprocessor),
    ("model", LogisticRegression(max_iter=1000)),
])

pipeline.fit(X_train, y_train)
```

Теперь imputer, scaler, encoder и model обучаются как единый workflow. На validation вызывается только transform/predict с уже обученными statistics.

## 17. Почему ручной pandas preprocessing опаснее

Для EDA нормально:

```python
df.fillna(...)
pd.get_dummies(...)
```

Но production pipeline должен ответить:

- какая median использовалась;
- какие categories были на train;
- что делать с unseen category;
- как повторить processing в API;
- как сохранить preprocessing вместе с model.

Pipeline делает transforms частью model artifact.

## 18. Feature selection

Больше features не всегда лучше. Новый feature может добавить signal, noise, leakage, latency.

Осмысленная схема:

```text
baseline features
→ CV
→ добавить feature group
→ CV
→ сравнить delta
```

Низкая линейная correlation не доказывает бесполезность для nonlinear model.

## 19. Transform target

Иногда regression target логарифмируют:

```text
y → log1p(y)
```

Если это обосновано distribution/task. После prediction нужно вернуться в исходные units. В scikit-learn есть `TransformedTargetRegressor`.

## 20. Главные leakage points

- imputation до split;
- scaling до CV;
- feature selection по всему dataset;
- target encoding без OOF;
- временная aggregation через future;
- oversampling до split.

Правило:

> всё, что `fit`-ится на данных, должно `fit`-иться только внутри training boundary.

## 21. Интерактивная визуализация

1. Scaling: показать kNN distances до и после standardization.
2. Leakage: `fit scaler before split` vs `inside train`.
3. Timeline: feature window / prediction / label window.
4. Pipeline: raw data → imputer → scaler/OHE → estimator, где `fit` доступен только training branch.

## 22. Типичные ошибки

- «все numeric features надо scaling» — зависит от estimator;
- «fillna(0) нейтрально» — нет;
- «trees не требуют feature engineering» — нет;
- «ID всегда feature» — чаще нет;
- «preprocessing можно сделать до CV» — leakage;
- «больше columns = лучше» — нет.

## 23. Проверка понимания

1. Чем preprocessing отличается от feature engineering?
2. Почему `fillna(0)` может быть семантически неправильным?
3. Какие модели чувствительны к scale?
4. Почему tree почти не зависит от linear scaling?
5. Почему imputer fit только на train?
6. Что такое feature window?
7. Зачем `ColumnTransformer`?
8. Почему Pipeline защищает от leakage?
9. Почему ID полезен для split, но опасен как число?
10. Может ли CatBoost выиграть от хороших domain features?

## 24. Мини-практика

Prediction moment — 1 июня.

```text
age
city
income
last_purchase_date
transactions_jan_to_jul
future_discount
target_churn_june
```

Определите: что использовать, что преобразовать, где leakage, как посчитать recency, что положить внутрь Pipeline.


## 25. Пропуск как отдельный сигнал

Иногда важен не только восстановленный value, но и сам факт отсутствия.

Пример:

```text
income = NaN
```

может быть связан с тем, что определённая группа клиентов принципиально не сообщает доход. Если просто заменить `NaN` медианой, model потеряет эту информацию.

Один вариант:

```text
income_missing = 1
income = median
```

В scikit-learn подобную идею можно реализовать через missing indicator или соответствующую настройку imputer.

Но missing flag нужно добавлять только если он имеет шанс быть устойчивым signal, а не случайным артефактом source system.

## 26. `fit_transform()` и `transform()` — почему это не одно и то же

Transformer обычно имеет два этапа.

```python
scaler.fit(X_train)
X_train_scaled = scaler.transform(X_train)
X_valid_scaled = scaler.transform(X_valid)
```

`fit()` извлекает statistics из training data.

Для `StandardScaler` это mean и scale.

`transform()` применяет уже сохранённые statistics.

Удобная команда:

```python
X_train_scaled = scaler.fit_transform(X_train)
```

объединяет эти операции **только для train**.

Опасная ошибка:

```python
scaler.fit_transform(X_valid)
```

Она переобучает preprocessing на validation и делает representation train/validation несогласованным.

## 27. Preprocessing должен пережить production input

Хороший pipeline проверяют не только на чистом notebook dataset.

Нужно представить реальные inputs:

```text
новая category
пропуск
очень большое число
нулевой denominator
неожиданная дата
column order
```

Если notebook preprocessing существует только как последовательность ручных pandas-команд, production service легко начнёт обрабатывать данные иначе.

Поэтому финальный artifact модели должен включать transforms либо иметь строго версионированный и протестированный preprocessing contract.

## 28. Feature engineering как эксперимент

Хороший feature не определяется красивой бизнес-историей.

Например:

```text
days_since_last_login
```

звучит полезно. Но окончательный вопрос:

> улучшает ли он generalization на честной validation?

Полезный experiment log:

```text
baseline                     AP = 0.31
+ recency features           AP = 0.35
+ 30/90-day aggregations     AP = 0.39
+ 250 random interactions    AP = 0.38
```

Так feature engineering превращается из интуитивного творчества в проверяемую научную гипотезу.

## Что нужно унести

1. Model quality начинается с корректного representation.
2. Preprocessing и feature engineering — разные уровни.
3. Пропуск имеет бизнес-смысл.
4. Scaling нужен estimator-dependent.
5. Temporal features привязаны к prediction moment.
6. Aggregations используют только прошлое.
7. Pipeline делает transformations воспроизводимыми.
8. Все fitted transforms должны оставаться внутри train boundary.
9. Domain feature engineering остаётся важным даже для boosting.

## Куда дальше

Самая большая отдельная preprocessing-тема — categorical features. Следующий урок: One-hot encoding, high cardinality, target encoding и native category handling.

## Источники
- scikit-learn User Guide — Preprocessing data.
- scikit-learn — ColumnTransformer and Pipeline.
