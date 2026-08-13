---
title: "Бэггинг, случайный лес и Extra Trees — как усреднение стабилизирует деревья"
id: concept.datapath-v2.047
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 47
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Бэггинг, случайный лес и Extra Trees: как усреднение стабилизирует деревья

В прошлом уроке мы увидели главный недостаток глубокого решающего дерева: оно очень чувствительно к конкретной обучающей выборке. Небольшое изменение данных может изменить верхние разбиения и всю последующую структуру.

Это высокий **разброс / вариативность (variance)**.

Возникает естественная идея:

> если отдельное дерево нестабильно, можно ли построить много разных деревьев и усреднить их predictions?

Да. Так начинается **бэггинг (bagging)**. Затем появляется проблема похожести деревьев — её решает **случайный лес (Random Forest)**. А **Extra Trees** добавляет ещё больше случайности.

---

## 1. Почему усреднение помогает

Пусть несколько моделей ошибаются:

```text
+2
-1
+3
-2
0
-3
+1
+2
-2
0
```

Если ошибки не совпадают, часть отклонений взаимно компенсируется.

Идея ансамбля:

```text
нестабильные отдельные деревья
+
разнообразие
+
усреднение
=
более стабильный prediction
```

Мы не обязаны делать каждое дерево сильнее. Нам важен итоговый ансамбль.

---

## 2. Bagging: разные версии train

Bagging = bootstrap aggregating.

Схема:

```text
bootstrap sample 1 → tree 1
bootstrap sample 2 → tree 2
bootstrap sample 3 → tree 3
...
→ aggregate predictions
```

В regression обычно берётся среднее.

В classification для `RandomForestClassifier` scikit-learn точнее говорить об усреднении class probabilities отдельных деревьев, а не просто о «голосовании классов».

---

## 3. Bootstrap руками

Исходные индексы:

```text
1 2 3 4 5
```

Делаем 5 выборов с возвращением:

```text
2 5 2 1 5
```

Размер sample остался 5, но:

- 2 и 5 повторились;
- 3 и 4 не попали.

Следующее дерево может получить другой набор.

Так создаётся разнообразие обучающих выборок.

---

## 4. Почему уникальных объектов около 63.2%

Вероятность не выбрать конкретный объект один раз:

\[
1-\frac1n.
\]

Не выбрать его во всех \(n\) draws:

\[
\left(1-\frac1n\right)^n.
\]

При большом \(n\):

\[
\left(1-\frac1n\right)^n \approx e^{-1}\approx0.368.
\]

Значит около 36.8% объектов не попадают в конкретную bootstrap sample, а уникальных попадает примерно:

\[
1-0.368=0.632.
\]

Важно:

> bootstrap sample имеет размер \(n\), но уникальных объектов в ней в среднем около 63.2%.

---

## 5. Out-of-bag

Объекты, не попавшие в bootstrap конкретного дерева, называются **out-of-bag (OOB)** для этого дерева.

Для train-объекта можно собрать predictions только от деревьев, которые его не видели, и получить внутреннюю estimate качества.

Но OOB не заменяет корректную validation scheme для:

- временных данных;
- групп;
- специальных production splits.

Это удобный инструмент, а не универсальная магия.

---

## 6. Почему Bagging снижает variance

Пусть variance одного дерева примерно \(\sigma^2\).

Если ошибки деревьев частично независимы, variance среднего уменьшается.

Полезная грубая формула:

\[
Var(\bar T)
\approx
\rho\sigma^2
+
\frac{1-\rho}{B}\sigma^2,
\]

где:

- \(B\) — число деревьев;
- \(\rho\) — средняя correlation их ошибок.

При росте \(B\) вторая часть уменьшается.

Но первая остаётся.

Если деревья почти одинаковые, усреднение помогает мало.

---

## 7. Почему bootstrap недостаточно

Если один feature очень сильный, большинство деревьев может выбрать его в корне даже на разных bootstrap samples.

Деревья останутся похожими, errors — коррелированными.

Чтобы averaging приносил больше пользы, нужно уменьшить similarity деревьев.

Так появляется Random Forest.

---

## 8. Random Forest: две случайности

**Случайный лес (Random Forest)** использует две основные источника случайности.

### Разные объекты

Через bootstrap.

### Разные candidate features

При каждом split рассматривается случайное подмножество признаков.

Даже если один feature самый сильный, он не обязан быть доступен в каждой вершине.

Это делает отдельные деревья немного слабее, но ансамбль — разнообразнее.

---

![Учебная иллюстрация: Random Forest. Bootstrap-выборки, разные деревья и итоговое голосование леса.](content-assets/datapath-v2/figures/47_random_forest.png "Bootstrap-выборки, разные деревья и итоговое голосование леса.")

