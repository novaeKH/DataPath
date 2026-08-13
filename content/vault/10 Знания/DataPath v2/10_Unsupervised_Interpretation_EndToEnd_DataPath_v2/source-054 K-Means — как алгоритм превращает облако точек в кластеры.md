---
title: "K-Means — как алгоритм превращает облако точек в кластеры"
id: concept.datapath-v2.054
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 54
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# K-Means: как алгоритм превращает облако точек в кластеры

До сих пор почти все модели в курсе получали target: цену, дефолт, отток, класс объекта. Теперь target исчезает.

Остаётся только матрица признаков:

\[
X\in \mathbb{R}^{n\times p}.
\]

Нужно понять:

> **Есть ли в данных внутренняя структура, которую можно обнаружить без правильных ответов?**

Один из самых известных методов — **K-Means**.

Его идея проста:

> найти \(K\) центров так, чтобы каждый объект был близок к своему центру, а суммарное расстояние внутри кластеров было как можно меньше.

Но за этой простотой скрываются важные вопросы:

- что значит «близко»;
- почему scaling критичен;
- почему число кластеров нужно задать заранее;
- почему разные initialization дают разные результаты;
- почему K-Means плохо видит вытянутые и неодинаковые по плотности кластеры;
- как оценивать clustering, если target отсутствует.

---

## 1. Что такое кластеризация

**Кластеризация (clustering)** пытается объединить похожие объекты в группы без известных label.

Пример клиентов:

```text
age
monthly_spend
purchase_frequency
```

В данных могут быть группы:

```text
редкие дешёвые покупки
частые средние покупки
редкие дорогие покупки
```

Алгоритм не знает названий сегментов. Он лишь находит структуру.

Важно:

> cluster не обязан совпадать с реальным бизнес-сегментом.

После clustering человек должен интерпретировать группы и проверить, полезны ли они.

---

## 2. Интуиция K-Means

Пусть есть точки на плоскости.

Мы выбираем:

```text
K = 2
```

и ставим два центра.

Дальше повторяем:

```text
1. назначить каждую точку ближайшему центру;
2. пересчитать каждый центр как среднее точек его группы;
3. снова назначить точки;
4. снова пересчитать центры;
5. повторять до стабилизации.
```

Центр называется **центроидом (centroid)**.

Название K-Means буквально отражает идею:

```text
K групп
→ центр каждой = mean
```

---

## 3. Один шаг руками

Точки:

```text
A = (1,1)
B = (2,1)
C = (8,8)
D = (9,8)
```

Пусть начальные центры:

```text
c1 = (1,1)
c2 = (9,8)
```

По Euclidean distance:

- A ближе к c1;
- B ближе к c1;
- C ближе к c2;
- D ближе к c2.

Теперь пересчитываем means.

Для первого cluster:

\[
c_1=
\left(
\frac{1+2}{2},
\frac{1+1}{2}
\right)
=
(1.5,1).
\]

Для второго:

\[
c_2=
\left(
\frac{8+9}{2},
\frac{8+8}{2}
\right)
=
(8.5,8).
\]

После update centers оказываются в середине своих групп.

---

## 4. Что K-Means минимизирует

Objective обычно называют **inertia** или within-cluster sum of squares:

\[
\sum_{i=1}^{n}
\|x_i-\mu_{c_i}\|^2.
\]

Где:

- \(x_i\) — объект;
- \(c_i\) — cluster объекта;
- \(\mu_{c_i}\) — centroid его cluster.

Алгоритм хочет:

> сделать сумму squared distances от объектов до собственных centroids как можно меньше.

Именно поэтому centroid — среднее: для squared Euclidean distance mean минимизирует сумму квадратов отклонений внутри группы.

---

## 5. Почему два этапа по очереди уменьшают objective

### Assignment step

Centers фиксированы.

Каждую точку отправляем к ближайшему centroid.

Это минимизирует её distance при данных centers.

### Update step

Назначение групп фиксировано.

Для каждой группы выбираем новый centroid как mean.

Mean минимизирует сумму squared distances внутри этой группы.

Поэтому каждый из двух steps не увеличивает objective.

Алгоритм постепенно сходится к стабильному решению.

Но не обязательно к глобальному optimum.

---

## 6. Почему initialization важна

Представим сложное облако точек.

Если начальные centroids поставлены неудачно, K-Means может сойтись к плохому local solution.

То есть одинаковые данные с разными initial centers способны дать разные cluster assignments.

Поэтому часто используют несколько запусков и выбирают решение с наименьшей inertia.

В scikit-learn параметр:

```text
n_init
```

управляет числом запусков для соответствующей initialization strategy.

В актуальной API `n_init="auto"` выбирает число запусков в зависимости от `init`.

---

