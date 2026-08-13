---
title: "XGBoost, LightGBM и CatBoost — что действительно различается под капотом"
id: concept.datapath-v2.049
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 49
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# XGBoost, LightGBM и CatBoost: что действительно различается под капотом

После обычного Gradient Boosting легко попасть в одну из двух крайностей.

Первая:

> «XGBoost, LightGBM и CatBoost — одно и то же, только названия разные».

Вторая:

> «Это три совершенно независимых алгоритма, которые надо изучать отдельно с нуля».

Обе картины плохие.

Все три принадлежат к семейству gradient-boosted decision trees, но по-разному решают статистические и инженерные проблемы:

- как оценивать полезность нового split;
- как ускорить поиск splits;
- как контролировать сложность;
- как использовать информацию второго порядка;
- как строить tree;
- как работать с categorical features;
- как уменьшать leakage-подобные эффекты при target statistics;
- как сделать inference быстрым.

Цель урока — научиться отвечать не «какая библиотека лучше», а:

> **какие design decisions отличают их друг от друга и когда эти различия становятся важны?**

---

# 1. Общий фундамент

Во всех трёх случаях остаётся базовая идея:

\[
F_m(x)=F_{m-1}(x)+\text{correction}_m(x).
\]

Новая tree model строится с учётом текущего ensemble и добавляет correction.

Общий процесс:

```text
current predictions
→ derivatives of loss
→ build next tree
→ choose leaf values
→ add tree
→ repeat
```

Главные отличия начинаются дальше:

```text
как считаем gain
как строим tree
какую complexity штрафуем
как представляем features
как ускоряем split search
```

---

# 2. XGBoost: regularized boosting

XGBoost — одна из самых известных реализаций gradient tree boosting.

Полезный mental model:

> обычный boosting спрашивает: «уменьшит ли новое tree loss?»

XGBoost дополнительно делает акцент на вопросе:

> «достаточно ли улучшение, чтобы оправдать дополнительную сложность модели?»

---

## 3. Регуляризованная objective

Концептуально:

\[
Objective
=
Training\ Loss
+
Model\ Complexity.
\]

Это важное отличие от слишком примитивной картинки:

```text
tree на residuals
→ добавить
→ повторить
```

Complexity может штрафовать:

- число leaves;
- величины leaf weights;
- слишком слабые splits.

То есть новое tree должно не только улучшить fit, но и «окупиться».

---

## 4. Gradient и Hessian

В базовом Gradient Boosting мы использовали первый derivative — gradient.

XGBoost использует при локальном приближении objective информацию:

```text
gradient
+
Hessian
```

Интуитивно:

**gradient**

> в какую сторону менять prediction;

**Hessian**

> как быстро меняется gradient, то есть какова локальная кривизна loss.

Это позволяет точнее оценивать изменение objective при candidate split и выбирать leaf values.

Не надо сводить Hessian к фразе «второй residual». Это второй derivative information, а не ещё одна ошибка того же типа.

---

## 5. Gain: должен ли split существовать вообще

При candidate split XGBoost оценивает improvement objective.

Если выигрыш слишком мал, split можно не делать.

Параметры вроде `gamma` / `min_split_loss` вводят дополнительный порог на полезность split.

Mental model:

```text
новый split
→ уменьшает loss
→ но делает model сложнее
→ split нужен, только если выигрыш достаточен
```

---

## 6. L1 и L2 regularization

XGBoost позволяет штрафовать leaf weights.

L2:

```text
сглаживает большие corrections
```

L1:

```text
может сильнее прижимать отдельные weights к нулю
```

Это напоминает Ridge/Lasso по общей идее penalties, но математика и объект regularization здесь другой.

Поэтому фраза:

> «XGBoost просто делает Ridge на деревьях»

слишком грубая.

---

## 7. Sampling в XGBoost

Можно использовать:

- `subsample` объектов;
- column subsampling признаков.

Это помогает:

- regularization;
- diversity;
- speed.

