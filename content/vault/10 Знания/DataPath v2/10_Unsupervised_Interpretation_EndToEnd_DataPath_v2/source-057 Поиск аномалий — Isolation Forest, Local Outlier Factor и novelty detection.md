---
title: "Поиск аномалий — Isolation Forest, Local Outlier Factor и novelty detection"
id: concept.datapath-v2.057
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 57
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Поиск аномалий: что считать необычным объектом

В supervised fraud detection у нас есть target:

```text
fraud = 1
normal = 0
```

Но часто labels нет или они неполные.

Нужно обнаруживать:

- необычные транзакции;
- поломки оборудования;
- сетевые атаки;
- ошибочные sensor readings;
- редкие производственные режимы.

Так возникает **поиск аномалий (anomaly detection)**.

Проблема сложнее, чем кажется:

> «аномалия» не является универсальным математическим свойством точки.

Она зависит от того, что мы считаем normal behavior.

Одна и та же точка может быть обычной глобально, но необычной относительно соседей.

---

## 1. Outlier detection и novelty detection

scikit-learn проводит полезное различие.

### Outlier detection

Training data уже содержит смесь normal objects и outliers.

Задача:

> найти unusual observations внутри этого dataset.

### Novelty detection

Training data предполагается в основном normal.

После fit нужно определить:

> является ли **новый unseen object** похожим на normal training distribution?

Это разные operational scenarios.

---

## 2. Почему обычная классификация часто лучше, если labels хорошие

Если у нас есть надёжная разметка:

```text
fraud/non-fraud
```

supervised classifier обычно способен напрямую изучить признаки event.

Unsupervised anomaly detection особенно полезен, когда:

- labels нет;
- rare patterns постоянно меняются;
- хотим candidate generation;
- нужно дополнить supervised model.

Не надо использовать Isolation Forest только потому, что fraud редкий.

Rare classification и anomaly detection — не одно и то же.

---

# Часть I. Isolation Forest

## 3. Главная идея: аномалию легче изолировать

Представим плотное облако normal points и одну далёкую point.

Если случайно выбирать:

```text
feature
threshold
```

далёкую point часто можно отделить всего несколькими splits.

Для обычной точки внутри плотного cloud понадобится больше splits.

**Isolation Forest** использует эту идею:

> anomalies имеют в среднем более короткие пути изоляции в random trees.

---

## 4. Random isolation tree

Упрощённый процесс:

```text
1. случайно выбрать feature;
2. случайно выбрать split value между min/max;
3. разделить objects;
4. повторять;
5. считать depth, на котором object оказался изолирован.
```

Это не Decision Tree, обучаемое по Gini или target.

Здесь randomness — сам механизм обнаружения необычности.

---

## 5. Почему distant point изолируется быстро

Обычные points находятся в dense region.

Random split часто оставляет несколько соседей вместе.

Outlier далеко:

```text
normal cloud: 0..10
outlier: 100
```

случайный threshold между min/max имеет хорошие шансы быстро отделить 100.

Короткая average path length → более anomalous score.

---

## 6. Зачем forest

Один random tree слишком случаен.

Поэтому строится ensemble trees и усредняется isolation information.

Это знакомая идея:

```text
одна random structure шумная
→ forest стабилизирует score
```

Но цель здесь не supervised prediction.

---

## 7. `contamination`

Параметр contamination связан с threshold, который переводит continuous anomaly score в binary inlier/outlier labels.

Очень важно:

> contamination не «обучает model истинной доле anomalies» в магическом смысле.

Если вы задаёте expected outlier proportion, threshold адаптируется под это предположение.

Если реальная доля неизвестна, binary threshold требует отдельного business choice.

Во многих задачах полезнее сначала работать с ranking anomaly score.

---

## 8. Код Isolation Forest

```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    n_estimators=300,
    contamination="auto",
    random_state=42,
)

model.fit(X_train)

score = model.decision_function(X_valid)
pred = model.predict(X_valid)
```

В sklearn labels:

```text
+1 → inlier
-1 → outlier
```

Direction raw score нужно всегда проверять по API конкретного method: разные methods anomaly detection исторически используют разную sign convention.

---

# Часть II. Local Outlier Factor

## 9. Глобальная и локальная аномалия

Представим два normal clusters:

```text
cluster A — очень плотный
cluster B — редкий и растянутый
```

Point в B может выглядеть далеко от global dataset center, но быть абсолютно нормальной относительно neighbors B.

**Local Outlier Factor (LOF)** сравнивает локальную density объекта с density его соседей.

Вопрос:

> **насколько объект менее плотный, чем его local neighborhood?**

---

## 10. Density intuition

Если point окружена близкими neighbors:

```text
local density высокая
```

Если она далеко от neighbors:

```text
local density низкая
```

LOF сравнивает density point с densities ее k-nearest neighbors.

Если neighbors находятся в dense region, а point значительно более isolated, она становится local outlier.

---

## 11. Почему LOF может находить локальные anomalies

Представим большой sparse cluster и маленький dense cluster.

Простое global distance-from-center правило может считать весь маленький cluster аномальным.

LOF спрашивает:

> похожа ли density конкретной point на density ее local neighbors?

Поэтому может корректнее работать при неодинаковых локальных densities.

---

## 12. `n_neighbors`

Ключевой parameter LOF.

Маленький:

```text
очень локальный взгляд
→ score чувствителен к noise
```

Большой:

```text
более глобальный контекст
→ мелкие local anomalies могут исчезнуть
```

Scale neighborhood должен соответствовать structure задачи.

---

## 13. Scaling для LOF

LOF основан на nearest-neighbor distances.

Поэтому scaling почти обязательная тема, как у kNN.

Если один feature numeric range в тысячи раз больше другого, local density будет определяться units.

---

## 14. Очень важная особенность API LOF

В scikit-learn default:

```python
LocalOutlierFactor(novelty=False)
```

предназначен для outlier detection на training data.

Используется:

```python
fit_predict(X)
```

Если нужно применять detector к **новым unseen data**, устанавливают:

```python
novelty=True
```

И тогда `predict`, `decision_function`, `score_samples` нужно использовать именно на новых objects, а не на training data.

Это одна из тех API details, которые важно знать, иначе можно получить неправильную интерпретацию results.

---

## 15. Код LOF для outlier detection

```python
from sklearn.neighbors import LocalOutlierFactor

lof = LocalOutlierFactor(
    n_neighbors=20,
    contamination="auto",
)

labels = lof.fit_predict(X)
```

Для training samples доступен:

```python
lof.negative_outlier_factor_
```

Чем ниже value, тем более unusual object в convention sklearn.

---

## 16. Код LOF для novelty detection

```python
lof = LocalOutlierFactor(
    n_neighbors=20,
    novelty=True,
)

lof.fit(X_train_normal)

labels_new = lof.predict(X_new)
scores_new = lof.decision_function(X_new)
```

Не используйте novelty-mode `predict(X_train_normal)` как эквивалент обычного `fit_predict` — semantics отличаются.

---

# Часть III. One-Class SVM

## 17. Ещё один взгляд: граница normal region

One-Class SVM пытается описать region feature space, где лежат normal observations, отделяя его от origin / внешнего пространства в transformed feature space.

С RBF kernel может создавать nonlinear boundary.

Плюсы:

- flexible nonlinear shape.

Минусы:

- чувствительность к scaling;
- parameter tuning;
- хуже масштабируется на большие datasets, чем Isolation Forest.

Для большого tabular anomaly task Isolation Forest часто проще baseline, но One-Class SVM полезно знать как другой family approach.

---

## 18. Что считается anomaly score

Разные detectors дают разные scores.

Нельзя сравнивать абсолютные values:

```text
IsolationForest score = 0.1
LOF score = -2.3
```

как будто это probabilities.

Обычно:

> score — ranking unusualness/normality внутри конкретного method.

Чтобы получить calibrated probability anomaly, нужны labels и дополнительная calibration procedure.

---

## 19. Как оценивать без labels

Это главная проблема.

Если y нет, нельзя просто посчитать ROC-AUC.

Используют:

- ручную проверку top anomalies;
- known synthetic corruptions;
- temporal stability;
- domain constraints;
- downstream investigation yield;
- weak labels;
- delayed labels.

Например fraud team может оценить:

```text
precision among top 100 anomalies
```

после ручной разметки.

---

## 20. Если labels есть — используем ranking metrics

Если есть хотя бы evaluation labels, anomaly score можно сравнить через:

- ROC-AUC;
- AP/PR-AUC;
- precision@k;
- recall@k.

При rare anomalies AP/top-k часто особенно информативны.

Но model всё равно могла быть обучена unsupervised.

---

## 21. Anomaly detection и data quality

Очень полезное применение:

> не только fraud, но и поиск data pipeline problems.

Anomalies:

```text
age = 900
negative price
sensor jump
impossible category combination
```

Но простые deterministic validation rules часто лучше ML для явных нарушений.

ML detector нужен для сложных multivariate patterns.

---

## 22. Anomaly ≠ ошибка

Редкий object может быть:

- важным VIP клиентом;
- редкой, но легальной transaction;
- новым business segment;
- реальной аварией;
- data error.

Detector говорит:

> объект необычен по выбранному representation.

Business interpretation остаётся за человеком.