## 7. K-Means++

Случайно поставить все initial centers рядом — плохая идея.

**k-means++** выбирает стартовые centroids более разумно: следующие centers с большей вероятностью выбираются далеко от уже выбранных.

Интуиция:

```text
не ставить все центры в одном месте
→ быстрее получить покрытие разных областей данных
→ обычно лучше convergence
```

В scikit-learn `init="k-means++"` является стандартным вариантом.

---

## 8. Почему scaling критичен

K-Means использует расстояния.

Features:

```text
age: 18–80
annual_income: 20 000–500 000
```

Без scaling Euclidean distance почти полностью определяется income.

Даже если age важен для сегментации, его вклад становится крошечным.

Поэтому для обычного K-Means на heterogeneous numerical features часто нужен `StandardScaler` или другой осмысленный scaling.

Правило:

> если algorithm использует distance, units features становятся частью модели.

---

## 9. Геометрическое предположение K-Means

K-Means естественно предпочитает clusters, которые:

- компактны;
- примерно сферичны в используемой metric;
- имеют похожий scale;
- отделены расстоянием.

Рассмотрим два полумесяца:

```text
))))   ((((
```

Человек видит две curved groups.

K-Means проводит Voronoi-like разделение вокруг centroids и может разрезать их неправильно.

Это не «плохая настройка». Геометрия метода не соответствует структуре данных.

---

## 10. Неодинаковая плотность и размер

Если один cluster:

```text
очень плотный и маленький
```

а второй:

```text
растянутый и большой
```

K-Means может предпочесть разделить большой cluster на две части и объединить маленький с соседним, потому что так уменьшается squared-distance objective.

Алгоритм не знает понятия «естественный cluster» вне своей objective.

---

## 11. Почему нужно заранее выбрать K

Параметр:

```text
n_clusters=K
```

задаётся заранее.

Это существенное ограничение.

Если реальная структура неизвестна, нужно сравнивать несколько K и использовать:

- domain knowledge;
- silhouette;
- inertia/elbow как heuristic;
- stability;
- downstream usefulness.

Не существует математического правила, которое всегда возвращает «истинное число кластеров».

---

## 12. Elbow method

Inertia всегда не увеличивается при росте K.

Почему?

При:

```text
K = n_samples
```

каждый объект может стать своим cluster, и inertia приблизится к нулю.

Поэтому нельзя выбирать K просто по минимальной inertia.

Elbow idea:

> искать участок, после которого увеличение K даёт уже небольшой дополнительный выигрыш.

Проблема: «локоть» часто размыт и субъективен.

Это heuristic, не строгий criterion.

---

## 13. Silhouette score

Для объекта сравнивается:

- насколько он близок к собственному cluster;
- насколько близок к ближайшему альтернативному cluster.

Silhouette близкий к 1 обычно означает хорошо отделённый object, около 0 — boundary, отрицательный — возможно, объект ближе к другому cluster.

Средний silhouette полезен для сравнения K, но тоже не является абсолютной истиной.

Он оценивает именно geometry выбранной distance metric.

---

## 14. Внешние метрики, если labels всё-таки известны

Иногда clustering используется на synthetic/benchmark data, где true labels доступны только для evaluation.

Тогда можно применять:

- Adjusted Rand Index;
- Adjusted Mutual Information;
- homogeneity/completeness.

Но если реальных labels нет, эти metrics недоступны — что нормально для unsupervised learning.

---

## 15. Что происходит внутри `fit()`

Концептуально:

```text
1. выбрать K initial centroids;
2. назначить objects ближайшим centroids;
3. пересчитать centroids как means;
4. повторять assignment/update;
5. остановиться при convergence / max_iter;
6. сохранить cluster_centers_;
7. сохранить labels_ для training data;
8. сохранить inertia_.
```

После `fit()`:

```python
model.cluster_centers_
model.labels_
model.inertia_
```

дают ключевую информацию.

---

## 16. `predict()` в K-Means

Для нового объекта K-Means может определить nearest learned centroid:

```text
new point
→ distance to all centroids
→ nearest cluster
```

Это не означает, что K-Means обучил probabilistic classifier.

Cluster ID:

```text
0, 1, 2
```

— просто labels групп.

Номер 2 не «больше» номера 1.

---

## 17. Реальный pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

model = Pipeline([
    ("scale", StandardScaler()),
    ("cluster", KMeans(
        n_clusters=4,
        init="k-means++",
        random_state=42,
    )),
])

labels = model.fit_predict(X)
```

Если scaling должен быть частью reproducible process, его нельзя делать вручную только в notebook и потом забыть при inference.

---

## 18. Интерпретация clusters

После `labels` работа не заканчивается.

Создаём profile:

```text
cluster 0:
mean age
median income
purchase frequency
retention

