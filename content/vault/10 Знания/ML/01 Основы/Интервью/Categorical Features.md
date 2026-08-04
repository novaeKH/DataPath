---
type: concept
area: ml
status: active
tags: [ml, categorical-features, encoding, leakage, interview]
aliases:
  - Категориальные признаки
title: "Categorical Features"
id: concept.ml.categorical-features
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Categorical Features

> [!summary] Главный принцип
> Способ кодирования зависит от модели, cardinality, стабильности категорий и возможности использовать target без утечки. Любая обучаемая кодировка должна вычисляться только по train-части соответствующего fold.

Быстрое повторение: [[Categorical Features — Interview]]  
Связано: [[XGBoost LightGBM and CatBoost#CatBoost: ordered categories и ordered boosting|CatBoost]]

## 1. Что считать категорией

Категория обозначает принадлежность к группе, а не величину:

- город, товар, канал;
- код региона или почтовый индекс;
- `client_id` — идентификатор особого типа;
- рейтинг `low < medium < high` — порядковая категория.

Числовой `dtype` не делает признак непрерывным. Код города `3` не означает «в три раза больше», чем код `1`.

До кодирования спросить:

1. есть ли естественный порядок;
2. сколько уникальных значений;
3. как часто появляются новые категории;
4. является ли признак почти идентификатором;
5. какая модель его получит;
6. доступен ли mapping на inference.

## 2. One-Hot Encoding

Для каждой категории создаётся бинарный столбец:

```text
city=Moscow → [1, 0, 0]
city=Kazan  → [0, 1, 0]
city=Omsk   → [0, 0, 1]
```

Плюсы:

- не создаёт искусственный порядок;
- хорошо подходит линейным моделям;
- понятен и интерпретируем;
- sparse-реализация экономит память.

Минусы:

- размерность растёт с cardinality;
- редкие категории дают слабо оценённые коэффициенты;
- неизвестная категория требует политики `handle_unknown`;
- дерево вынуждено собирать группу категорий несколькими splits;
- взаимодействия категорий нужно строить отдельно или ловить моделью.

### High cardinality

Варианты:

- объединить редкие категории;
- использовать `min_frequency`;
- перейти к frequency/hash/target encoding;
- использовать native categorical model;
- извлечь осмысленную иерархию: товар → категория → отдел.

### Unseen category

`handle_unknown="ignore"` даёт все нули в OHE-блоке. Это безопасно технически, но означает «нет известного сигнала», а не «категория похожа на среднюю».

## 3. Ordinal Encoding

Корректен, когда порядок реален:

```text
junior < middle < senior
low < medium < high
```

Даже тогда расстояния между кодами могут не иметь смысла. Линейная модель воспримет разницу `high-medium` как такую же, как `medium-low`, если не задать другое представление.

Для `Moscow/Kazan/Omsk` ordinal encoding некорректен: порядок выдуман.

## 4. Label Encoding

Label Encoding просто назначает целые коды. Он естественен для target multiclass, но опасен для nominal input features.

Зависимость от модели:

- линейная модель увидит монотонный числовой эффект;
- обычное дерево будет делать splits вида `code <= 2.5`;
- native categorical implementation может использовать integer code лишь как идентификатор категории, если признак явно помечен categorical.

Проблема не в самом числе, а в том, как downstream model его интерпретирует.

## 5. Frequency / Count Encoding

$$
FE(c)=\operatorname{count}(category=c)
\quad\text{или}\quad
\frac{\operatorname{count}(c)}{N}
$$

Плюсы:

- один столбец;
- не использует target;
- работает при высокой cardinality;
- может отражать популярность или надёжность категории.

Ограничения:

- разные категории с одинаковой частотой неразличимы;
- частота может дрейфовать во времени;
- для некоторых задач популярность не связана с target;
- mapping строится только по train, новые категории получают 0/prior.

## 6. Target / Mean Encoding

$$
TE(c)=E[y\mid category=c]
$$

Это мощный supervised feature: категория сразу превращается в оценку связи с target. Но наивная реализация даёт leakage и overfit.

### Почему возникает leakage

Если encoding строки использует её собственный target, редкая категория частично копирует ответ. Категория с одним объектом получит ровно его target.

### Smoothing

$$
TE_{smooth}(c)
=\frac{n_c\bar y_c+\alpha\mu}{n_c+\alpha}
$$

$\mu$ — global mean, $n_c$ — размер категории. Редкие категории тянутся к global prior, частые больше опираются на данные.

Smoothing уменьшает variance, но сам по себе не устраняет использование собственного target.

### Out-of-fold Target Encoding

Для каждого train fold:

1. statistics считаются по остальным folds;
2. применяются к holdout fold;
3. OOF-encoded части собираются вместе;
4. для validation/test mapping строится по всему доступному train.

Так строка не использует собственный target. Если есть time/group структура, и folds должны быть time/group-aware.

## 7. Leave-one-out и ordered encoding

Leave-one-out исключает target текущей строки из статистики категории. Это лучше наивного TE, но строки всё ещё используют «будущие» наблюдения и могут быть зависимы.

CatBoost ordered target statistics использует только предыдущие объекты в permutation и smoothing. Подробнее: [[XGBoost LightGBM and CatBoost#CatBoost: ordered categories и ordered boosting|CatBoost ordered statistics]].

## 8. Hashing

Hashing переводит категорию в один из фиксированного числа buckets.

Плюсы:

- фиксированная память;
- не нужен растущий словарь;
- подходит потокам и очень высокой cardinality;
- unseen category обрабатывается автоматически.

Минусы:

- collisions: разные категории попадают в один bucket;
- хуже интерпретируемость;
- размер пространства — компромисс памяти и collision rate;
- mapping нельзя восстановить без дополнительного журнала.

## 9. Native categorical handling

### CatBoost

- ordered target/count statistics;
- combinations категорий;
- ordered boosting;
- обычно не требует внешнего OHE;
- новые категории опираются на priors.

### LightGBM

- категории передаются как categorical;
- модель ищет полезные группы категорий для split;
- не обязана трактовать integer code как непрерывный;
- подход не равен ordered statistics CatBoost.

### Другие деревья

Возможности зависят от конкретной библиотеки и версии. Нельзя говорить «все деревья сами работают с категориями».

## 10. Нужно ли OHE для деревьев

Для классического дерева без native support нужен способ числового представления. OHE безопасен по отношению к порядку, но может быть неэффективен:

- split по одной dummy отделяет одну категорию от остальных;
- чтобы собрать группу категорий, нужно несколько уровней;
- high cardinality раздувает пространство.

Integer encoding без native semantics позволяет только пороговые группы по произвольному коду и создаёт странные splits.

## 11. Новые категории на production

Нужно заранее определить:

- fallback/prior;
- `unknown` bucket;
- частоту обновления mapping;
- мониторинг доли unseen;
- одинаковые типы и нормализацию строк;
- защиту от опечаток и смены справочника.

Рост unseen rate может быть data drift или поломка preprocessing.

## 12. Признаки-идентификаторы

Почти уникальный ID редко стоит кодировать напрямую:

- модель запоминает объекты;
- новые ID не имеют истории;
- validation с теми же ID может быть оптимистичной.

ID полезен для:

- group split;
- joins;
- исторических агрегатов;
- entity embeddings при достаточной повторяемости;
- retrieval, если есть отдельная стратегия cold start.

## 13. Практический выбор

| Ситуация | Стартовый вариант |
|---|---|
| Линейная модель, низкая cardinality | OHE |
| Реальный порядок | ordinal encoding |
| Высокая cardinality, target нельзя использовать | frequency или hashing |
| Supervised encoding | OOF/time-aware target encoding + smoothing |
| Много категорий, tabular boosting | CatBoost |
| Большой датасет, LightGBM | native categorical |
| Новый товар без истории | content features + fallback |

## 14. Типичные ошибки

- Target Encoding до split.
- OOF encoding с обычным KFold для time series.
- Label Encoding города без учёта модели.
- Несогласованный mapping train и inference.
- Превращение missing и unknown в одну категорию без проверки смысла.
- High-cardinality ID в OHE.
- Уверенность, что native handling автоматически устраняет leakage в остальных признаках.
- Неверная передача category как `float`.

## Связи

- [[Categorical Features — Interview|Быстрое повторение]]
- [[Gradient Boosting — XGBoost, LightGBM, CatBoost]]
- [[Validation Splits and Data Leakage]]
- [[Tabular_ML_Preprocessing]]
- [[Trees and Random Forest]]