---

## 23. Drift как источник «аномалий»

Если production distribution изменилась, detector может внезапно начать помечать огромную долю objects.

Это может означать:

- incident;
- seasonality;
- system migration;
- real drift.

Поэтому anomaly rate itself полезно мониторить во времени.

Но model threshold, fit на старом distribution, может устареть.

---

## 24. Выбор features

Anomaly detector настолько хорош, насколько его representation.

Для transaction:

```text
amount
hour
country
merchant
```

raw amount может быть менее полезен, чем:

```text
amount / user_typical_amount
distance_from_home
time_since_previous_txn
```

Contextual feature engineering часто важнее выбора Isolation Forest vs LOF.

---

## 25. Isolation Forest vs LOF

| Аспект | Isolation Forest | LOF |
|---|---|---|
| Идея | Легко ли изолировать point random splits | Насколько local density ниже neighbors |
| Geometry | Tree partitions | Distances/neighborhood |
| Scaling | Trees менее чувствительны к monotonic scale | Очень важен |
| Большие данные | Обычно удобнее | Neighbor search дороже |
| Local anomalies | Иногда | Сильная сторона |
| New data | Естественный predict API | Нужен `novelty=True` |

---

## 26. Интерактивная визуализация DataPath

### Isolation Forest

Показать 2D cloud и outlier.

Кнопка:

```text
Random split
```

Считать path length для выбранных points.

Пользователь видит, что outlier часто изолируется за 2–3 splits.

### LOF

Для selected point показать `n_neighbors` и local density.

Slider `n_neighbors` меняет neighborhood и score.

### Outlier vs novelty

Два режима:

```text
detect anomalies in current dataset
score future unseen objects
```

Показать различие API LOF.

---

## 27. Типичные ошибки

**«Anomaly detector даёт вероятность мошенничества».**\
Нет.

**«Rare class = anomaly detection».**\
Не обязательно.

**«Contamination точно сообщает model реальную anomaly rate».**\
Это assumption/threshold control.

**«LOF predict работает одинаково на train и new data».**\
Нет, novelty mode имеет особую semantics.

**«Любой далёкий object ошибка».**\
Нет.

**«Scaling не нужен Isolation/LOF одинаково».**\
LOF сильно зависит от distance scaling; tree-based Isolation Forest работает иначе.

---

## 28. Проверка понимания

1. Outlier vs novelty detection?
2. Почему Isolation Forest anomalies имеют короткие paths?
3. Зачем forest случайных trees?
4. Что делает contamination?
5. Как LOF определяет local anomaly?
6. Почему `n_neighbors` важен?
7. Почему scaling критичен LOF?
8. Что означает `novelty=True`?
9. Почему anomaly score не probability?
10. Как оценивать detector без labels?

---

## 29. Мини-практика

Ситуации:

A. чистый training dataset normal sensor data, нужно ловить future failures.\
B. historical transactions с неизвестной смесью anomalies.\
C. два clusters разной density, anomalies локальны относительно каждого.

Выберите:

- outlier vs novelty mode;
- candidate detector;
- preprocessing;
- evaluation;
- threshold strategy.

---

## 30. Как объяснить на собеседовании

### Isolation Forest

**Коротко.**\
Ансамбль random isolation trees. Аномальные objects обычно легче отделяются random splits и имеют меньшую average path length.

### LOF

**Коротко.**\
Сравнивает local density объекта с density его k-nearest neighbors. Объект с существенно более низкой локальной density получает высокий anomaly factor.

### Outlier vs novelty

Outlier detection ищет anomalies внутри contaminated training dataset; novelty detection учится на normal training distribution и затем оценивает unseen objects.

---

## 31. Что нужно унести

1. Anomaly — понятие относительно representation и normal regime.
2. Outlier и novelty detection — разные scenarios.
3. Isolation Forest использует random isolation path length.
4. LOF сравнивает local densities.
5. LOF чувствителен к scaling и `n_neighbors`.
6. `novelty=True` меняет правильный способ использования LOF API.
7. Contamination участвует в thresholding, а не создаёт ground truth.
8. Anomaly score обычно не probability.
9. Evaluation без labels требует domain/operational checks.
10. Contextual feature engineering очень важно.
11. Rare supervised class не автоматически anomaly task.

## Куда дальше

Мы научились строить и использовать models. Теперь возникает другой вопрос:

> **Почему конкретная model сделала такой prediction и на какие признаки она реально опирается?**

Следующий урок — интерпретация модели, coefficients, impurity importance, permutation importance, PDP/ICE и SHAP.

## Источники
- scikit-learn User Guide — Novelty and Outlier Detection.
- scikit-learn IsolationForest and LocalOutlierFactor API.