Получается интересная связь с Random Forest: случайность используется и в boosting, но ensemble остаётся последовательным.

---

# 8. LightGBM: ускоряем построение tree

У точного split search есть цена.

Если feature имеет миллионы уникальных значений, проверять огромный набор candidate thresholds дорого.

LightGBM делает сильный акцент на histogram-based learning.

---

## 9. Histogram-based split search

Вместо хранения каждого continuous value как отдельного candidate threshold значения квантуются в **bins**.

Пример:

```text
1.1
1.3
1.9
2.2
2.6
3.1
3.8
4.5
```

можно представить как:

```text
bin 0: [1, 2)
bin 1: [2, 3)
bin 2: [3, 4)
bin 3: [4, 5)
```

Затем по bins накапливаются gradient statistics.

Вместо многократного перебора точных raw values алгоритм работает с компактными histograms.

Преимущества:

- быстрее split search;
- меньше memory;
- удобнее large-scale training.

Цена — небольшая потеря точности представления значения, потому что несколько raw values оказываются в одном bin.

---

## 10. Leaf-wise growth

Одна из самых известных особенностей LightGBM — **leaf-wise / best-first growth**.

Обычный depth-wise подход:

```text
развиваем tree уровень за уровнем
```

Leaf-wise:

```text
среди текущих leaves
найти leaf с максимальным potential loss reduction
→ split именно его
```

При фиксированном числе leaves это часто быстрее уменьшает training loss.

---

## 11. Почему leaf-wise может переобучаться

Если данных мало, algorithm может много раз углублять одну локальную область.

Получается асимметричное, очень специализированное tree.

Поэтому официальная документация LightGBM отдельно предупреждает:

> leaf-wise growth может overfit на маленьких datasets.

Контроль:

- `num_leaves`;
- `max_depth`;
- `min_data_in_leaf` / `min_child_samples`;
- L1/L2;
- sampling;
- early stopping.

---

## 12. Почему `num_leaves` особенно важен

В depth-wise tree человек часто первым вспоминает `max_depth`.

В leaf-wise tree очень полезно думать через число leaves.

Больше `num_leaves`:

```text
больше локальных regions
→ train loss ↓
→ capacity ↑
→ risk overfit ↑
```

Но связь `num_leaves` и depth не линейна: leaf-wise tree может быть сильно несимметричным.

---

## 13. Категориальные признаки в LightGBM

LightGBM имеет нативные механизмы для categorical features.

One-hot encoding — не единственный вариант.

Для category feature задача split выглядит не как:

```text
x <= threshold
```

а как:

> какие категории отправить в left subset, а какие — в right?

Полный перебор всех subsets дорог.

В официальной документации LightGBM описан эффективный подход через сортировку категорий по accumulated gradient/Hessian statistics и поиск лучшего разделения по этому порядку.

Это важная идея:

> category feature можно split не только через One-hot encoding.

Но нужно правильно передавать тип признака и учитывать API конкретной версии.

---

# 14. CatBoost: почему категории требуют отдельной статистики

Представим feature:

```text
city
```

с тысячами категорий.

One-hot encoding может создать тысячи binary columns.

Другая идея:

```text
для каждой category
посчитать mean target
```

Например:

```text
Moscow → 0.18
Kazan  → 0.12
Omsk   → 0.09
```

Но наивный target encoding имеет серьёзную проблему.

---

## 15. Почему наивный target encoding течёт

Пусть строка:

```text
city = X
target = 1
```

Если statistic категории X считается по всему train, включая эту же строку, target объекта влияет на его собственный feature.

Модель получает часть ответа.

Особенно плохо для редких categories.

Например category встречается один раз:

```text
target = 1
```

Наивный mean:

```text
encoded_value = 1.0
```

Это почти прямое копирование target.

---

## 16. Ordered category statistics

CatBoost использует ordered-подходы.

Упрощённая интуиция:

объекты идут в некотором порядке.

Для текущего объекта statistic category строится только по **предыдущим** объектам.

Пример:

```text
1: city=A, y=1
2: city=A, y=0
3: city=A, y=1
```

Для объекта 2 statistic может использовать информацию объекта 1, но не target объекта 2 и не будущий объект 3.

Реальный CatBoost использует permutations, priors и несколько видов CTR statistics, но mental model остаётся:

> текущий объект не должен подсматривать собственный target при создании category statistic.

---

## 17. Ordered boosting

CatBoost paper рассматривает ещё одну проблему — prediction shift / bias, возникающий при стандартном boosting-подходе, когда training signal для объекта строится моделью, которая уже обучалась на этом же объекте.

Ordered boosting использует идею последовательного / ordered вычисления, чтобы уменьшать такой bias.

Не нужно реализовывать алгоритм вручную.

Нужно понимать, что CatBoost — это не:

```text
Gradient Boosting
+
автоматический One-hot encoding
```

Его основные идеи глубже.

---

## 18. Симметричные деревья

По умолчанию CatBoost использует **симметричные деревья (SymmetricTree)**.

На одном уровне применяется одно и то же условие ко всем leaves этого уровня.

Например:

```text
уровень 1:
age <= 30?

уровень 2:
income <= 80?
```

На втором уровне условие `income <= 80` применяется к обеим ветвям первого split.

Это ограничивает пространство возможных structures.

Плюсы:

- очень быстрый inference;
- компактная predictable structure;
- дополнительный regularization effect.

В CatBoost доступны и другие grow policies, но `SymmetricTree` является default.

---

## 19. Что значит «CatBoost хорошо работает с категориями»

Не магия.

За этим стоят:

- category statistics;
- ordered computation;
- priors;
- feature combinations;
- специальные tree/split mechanisms.

Поэтому часто можно передавать categorical columns напрямую через `cat_features`.

Но CatBoost **не знает**, что:

```text
June data — будущее относительно May
```

или что:

```text
client_id должен быть разделён по группам
```

Он не отменяет time leakage, group leakage и неправильный target design.

---

# 20. Сравним архитектурные решения

| Аспект | XGBoost | LightGBM | CatBoost |
|---|---|---|---|
| Семейство | Gradient tree boosting | Gradient tree boosting | Gradient tree boosting |
| Главный акцент | Regularized objective, гибкость | Histogram + speed + leaf-wise | Categories + ordered methods |
| Tree growth | Несколько policies | Leaf-wise best-first | SymmetricTree default |
| Category handling | Зависит от API/version | Native categorical splits | Ключевая специализация |
| Binning | Современные tree methods используют hist approaches | Центральная идея | Quantization тоже используется |
| Derivatives | Gradient + Hessian | Gradient/Hessian statistics | Gradient boosting machinery |
| Особый риск | Сложный tuning | Leaf-wise overfit | Ошибки data split всё равно остаются |

Таблица нужна как карта design choices, а не ranking.

---

## 21. Что нельзя говорить

### «CatBoost всегда лучший при категориях»

Нет. Это сильный кандидат, но результат зависит от:

- объёма данных;
- cardinality;
- signal;
- hardware;
- objective;
- latency;
- validation.

### «LightGBM всегда быстрее XGBoost»

Нет универсальной гарантии. Скорость зависит от dataset, params, hardware и version.

### «XGBoost всегда самый точный»

Нет.

### «CatBoost полностью предотвращает leakage»

Нет. Он решает определённые leakage-like biases внутри собственного algorithm, но не исправляет временную или групповую ошибку dataset design.

---

## 22. Когда что попробовать первым

### Много categorical features

CatBoost — естественный первый кандидат.

### Большой dataset, важна training speed

LightGBM стоит обязательно проверить.

### Нужна гибкая mature boosting implementation

XGBoost — сильный кандидат.

### Хотим остаться только в sklearn

`HistGradientBoostingClassifier/Regressor` тоже важный benchmark.

Но финальный выбор:

```text
same folds
same metric
same leakage rules
+
latency
memory
training cost
stability
```

---

## 23. One-hot encoding и native categories