## 9. Зачем намеренно ослаблять дерево

Пусть при всех признаках деревья очень похожи.

Тогда:

```text
individual tree quality ↑
correlation ↑
benefit from averaging ↓
```

Если уменьшить `max_features`:

```text
diversity ↑
correlation ↓
variance ансамбля ↓
```

Но если зайти слишком далеко:

```text
полезные features часто недоступны
→ bias ↑
```

Это классический bias–variance trade-off.

---

## 10. Как лес делает prediction

### Regression

Деревья:

```text
10, 13, 11, 12, 14
```

Итог:

\[
\hat y=12.
\]

### Classification

В scikit-learn `RandomForestClassifier` усредняет вероятности классов отдельных деревьев.

Интуиция «голосования» полезна, но реализацию лучше понимать точно.

---

## 11. `n_estimators` и плато качества

Больше trees:

```text
→ prediction ensemble стабильнее
```

Но improvement постепенно выходит на плато.

После некоторого числа деревьев дальнейший рост чаще увеличивает:

- training time;
- memory;
- inference cost,

чем quality.

И в отличие от boosting добавление ещё одного независимого дерева обычно не означает последовательную подгонку residual noise.

---

## 12. Глубина деревьев всё равно важна

Классический forest часто использует глубокие деревья:

```text
individual tree:
низкий bias, высокий variance

forest:
variance уменьшается averaging
```

Но `max_depth=None` не является универсальным optimum.

Нужно учитывать:

- memory;
- latency;
- leaf size;
- stability;
- probability quality.

---

## 13. Главные параметры как поведение

### `n_estimators`

Больше → стабильнее до плато, но дороже.

### `max_features`

Меньше → больше diversity, но возможен рост bias.

### `max_depth`

Меньше → проще отдельные trees.

### `min_samples_leaf`

Больше → менее шумные локальные predictions.

### `bootstrap`

У `RandomForest` scikit-learn классический bootstrap по умолчанию включён.

### `max_samples`

Контролирует размер bootstrap sample.

### `n_jobs`

Trees независимы, поэтому обучение хорошо parallelize.

---

## 14. Extra Trees: ещё один шаг к случайности

**Extra Trees (Extremely Randomized Trees)** используют случайный feature subset, но дополнительно рандомизируют candidate thresholds.

Условно:

Random Forest:

```text
random features
→ ищем лучший threshold
```

Extra Trees:

```text
random features
→ случайные thresholds
→ выбираем лучший среди них
```

Это может ещё сильнее уменьшить variance ценой роста bias.

---

## 15. Важное отличие defaults в scikit-learn

В актуальной документации:

```text
RandomForest → bootstrap=True
ExtraTrees    → bootstrap=False
```

по умолчанию.

То есть Extra Trees обычно видят весь train, а разнообразие получают прежде всего через более случайные split rules.

---

## 16. Random Forest vs Extra Trees

| Аспект | Random Forest | Extra Trees |
|---|---|---|
| Bootstrap default | Да | Нет |
| Candidate features | Случайные | Случайные |
| Threshold | Лучший среди доступных | Случайные candidates |
| Randomness | Высокая | Ещё выше |
| Bias | Обычно ниже | Может быть выше |
| Variance | Низкая | Может быть ещё ниже |

Нет универсального победителя. Сравниваем на одинаковых folds.

---

## 17. Feature importance и ловушки

`feature_importances_` в tree models scikit-learn основан на impurity decrease.

Это удобно, но официальная документация предупреждает:

- importance считается по training statistics;
- high-cardinality features могут получать завышенную importance;
- correlated features могут делить importance между собой.

И главное:

> model importance не доказывает причинность.

Для predictive importance полезно сравнивать с permutation importance на validation.

---

## 18. Что происходит внутри `fit()`

Random Forest:

```text
для каждого tree:
1. создать bootstrap sample;
2. строить дерево;
3. в каждой вершине выбрать random feature subset;
4. среди доступных features найти лучший split;
5. сохранить дерево;

после всех trees:
сохранить ensemble.
```

В `predict()` trees не исправляют друг друга:

```text
tree predictions
→ aggregation
```

Это принципиально отличает forest от boosting.

---

## 19. Реальный код

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score

model = RandomForestClassifier(
    n_estimators=500,
    max_features="sqrt",
    min_samples_leaf=5,
    n_jobs=-1,
    random_state=42,
)

model.fit(X_train, y_train)

proba = model.predict_proba(X_valid)[:, 1]
ap = average_precision_score(y_valid, proba)
```

Extra Trees:

```python
from sklearn.ensemble import ExtraTreesClassifier

