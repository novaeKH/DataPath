---
title: "Категориальные признаки и One-hot encoding"
id: concept.datapath-v2.051
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 51
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Категориальные признаки и One-hot encoding

Человек понимает:

```text
city = Moscow
device = iPhone
tariff = Premium
```

Большинство моделей ожидает числа. Но нельзя просто заменить категории числами 0, 1, 2: так легко добавить фиктивный порядок и расстояние.

## 1. Nominal и ordinal

**Номинальные (nominal)** categories не имеют порядка:

```text
red, green, blue
```

**Порядковые (ordinal)** имеют:

```text
low < medium < high
```

Encoding должен сохранять реальную структуру feature.

## 2. Почему integer codes опасны

```text
Moscow=0
Kazan=1
Omsk=2
```

Для linear/distance models возникает искусственная геометрия: `Omsk` как будто вдвое дальше от `Moscow`, чем `Kazan`.

Это не свойство данных, а артефакт encoding.

## 3. One-hot encoding

One-hot encoding создаёт отдельный binary column на category.

Было:

| city |
|---|
| Moscow |
| Kazan |
| Moscow |

Стало:

| city_Moscow | city_Kazan |
|---:|---:|
| 1 | 0 |
| 0 | 1 |
| 1 | 0 |

В scikit-learn:

```python
from sklearn.preprocessing import OneHotEncoder

ohe = OneHotEncoder(handle_unknown="ignore")
```

## 4. Что делает `fit()`

`fit()` запоминает categories, увиденные на train. `transform()` использует тот же mapping для новых objects.

Поэтому encoder, как любой fitted transformer, обучается только на training portion.

## 5. Unseen category

Train:

```text
Moscow
Kazan
```

Production:

```text
Vladivostok
```

С `handle_unknown="ignore"` неизвестная category кодируется нулями по известным OHE columns этого feature.

Pipeline не ломается, но model не получает отдельного выученного effect новой category.

## 6. Редкие categories

High-cardinality feature:

```text
merchant_id → 100 000 unique values
```

может создать огромный feature space.

`OneHotEncoder` поддерживает grouping infrequent categories через параметры вроде `min_frequency` и `max_categories`.

Это помогает ограничить dimensionality.

## 7. Sparse output

OHE matrix почти полностью состоит из нулей. Поэтому хранить dense array может быть очень дорого.

Например 10 000 categories → один объект содержит одну `1` и тысячи `0`.

Sparse representation хранит только ненулевые элементы и структуру индексов.

Не нужно бездумно вызывать `.toarray()` на больших OHE matrices.

## 8. Нужно ли `drop="first"`

При intercept полный набор K dummy columns линейно зависим:

```text
A + B + C = 1.
```

Для классической статистической интерпретации это важно.

Но в regularized ML-model удаление первой category не всегда обязательно и может нарушать симметрию penalty.

Поэтому `drop="first"` — не автоматическое правило.

## 9. OrdinalEncoder

Для реального order:

```text
low → 0
medium → 1
high → 2
```

можно использовать `OrdinalEncoder`.

Но `city → 0,1,2` не становится корректным только потому, что вызван специальный класс.

## 10. Frequency encoding

Category заменяется частотой:

```text
Moscow → 0.40
Kazan → 0.15
Omsk → 0.05
```

Плюсы: один numeric feature, target не используется.

Минусы: разные categories с одинаковой frequency становятся неразличимы, frequency может drift.

Statistics считаются только по train.

## 11. Target encoding

Category заменяется statistic target:

```text
tariff A → churn rate 0.08
tariff B → 0.24
```

Это мощно, но напрямую использует y.

Главный риск — leakage.

## 12. Наивный target encoding

Category встречается один раз:

```text
merchant_123
target=1
```

Если mean считается по той же строке:

```text
merchant_123 → 1.0
```

Feature почти копирует target.

Нужны OOF/cross-fitted statistics, smoothing или ordered mechanisms.

## 13. Out-of-fold target encoding

Train делится на folds.

Для fold 1 statistics считаются без fold 1, затем transform fold 1. Повторяется для каждого fold.

Для validation/test encoder statistics строятся только по training data.

Так target текущей строки не участвует в её собственном encoding напрямую.

## 14. Smoothing

Category с 2 observations и mean=1.0 менее надёжна, чем category с 10 000 observations и mean=0.4.

Smoothing тянет редкие categories к global prior:

```text
мало данных → больше доверяем global mean
много данных → больше category mean
```

## 15. CatBoost и ordered category statistics

CatBoost известен специальными ordered mechanisms: statistic для текущего объекта строится без прямого использования его target, используя предыдущую информацию в permutation и priors.

Это уменьшает конкретный leakage-like bias target statistics, но не отменяет time leakage, group leakage и неправильный split.

## 16. LightGBM и native categories

LightGBM может работать с categorical features без обязательного OHE и искать полезное разделение categories на группы.

Поэтому universal rule «все categories → One-hot encoding» неверно для всех estimators.

## 17. Как выбирать encoding

**Низкая cardinality + Logistic Regression** → OHE как сильный baseline.

**Настоящий ordinal feature** → ordinal encoding.

**High cardinality** → frequency/target encoding с защитой от leakage или native category model.

**CatBoost** → сначала разумно проверить native categorical path.

## 18. Interactions

OHE + linear model может требовать явных interactions.

Trees способны найти conditional effects автоматически через последовательные splits.

Поэтому одна и та же category representation по-разному взаимодействует с разными model families.