One-hot encoding остаётся нормальным универсальным методом.

Но high-cardinality feature:

```text
5000 categories
```

создаёт до тысяч columns.

Tree может понадобиться сложная структура, чтобы объединить несколько category indicators в общий pattern.

LightGBM и CatBoost используют специальные category mechanisms.

Это не означает:

> One-hot encoding устарел.

Выбор зависит от estimator и задачи.

---

## 24. Missing values

Современные boosting libraries имеют собственные механизмы обработки missing values.

Поэтому автоматическое:

```text
fillna(mean)
```

не должно быть рефлексом.

Нужно проверять official docs конкретной модели:

- поддерживает ли missing values;
- как направляет missing при split;
- что происходит на inference.

---

## 25. Early stopping

Boosting family почти всегда выигрывает от контроля validation trajectory.

Схема:

```text
train
→ fit

validation
→ best iteration
```

Но конкретный API меняется между libraries и versions.

Гораздо важнее понимание:

> количество trees выбирается по generalization, а не по минимальному train loss.

---

## 26. Практический CatBoost

```python
from catboost import CatBoostClassifier
from sklearn.metrics import average_precision_score

model = CatBoostClassifier(
    iterations=2000,
    learning_rate=0.05,
    depth=6,
    loss_function="Logloss",
    verbose=False,
)

model.fit(
    X_train,
    y_train,
    cat_features=cat_columns,
    eval_set=(X_valid, y_valid),
)

proba = model.predict_proba(X_valid)[:, 1]
ap = average_precision_score(y_valid, proba)
```

Смысл примера — не выучить параметры, а увидеть, что categories передаются как special feature type.

---

## 27. Практический LightGBM

```python
from lightgbm import LGBMClassifier

model = LGBMClassifier(
    n_estimators=2000,
    learning_rate=0.05,
    num_leaves=31,
    random_state=42,
)

model.fit(
    X_train,
    y_train,
    eval_set=[(X_valid, y_valid)],
)
```

При tuning особое внимание:

```text
num_leaves
max_depth
min_child_samples
```

из-за leaf-wise growth.

---

## 28. Практический XGBoost

```python
from xgboost import XGBClassifier

model = XGBClassifier(
    n_estimators=2000,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_lambda=1.0,
    random_state=42,
)

model.fit(
    X_train,
    y_train,
    eval_set=[(X_valid, y_valid)],
)
```

Конкретный early-stopping API лучше всегда сверять с актуальной документацией installed version.

---

## 29. Как тюнить без перебора всего мира

### Сначала validation scheme

Если split неправильный, tuning бессмыслен.

### Затем `learning_rate` и iterations

Определяем общий темп ансамбля.

### Затем tree complexity

XGBoost:

```text
max_depth
min_child_weight
```

LightGBM:

```text
num_leaves
max_depth
min_child_samples
```

CatBoost:

```text
depth
grow policy related controls
```

### Затем sampling

```text
subsample
feature sampling
```

### Затем penalties

L1/L2 и library-specific regularization.

Не нужно тюнить parameter только потому, что он существует.

---

## 30. Выбор по реальным результатам

| Model | AP | CV std | Train time | Predict time |
|---|---:|---:|---:|---:|
| XGBoost | 0.421 | 0.006 | 6 min | 18 ms |
| LightGBM | 0.424 | 0.009 | 2 min | 10 ms |
| CatBoost | 0.429 | 0.005 | 8 min | 14 ms |

Нельзя автоматически сказать:

> CatBoost победил.

Нужно спросить:

- насколько значим difference;
- какова variation по folds;
- есть ли latency SLA;
- сколько стоит retraining;
- что происходит по segments;
- насколько model size отличается.

Model selection — инженерное решение.

---

## 31. Интерактивная визуализация DataPath

### Экран 1. Общий boosting signal

Показать одинаковые gradients / residuals.

Три вкладки:

```text
XGBoost
LightGBM
CatBoost
```

Starting point один.

### Экран 2. Tree growth

**LightGBM**