extra = ExtraTreesClassifier(
    n_estimators=500,
    min_samples_leaf=5,
    n_jobs=-1,
    random_state=42,
)

extra.fit(X_train, y_train)
```

---

## 20. Когда Random Forest хорош

- нужен сильный nonlinear baseline;
- важна устойчивость;
- не хочется сложного tuning;
- есть interactions;
- одно дерево явно переобучается;
- latency/memory приемлемы.

Forest удобно использовать как промежуточный шаг между simple baseline и boosting.

---

## 21. Ограничения

- много глубоких деревьев занимают память;
- inference требует пройти множество trees;
- regression forest плохо экстраполирует;
- хорошее ranking не гарантирует calibration;
- native category support зависит от реализации;
- forest не исправляет leakage или неправильный split.

---

## 22. Интерактивная визуализация

### Режим 1. Нестабильность дерева

Кнопка:

```text
Новая bootstrap sample
```

Decision boundary одного tree меняется.

### Режим 2. 1 → 5 → 50 → 500 trees

Показывать, как averaged probability surface стабилизируется.

### Режим 3. `max_features`

Пользователь меняет:

```text
all
sqrt
1
```

И видит diversity trees и validation quality.

### Режим 4. RF vs Extra Trees

Показывать различие в threshold selection.

---

## 23. Типичные ошибки

**«Random Forest выбирает лучшее дерево».**\
Нет. Смысл именно в aggregation.

**«Каждое следующее tree исправляет предыдущее».**\
Это boosting.

**«Bootstrap = случайно взять 63% строк».**\
Нет. Делается \(n\) выборов с возвращением; уникальных около 63.2%.

**«OOB полностью заменяет CV».**\
Нет.

**«Больше trees бесконечно улучшает quality».**\
Нет, есть плато.

**«max_features нужен только для скорости».**\
Его ключевая роль — decorrelation.

**«feature_importances_ = реальная важность в мире».**\
Нет.

---

## 24. Проверка понимания

1. Почему averaging снижает variance?
2. Почему correlation ошибок важна?
3. Откуда берётся 36.8% OOB?
4. Что Random Forest добавляет к Bagging?
5. Почему маленький `max_features` может и помочь, и навредить?
6. Почему forest хорошо parallelize?
7. Чем Extra Trees отличаются по thresholds?
8. Почему `n_estimators` выходит на плато?
9. Когда OOB недостаточно?
10. Почему impurity importance не равна causal importance?

---

## 25. Мини-практика

| Модель | Train ROC-AUC | CV ROC-AUC | CV std |
|---|---:|---:|---:|
| Tree | 1.00 | 0.72 | 0.08 |
| RF | 0.99 | 0.82 | 0.02 |
| Extra Trees | 0.98 | 0.81 | 0.02 |

Ответьте:

1. что произошло с variance;
2. почему RF train score всё ещё очень высокий;
3. можно ли назвать RF overfit только по train=0.99;
4. является ли 0.82 vs 0.81 убедительной победой без fold-level анализа;
5. что проверить по latency и memory.

---

## 26. Как объяснить на собеседовании

### Что такое Random Forest?

**Коротко.**\
Ансамбль деревьев, который снижает variance через averaging. Деревья различаются благодаря bootstrap samples и случайному subset признаков при split.

### Зачем `max_features`?

Чтобы сильные features не делали все trees одинаковыми и errors менее correlated.

### Что такое OOB?

Prediction train-объекта строится по trees, которые не видели его в своих bootstrap samples.

### Чем Extra Trees отличаются?

Они сильнее рандомизируют thresholds; в sklearn bootstrap по умолчанию выключен.

---

## 27. Что нужно унести

1. Bagging строит независимые модели на bootstrap samples.
2. В bootstrap size \(n\) около 63.2% уникальных объектов.
3. OOB — объекты, не увиденные конкретным tree.
4. Averaging снижает variance при неполной correlation.
5. Random Forest добавляет feature subsampling.
6. `max_features` балансирует diversity и силу trees.
7. Forest хорошо parallelize.
8. Больше trees помогает до плато.
9. Extra Trees добавляет randomness thresholds.
10. MDI importance имеет ограничения.
11. Random Forest — сильный nonlinear baseline.
12. Но он не лечит leakage.

---

## Куда дальше

Random Forest использует:

> **много независимых деревьев + усреднение.**

Следующий путь принципиально другой:

> строить деревья последовательно, каждое — как correction текущего ансамбля.

Так появляется градиентный бустинг (Gradient Boosting).

## Источники
- scikit-learn User Guide — Random forests and other randomized tree ensembles.
- Trees_and_Boosting_Interview_Guide_RU — структурный референс.