cluster 1:
...
```

Только после этого можно дать business names:

```text
"редкие дорогие покупатели"
"частые бюджетные"
```

Названия не должны исходить из cluster index.

---

## 19. Clustering не доказывает существование реальных типов людей

Очень опасная ошибка:

> algorithm нашёл 4 cluster → существует 4 объективных типа клиентов.

K-Means **обязан** создать K групп, даже если данные представляют одно непрерывное облако.

Поэтому clusters нужно проверять на:

- stability;
- separation;
- business usefulness;
- repeatability во времени;
- downstream effect.

---

## 20. Высокая размерность

В high-dimensional space distances могут становиться менее различимыми — проявления curse of dimensionality.

Кроме того, noisy dimensions добавляют вклад в Euclidean distance.

Возможные стратегии:

- feature selection;
- domain transformations;
- PCA;
- другой similarity measure;
- специализированные clustering methods.

Следующий блок про PCA покажет один путь уменьшения dimensionality.

---

## 21. MiniBatchKMeans

Для очень больших datasets полный K-Means может быть дорогим.

`MiniBatchKMeans` обновляет centers по небольшим batches и обычно быстрее на больших объёмах, ценой приближённого решения.

Полезный mental model:

```text
KMeans → использует весь dataset на iterations
MiniBatchKMeans → делает approximate updates по mini-batches
```

---

## 22. Интерактивная визуализация DataPath

### Режим 1. Assignment / Update

2D points и 3 centroids.

Кнопки:

```text
Назначить точки
Пересчитать центры
```

Пользователь вручную проходит 3–4 iterations.

### Режим 2. Bad initialization

Поставить centers рядом и показать poor local solution.

Затем включить k-means++.

### Режим 3. Scaling

Один feature растянуть в 100 раз и показать резкую смену clusters.

### Режим 4. Wrong geometry

Переключить data:

```text
blobs
moons
different densities
```

Показать, где K-Means работает естественно, а где objective не соответствует форме.

---

## 23. Типичные ошибки

**«K-Means сам определяет K».**\
Нет.

**«Cluster 2 больше cluster 1».**\
Нет, labels условные.

**«Минимальная inertia определяет лучший K».**\
Нет: inertia падает с ростом K.

**«Scaling не нужен, это unsupervised model».**\
Нужен, потому что distance зависит от units.

**«Clusters доказывают реальные сегменты».**\
Нет.

**«K-Means находит global optimum».**\
Не гарантируется.

**«Любая форма clusters подходит».**\
Нет, algorithm имеет geometry assumptions.

---

## 24. Проверка понимания

1. Что минимизирует K-Means?
2. Почему centroid — mean?
3. Почему initialization влияет на solution?
4. Что делает k-means++?
5. Почему scaling критичен?
6. Почему inertia нельзя просто минимизировать по K?
7. Что показывает silhouette?
8. Почему moons — плохой пример для K-Means?
9. Что означает cluster label `2`?
10. Зачем profiling после clustering?

---

## 25. Мини-практика

Есть customer features:

```text
annual_spend
order_count
days_since_last_order
age
```

Ответьте:

1. что scale;
2. как попробовать K=2..8;
3. какие metrics использовать без labels;
4. как проверить stability;
5. как интерпретировать clusters;
6. что делать, если clusters меняются полностью при небольшом изменении sample.

---

## 26. Как объяснить на собеседовании

### Что такое K-Means?

**Коротко.**\
Алгоритм кластеризации, который задаёт K centroids и поочерёдно назначает объекты ближайшему centroid и пересчитывает centroids как means, минимизируя within-cluster sum of squared distances.

### Главные ограничения?

Нужно заранее K, algorithm зависит от scale и initialization и лучше работает с компактными roughly spherical clusters похожего масштаба.

---

## 27. Что нужно унести

1. K-Means — unsupervised clustering.
2. Objective — сумма squared distances до centroids.
3. Assignment и centroid update поочерёдно уменьшают objective.
4. Initialization важна.
5. k-means++ улучшает старт.
6. Scaling критичен для distance geometry.
7. K задаётся заранее.
8. Inertia падает при увеличении K.
9. Silhouette помогает, но не даёт абсолютной истины.
10. K-Means плохо видит non-convex shapes и разные densities.
11. Cluster index не имеет ordinal смысла.
12. Business interpretation делается после clustering.

## Куда дальше

Если cluster имеет сложную форму или мы хотим автоматически выделять noise, K-Means может быть неправильным инструментом.

Следующий урок: **DBSCAN и иерархическая кластеризация** — два совершенно других взгляда на понятие cluster.

## Источники
- scikit-learn User Guide — K-means.
- scikit-learn KMeans API and clustering evaluation examples.