Подсветить leaf с максимальным gain и split только его.

**CatBoost**

Показать одинаковое split condition на всём уровне.

**XGBoost**

Показать candidate split и regularized gain.

### Экран 3. Категории

Наивный target mean:

```text
target текущего объекта участвует
→ красный leakage signal
```

Ordered statistic:

```text
используются только previous objects
```

Это одна из важнейших visual scenes всей темы.

---

## 32. Типичные ошибки понимания

**«XGBoost — sklearn GradientBoosting, только быстрее».**\
Слишком грубо: objective, regularization и tree algorithms различаются.

**«LightGBM растёт обычным level-wise способом».**\
Его известная особенность — leaf-wise best-first growth.

**«CatBoost = boosting + One-hot encoding».**\
Нет. Ключевые идеи — ordered category statistics и ordered boosting.

**«Hessian — второй residual».**\
Нет.

**«Native categories исключают leakage».**\
Нет.

**«Все parameters надо тюнить».**\
Нет.

---

## 33. Проверка понимания

1. Что общего у XGBoost, LightGBM и CatBoost?
2. Зачем XGBoost использует Hessian?
3. Что значит regularized objective?
4. Как histogram binning ускоряет split search?
5. Чем leaf-wise отличается от depth-wise?
6. Почему leaf-wise может overfit?
7. В чём проблема наивного target encoding?
8. Какова интуиция ordered statistics?
9. Что такое symmetric tree?
10. Почему нет универсального победителя?

---

## 34. Мини-практика

### Ситуация A

```text
2 млн строк
20 numeric features
2 low-cardinality categorical
важна скорость training
```

### Ситуация B

```text
100 тыс. строк
40 categorical features
часть имеет тысячи categories
```

### Ситуация C

```text
500 тыс. строк
все numeric
нужен гибко regularized benchmark
```

Для каждой ситуации ответьте:

1. какой candidate попробовать первым;
2. какой baseline оставить;
3. какую validation scheme использовать;
4. какие 3–4 parameters тюнить в первую очередь;
5. какие operational characteristics кроме ML metric измерять.

---

## 35. Как объяснить на собеседовании

### XGBoost

**Коротко.**\
Регуляризованная и оптимизированная реализация gradient tree boosting, использующая first- и second-order derivatives objective и развитые controls сложности и sampling.

### LightGBM

**Коротко.**\
Histogram-based gradient boosting с leaf-wise growth: развивает leaf с максимальным потенциальным уменьшением loss, что быстро, но требует контроля сложности на небольших данных.

### CatBoost

**Коротко.**\
Gradient boosting с особыми ordered-механизмами работы с categorical features и ordered boosting; по умолчанию использует symmetric trees.

---

## 36. Что нужно унести

1. Все три — gradient tree boosting family.
2. XGBoost делает сильный акцент на regularized objective и second-order information.
3. LightGBM — на histograms и leaf-wise growth.
4. Leaf-wise growth требует контроля capacity.
5. CatBoost — на ordered categorical statistics и boosting.
6. CatBoost default — symmetric trees.
7. One-hot encoding не единственный способ категорий.
8. Native categories не отменяют leakage checks.
9. Early stopping и validation важнее бесконечного tuning.
10. Финальный выбор учитывает quality, stability, training cost, latency и data types.

---

## Куда дальше

Мы закончили основную линию деревьев:

```text
Decision Tree
→ Bagging
→ Random Forest / Extra Trees
→ Gradient Boosting
→ XGBoost / LightGBM / CatBoost
```

Теперь вопрос смещается с:

> «какой алгоритм?»

на:

> **«какие данные и признаки мы ему подаём?»**

Следующий блок — предобработка, feature engineering, categorical features, class imbalance и probability calibration.

## Источники
- XGBoost official documentation — Introduction to Boosted Trees.
- LightGBM official documentation — Features.
- CatBoost official docs — categorical features, ordered boosting, tree growing policies.
- CatBoost: unbiased boosting with categorical features, NeurIPS 2018.
