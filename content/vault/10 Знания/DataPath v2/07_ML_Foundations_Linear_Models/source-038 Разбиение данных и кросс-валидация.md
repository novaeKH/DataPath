---
title: "Разбиение данных и кросс-валидация"
id: concept.datapath-v2.038
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 38
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Разбиение данных и кросс-валидация: как не обмануть себя

Модель можно идеально подогнать под данные, на которых она обучалась. Это ещё не означает, что она умеет предсказывать новые объекты.

Главный вопрос машинного обучения:

> **Как модель работает на данных, которых не видела во время обучения?**

Для этого нужны обучающая, валидационная и тестовая выборки, а также кросс-валидация (cross-validation).

Плохая схема разбиения делает бессмысленным любой дальнейший тюнинг. Split — не техническая формальность, а модель того, **как прошлые данные превращаются в будущие prediction cases**.

## 1. Почему train score почти ничего не доказывает

Представим классификатор, который просто запомнил все обучающие строки.

На train:

```text
доля правильных ответов (accuracy) = 100%
```

На новых данных — почти случайное угадывание.

Это крайний пример **переобучения (overfitting)**.

Поэтому обучение и оценка на одних данных — методологическая ошибка.

## 2. Роли train, validation и test

### Обучающая выборка (train set)

На ней модель находит параметры:

```text
коэффициенты
разбиения дерева
веса нейросети
```

### Валидационная выборка (validation set)

На ней решения принимает уже Data Scientist:

- какая модель лучше;
- какой `max_depth`;
- какой `C`;
- какой threshold;
- когда делать early stopping;
- какой набор признаков оставить.

### Тестовая выборка (test set)

Нужна для финальной оценки уже зафиксированного решения.

Схема:

```text
train       → модель учится
validation  → мы выбираем модель
test        → проверяем итоговый выбор
```

Если постоянно смотреть на test и после этого менять решение, test превращается в ещё одну validation set.

## 3. Простое holdout-разбиение

Для независимых объектов:

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)
```

80/20 — не закон. При миллионах строк 5% test может быть более чем достаточно. При маленьких данных один holdout может быть слишком нестабилен.

## 4. Стратификация

Пусть положительный класс — 2%.

При случайном разбиении маленького датасета доля positives может различаться.

```python
train_test_split(
    X,
    y,
    stratify=y,
    random_state=42,
)
```

**Стратификация (stratification)** помогает сохранить пропорции классов.

Но она не исправляет другие утечки. Если один клиент попал в обе части или train содержит будущее, одинаковая доля классов ситуацию не спасёт.

## 5. Почему одного holdout мало

На одном split:

```text
ROC-AUC = 0.78
```

На другом:

```text
ROC-AUC = 0.72
```

Это не обязательно ошибка. Просто validation samples отличаются по сложности.

На небольших данных нужна оценка устойчивости.

## 6. K-fold cross-validation

При `K=5`:

```text
fold 1: VALID | train | train | train | train
fold 2: train | VALID | train | train | train
fold 3: train | train | VALID | train | train
fold 4: train | train | train | VALID | train
fold 5: train | train | train | train | VALID
```

Каждый объект один раз оказывается в validation.

Получаем:

```text
0.77
0.74
0.79
0.72
0.76
```

Теперь важны:

```text
mean
std / разброс
```

Модель A:

```text
0.75 ± 0.01
```

Модель B:

```text
0.77 ± 0.08
```

У B выше среднее, но намного хуже стабильность.

## 7. `cross_validate`

```python
from sklearn.model_selection import cross_validate

scores = cross_validate(
    model,
    X,
    y,
    cv=5,
    scoring=["roc_auc", "average_precision"],
    return_train_score=True,
)
```

`cross_validate` может возвращать несколько metrics, train/validation scores и время обучения.

Большой train–validation gap может указывать на высокий variance, но универсального допустимого gap не существует. Его смотрят вместе с абсолютным уровнем validation metric.

## 8. Leakage через preprocessing

Плохой вариант:

```python
scaler.fit(X)
X_scaled = scaler.transform(X)
cross_val_score(model, X_scaled, y, cv=5)
```

`StandardScaler` уже увидел весь dataset, включая будущие validation folds.

Правильнее:

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

pipeline = make_pipeline(
    StandardScaler(),
    model,
)
```

В каждом fold происходит:

```text
fit scaler на fold train
→ transform fold train
→ fit model
→ transform fold validation
→ evaluate
```

Это особенно критично для imputation, feature selection и target encoding.

## 9. Группы

Допустим:

```text
patient_id
visit_id
features
target
```

У пациента 10 визитов.

Обычный random split может положить восемь визитов в train и два в validation.

Если production-задача — прогнозировать **для новых пациентов**, это слишком лёгкая проверка.

Используют group-aware split, например `GroupKFold`.

Идея:

```text
patient A → только train
patient B → только validation
```

Группой может быть клиент, пациент, магазин, устройство, скважина.

## 10. Временные данные

Если модель прогнозирует будущее, случайное перемешивание может дать ей будущие режимы данных.

Часто честнее:

```text
ранний период → train
более поздний → validation
```

`TimeSeriesSplit` строит последовательные train/test splits, где training portion находится раньше соответствующей test portion.

Схематично:

```text
train | valid
train train | valid
train train train | valid
```

Но готовый splitter не решает автоматически вопросы horizon, gap, overlapping labels и repeated entities.

## 11. Одновременно группы и время

Частый реальный dataset:

```text
client_id
date
```

Нужно защититься и от будущего, и от слишком лёгкого повторного клиента.

Иногда split приходится строить вручную.

Пример:

```text
train: события до 1 июня
validation: июнь
```

а признаки для июньских объектов рассчитывать только по данным, доступным до соответствующего prediction moment.

Главное — не название splitter, а соответствие production process.

## 12. CV и подбор гиперпараметров

Проверяем:

```text
C = 0.01
0.1
1
10
```

и выбираем лучшее по CV.

После этого отдельный test всё равно полезен, потому что мы уже адаптировали выбор модели под CV results.

Для очень строгой оценки model-selection procedure существует nested CV, но на старте важнее безошибочно освоить обычную схему:

```text
train + CV → выбор
test       → финальная оценка
```

## 13. Out-of-fold predictions

Иногда нужны predictions для каждого train-объекта от модели, которая на нём не обучалась.

Это **out-of-fold (OOF) predictions**.

Они полезны для:

- stacking;
- threshold selection;
- calibration;
- error analysis;
- meta-features.

`cross_val_predict` умеет их получать.

Но документация scikit-learn отдельно предупреждает: просто посчитать любую metric на объединённых `cross_val_predict` outputs не всегда эквивалентно корректной cross-validation оценке generalization.

## 14. `random_state`

Фиксированный `random_state` нужен для воспроизводимости.

Он **не делает неправильный split правильным**.

Если будущее попало в train, то `random_state=42` лишь делает ошибку стабильной.

## 15. Как выбрать схему

Задайте вопросы:

**Есть время?**\
Рассмотреть chronological/time split.

**Есть повторяющиеся сущности?**\
Group-aware split.

**Редкий класс?**\
При независимых объектах — stratification.

**Данных мало?**\
Cross-validation информативнее одного holdout.

**Preprocessing чему-то учится на данных?**\
Поместить внутрь Pipeline/CV.

## 16. Пример кредитной задачи

Есть:

```text
client_id
application_date
age
income
previous_loans
target_default_90d
```

У одного клиента несколько заявок.

Простой random split может нарушить сразу две границы:

1. один клиент одновременно в train/test;
2. будущие заявки в train, прошлые в test.

Если модель запускается на будущих заявках, поздний временной период должен играть роль final holdout. Если важно переноситься на новых клиентов, дополнительно контролируется `client_id`.

## 17. Типичные ошибки

**Оценивать на train.**\
Это не generalization.

**Подбирать параметры по test.**\
Test перестаёт быть независимым.

**Fit preprocessing до CV.**\
Information leakage.

**Использовать KFold для времени без размышлений.**\
Модель может увидеть будущее.

**Игнорировать группы.**\
Повторяющиеся сущности делают задачу слишком лёгкой.

**Смотреть только mean CV.**\
Разброс тоже важен.

**Перебирать random seeds и выбрать лучший.**\
Это скрытый tuning под split.

## 18. Проверка понимания

1. Чем validation отличается от test?
2. Зачем CV на маленьких данных?
3. Что говорит std по folds?
4. Почему scaler надо fit внутри fold?
5. Когда нужен GroupKFold?
6. Когда TimeSeriesSplit уместнее KFold?
7. Почему `random_state` не исправляет leakage?
8. Для чего нужны OOF predictions?
9. Почему test нельзя использовать каждый день?
10. Что делать, если данные одновременно групповые и временные?

## 19. Мини-практика

Датасет:

```text
user_id
order_date
basket_size
previous_orders
target_repeat_purchase_30d
```

Пользователи встречаются много раз, история за три года.

Предложите:

1. prediction moment;
2. final test period;
3. способ исключить future leakage;
4. нужно ли group separation;
5. где должен `fit` preprocessing;
6. как оценить stability.

## Что нужно унести

1. Generalization нельзя оценивать на train.
2. Train, validation и test имеют разные роли.
3. K-fold снижает зависимость от одного holdout.
4. Mean без fold variance — неполная картина.
5. Preprocessing обучается только на training portion.
6. Группы и время важнее названия splitter.
7. Pipeline помогает предотвращать leakage.
8. Test нужен после model selection.
9. Хороший split моделирует реальную future use case.

## Куда дальше

Теперь мы умеем получать честные validation predictions. Но нужно решить:

> **Как измерять их качество?**

Следующий урок — MAE/RMSE/R², confusion matrix, доля правильных ответов (accuracy), точность (precision), полнота (recall), ROC-AUC, Average Precision и threshold.

### Источники

- scikit-learn User Guide — Cross-validation: evaluating estimator performance.
- scikit-learn — GroupKFold, TimeSeriesSplit, Pipeline.
- Yandex ML Handbook — Cross-validation.