## 19. IDs

`user_id`, `device_id`, `order_id` часто почти уникальны.

Передача их напрямую может привести к memorization и плохой generalization на unseen entities.

Часто полезнее агрегаты:

```text
user_order_count
user_mean_spend
days_since_user_registration
```

## 20. Pipeline с OHE

```python
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

num_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scale", StandardScaler()),
])

cat_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("ohe", OneHotEncoder(
        handle_unknown="ignore",
        min_frequency=5,
    )),
])

prep = ColumnTransformer([
    ("num", num_pipe, numeric_columns),
    ("cat", cat_pipe, categorical_columns),
])

model = Pipeline([
    ("preprocess", prep),
    ("classifier", LogisticRegression(max_iter=1000)),
])
```

## 21. Что происходит внутри OHE

```text
fit:
→ найти categories каждого feature
→ определить grouping infrequent values
→ построить output mapping

transform:
→ найти category
→ поставить 1 в нужный output column
→ unknown обработать по policy
```

## 22. Интерактивная визуализация

1. Integer encoding: показать искусственные distances.
2. OHE: показать binary dimensions.
3. Cardinality slider 3 → 10 000: dimensionality и sparsity.
4. Target encoding: rare category из одного объекта; naive mode подсвечивает leakage, OOF/ordered скрывает target текущей строки.

## 23. Типичные ошибки

- любую category заменить 0/1/2;
- считать OHE всегда лучшим;
- всегда использовать `drop="first"`;
- считать unknown category «понятой» моделью;
- target encoding на всём dataset;
- утверждать, что CatBoost предотвращает любой leakage.

## 24. Проверка понимания

1. Nominal vs ordinal?
2. Почему integer city code опасен?
3. Что делает One-hot encoding?
4. Зачем sparse output?
5. Что делает `handle_unknown="ignore"`?
6. Почему high cardinality сложна?
7. Frequency vs target encoding?
8. Почему naive target encoding течёт?
9. Что делает OOF encoding?
10. Почему native categories не отменяют честный split?

## 25. Мини-практика

```text
gender: 3 categories
education_level: school < bachelor < master < phd
city: 500 categories
user_id: 900 000 categories
tariff: 8 categories
```

Предложите encoding для Logistic Regression и отдельно для CatBoost. Объясните, какой feature лучше не передавать напрямую и где нужен OOF target encoding.


## 26. Почему одна и та же category может требовать разной обработки

Возьмём:

```text
city
```

Для Logistic Regression OHE создаёт отдельный additive coefficient на город.

Для Decision Tree OHE превращает вопрос о городе в множество binary splits:

```text
city_Moscow <= 0.5?
city_Kazan <= 0.5?
```

Для CatBoost исходная category может обрабатываться специальным native mechanism.

То есть encoding нельзя выбирать отдельно от estimator.

Полезная мысль:

> preprocessing задаёт geometry и representation задачи, а разные модели используют эту geometry по-разному.

## 27. Редкая category и unknown category — не одно и то же

**Редкая category** встречалась на train, но мало раз.

**Unknown category** вообще не встречалась при `fit()` encoder.

Это разные ситуации.

Rare values можно:

- оставить;
- объединить в infrequent group;
- smooth при target encoding.

Unknown values требуют policy inference-time handling.

`OneHotEncoder` в современных версиях scikit-learn имеет отдельные механизмы для unknown и infrequent categories, поэтому эти понятия не стоит смешивать.

## 28. Почему OHE не обязательно «взрывает память»

Количество columns действительно может стать огромным, но OHE output обычно sparse.

Пример:

```text
1 000 000 rows
10 000 possible categories
```

dense matrix была бы непрактичной.

Sparse representation хранит в основном positions единиц.

Поэтому оценивать стоимость OHE нужно через:

```text
cardinality
density
estimator sparse support
memory
training time
```

а не только через число columns.

## 29. Как проверять category feature

Для нового categorical feature полезно провести три проверки.

### Coverage

Сколько categories и насколько они часты?

### Stability

Появляются ли новые categories между временными периодами?

### Target relationship

Есть ли signal и насколько он устойчив на validation?

Очень редкая category с идеальным train target mean часто является не сильным signal, а источником variance.

## 30. Encoding и production contract

Encoder должен уметь воспроизводимо отвечать:

```text
какие categories были известны на fit;
как называются output columns;
что происходит с unknown;
что происходит с missing;
как группируются infrequent values.
```

Именно поэтому сохранённый fitted encoder внутри Pipeline надёжнее, чем ручное повторение `pd.get_dummies()` отдельно в train notebook и отдельно в API.

## Что нужно унести

1. Encoding должен сохранять смысл category.
2. Nominal и ordinal — разные типы.
3. Integer codes могут создать ложный order.
4. OHE создаёт binary representation без искусственного расстояния.
5. Sparse representation важна при большой cardinality.
6. Unknown categories требуют policy.
7. Target encoding требует anti-leakage logic.
8. Smoothing особенно важен для rare categories.
9. Native category handling зависит от estimator.
10. CatBoost не заменяет корректную validation scheme.

## Куда дальше

Теперь представим fraud dataset, где positive class — 0.5%. Следующая проблема уже не encoding, а **дисбаланс классов**: как оценивать model, нужны ли weights, oversampling, SMOTE и threshold.

## Источники
- scikit-learn — OneHotEncoder and preprocessing.
- CatBoost documentation — categorical feature processing.
