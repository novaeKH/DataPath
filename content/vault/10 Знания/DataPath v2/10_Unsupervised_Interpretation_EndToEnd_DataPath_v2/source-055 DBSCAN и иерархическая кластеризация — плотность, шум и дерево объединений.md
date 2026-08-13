---
title: "DBSCAN и иерархическая кластеризация — плотность, шум и дерево объединений"
id: concept.datapath-v2.055
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 55
canonical_course: "Классическое машинное обучение"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# DBSCAN и иерархическая кластеризация

K-Means определяет cluster через расстояние до centroid. Это удобно для компактных blob-like groups, но не для любой geometry.

Представим два полумесяца. У каждого нет одного естественного centroid, вокруг которого cluster образует круг.

Или представим данные:

```text
плотное облако
+ несколько одиночных точек далеко
```

K-Means обязан присвоить **каждый объект** одному из K clusters. Он не умеет сказать:

> «эта точка вообще не относится ни к одной группе».

DBSCAN смотрит на данные по-другому:

> cluster — это область высокой плотности, связанная цепочкой соседних плотных областей.

А иерархическая кластеризация (hierarchical clustering) задаёт третий вопрос:

> как объекты постепенно объединяются от отдельных точек до одной большой группы?

---

# Часть I. DBSCAN

## 1. Два параметра

DBSCAN опирается прежде всего на:

```text
eps
min_samples
```

**`eps`** — радиус neighborhood.

**`min_samples`** — сколько samples должно быть в neighborhood, чтобы point считалась core point.

В актуальной scikit-learn definition `min_samples` включает саму точку.

---

## 2. Core, border и noise

### Core point

В радиусе `eps` достаточно points.

### Border point

Сама не имеет достаточной плотности, но находится рядом с core point.

### Noise

Не подключается к плотной структуре.

В scikit-learn noisy samples получают label:

```text
-1
```

Это принципиальное отличие от K-Means: algorithm имеет право не назначить объект cluster.

---

## 3. Как растёт cluster

Представим core point A.

Находим все objects в её `eps` neighborhood.

Если сосед B тоже core, из B можно расширять cluster дальше.

Так получается **density-connected** region.

Важно:

> точки cluster не обязаны все быть близки к одному centroid.

Они могут образовывать изогнутую цепочку, если плотность сохраняется локально.

Именно поэтому DBSCAN способен находить non-convex shapes.

---

## 4. Маленький пример

Пусть points идут вдоль дуги.

Каждая имеет 4–5 соседей на небольшом расстоянии.

Хотя крайние points дуги далеко друг от друга, между ними существует цепочка dense neighborhoods.

DBSCAN объединит их в один cluster.

K-Means, наоборот, может разрезать дугу прямой Voronoi boundary.

---

## 5. Что делает `eps`

Маленький `eps`:

```text
neighborhood узкий
→ многие points не имеют min_samples
→ много noise / много мелких clusters
```

Большой `eps`:

```text
neighborhood широкий
→ разные группы могут соединиться
→ clusters сливаются
```

`eps` задаёт масштаб понятия «локальный сосед».

---

## 6. Что делает `min_samples`

Больше `min_samples`:

```text
чтобы стать core, нужна более высокая плотность
→ clustering строже
```

Меньше:

```text
даже небольшие локальные groups могут стать cluster
```

`eps` и `min_samples` связаны: один и тот же `eps` имеет разный смысл при разных требованиях к density.

---

## 7. Scaling снова критичен

DBSCAN использует distances.

Если один feature в тысячах, другой в единицах, geometry neighborhood искажается.

Поэтому scaling/features selection критичны.

Неудачный feature может полностью изменить плотность.

---

## 8. Проблема неодинаковой плотности

Классический DBSCAN использует глобальные `eps` и `min_samples`.

Если один cluster очень плотный, другой сильно разреженный, один `eps` может не подойти обоим.

Маленький `eps` разрушает sparse cluster.

Большой объединяет dense cluster с noise.

Для varying-density задач существуют методы вроде OPTICS и HDBSCAN.

---

## 9. DBSCAN не требует K

Это большой плюс.

Количество clusters возникает из плотности данных.

Но цена:

> вместо K теперь нужно определить meaningful density scale.

То есть parameter-choice problem не исчезла — она изменилась.

---

## 10. Пример scikit-learn

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN

model = Pipeline([
    ("scale", StandardScaler()),
    ("cluster", DBSCAN(
        eps=0.5,
        min_samples=5,
    )),
])

labels = model.fit_predict(X)
```

После `DBSCAN`:

```python
labels
```

содержит cluster IDs и `-1` для noise.

---

## 11. DBSCAN и prediction новых объектов

Классический DBSCAN в scikit-learn не устроен как обычный classifier с естественным `predict(new_X)`.

Он прежде всего выполняет clustering набора данных.

Это важно для production use case:

> если задача требует постоянно присваивать новым клиентам cluster label, K-Means operationally проще.

DBSCAN чаще используют для structure discovery / anomaly-like segmentation dataset.

---

# Часть II. Иерархическая кластеризация

## 12. Идея hierarchy

В **агломеративной кластеризации (Agglomerative Clustering)** каждый object сначала отдельный cluster.

Затем:

```text
самые близкие clusters объединяются
→ снова ищем ближайшие
→ объединяем
→ ...
→ пока не получим нужную структуру
```

Так строится hierarchy:

```text
8 clusters
→ 7
→ 6
→ ...
→ 2
→ 1
```

Вместо одного flat partition появляется дерево объединений.

---

## 13. Dendrogram mental model

**Дендрограмма (dendrogram)** показывает, на каком distance/criterion clusters объединяются.

Низкое объединение:

```text
объекты очень похожи
```

Высокое:

```text
группы были сильно различны
```

Если «разрезать» dendrogram на определённой высоте, получаем flat clusters.

Это позволяет исследовать несколько scales структуры без полного повторного обучения для каждого K в классическом hierarchical analysis.

---

## 14. Что значит расстояние между clusters

Между двумя clusters много pairs points. Как определить distance групп?

Это задаёт **linkage**.

### Single linkage

Минимальная distance между pair points.

Плюс: может находить вытянутые shapes.

Минус: chaining — clusters легко соединяются тонкой цепочкой.

### Complete linkage

Максимальная pairwise distance.

Предпочитает compact clusters.

### Average linkage

Средняя distance между pairs.

Компромисс между single и complete.

### Ward linkage

Объединяет clusters так, чтобы минимизировать рост within-cluster variance.

Ward естественно связан с Euclidean geometry и часто создаёт compact groups.

---

## 15. Ward и K-Means — похожая цель, разный процесс

K-Means:

```text
задаём K
→ iterative reassignment + centroid update
```

Ward hierarchical:

```text
начинаем с отдельных clusters
→ greedily объединяем пары,
которые минимально увеличивают within-cluster variance
```

Оба предпочитают compact structures, но algorithmic process совершенно разный.

---

## 16. Connectivity constraints

В spatial data может быть известно, какие objects вообще могут быть neighbors.

Например pixels image или regions карты.

Agglomerative clustering в scikit-learn умеет использовать connectivity graph и разрешать merges только между connected groups.

Это полезно для structured data.

---

## 17. Как выбрать между K-Means, DBSCAN и hierarchical

### K-Means

Когда:

- clusters compact;
- нужен fast assignment новых objects;
- K примерно известно;
- данных много.

### DBSCAN

Когда:

- clusters имеют irregular shapes;
- нужен noise label;
- meaningful density scale;
- K неизвестно.

### Hierarchical

Когда:

- важна nested structure;
- хотим dendrogram-like interpretation;
- dataset не огромный;
- полезно исследовать levels группировки.

---

## 18. Оценка clustering

Без labels можно использовать:

- silhouette;
- Davies–Bouldin;
- Calinski–Harabasz;
- stability;
- domain usefulness.

Но каждая internal metric предпочитает определённую geometry.

Silhouette, основанный на distances, может быть не идеален для всех density structures.

Поэтому unsupervised evaluation почти всегда требует qualitative/domain analysis.

---

## 19. Почему cluster labels нельзя сравнивать напрямую

Один запуск:

```text
cluster 0 = premium
cluster 1 = budget
```

Другой:

```text
cluster 0 = budget
cluster 1 = premium
```

Это одно и то же partition с переставленными label IDs.

Поэтому accuracy между raw cluster IDs бессмысленна без label matching.

External clustering metrics вроде ARI учитывают такую permutation invariance.

---

## 20. Интерактивная визуализация DataPath

### DBSCAN

Пользователь меняет `eps`.

Для каждой point показывать circle radius.

Цвет:

- core;
- border;
- noise.

При увеличении `eps` clusters соединяются.

### Hierarchical

Показывать:

```text
points
+
dendrogram
```

Каждый merge одновременно подсвечивать на плоскости и дереве.

Переключатель linkage:

```text
single
complete
average
ward
```

Пользователь должен увидеть chaining у single linkage.

---

## 21. Типичные ошибки

**«DBSCAN автоматически находит идеальное число clusters».**\
Нет, результат зависит от density parameters.

**«`eps` — число clusters».**\
Нет, это neighborhood radius.

**«Noise = ошибочные строки».**\
Не обязательно. Это объекты вне density clusters в выбранной geometry.

**«DBSCAN удобен для predict новых objects так же, как K-Means».**\
Не в стандартном scikit-learn API.

**«Hierarchical clustering всегда лучше, потому что даёт дерево».**\
Нет.

**«Single linkage устойчив к noise».**\
Наоборот, chaining может быть сильной проблемой.

---

## 22. Проверка понимания

1. Core vs border vs noise?
2. Что делает `eps`?
3. Что делает `min_samples`?
4. Почему DBSCAN видит moons?
5. Почему varying density сложна?
6. Что означает label `-1`?
7. Что строит agglomerative clustering?
8. Чем single linkage отличается от complete?
9. Что минимизирует Ward?
10. Когда K-Means operationally удобнее DBSCAN?

---

## 23. Мини-практика

Три datasets:

A. компактные круглые группы, нужен online assignment новых клиентов.\
B. две curved полосы + noise.\
C. биологические samples, хотим изучать hierarchy похожести.

Выберите method для каждого и объясните:

- preprocessing;
- hyperparameters;
- evaluation;
- failure modes.

---

## 24. Что нужно унести

1. DBSCAN определяет clusters через локальную density connectivity.
2. `eps` задаёт radius neighborhood.
3. `min_samples` задаёт требование к плотности core point.
4. Noise имеет label -1 в scikit-learn.
5. DBSCAN умеет non-convex shapes и не требует K.
6. Он испытывает трудности с varying densities.
7. Hierarchical clustering строит nested tree merges.
8. Linkage определяет distance между clusters.
9. Single/complete/average/Ward дают разную geometry.
10. Clustering evaluation без labels требует нескольких сигналов и domain interpretation.

## Куда дальше

Clustering работает в исходном feature space. Но что делать, если features 100, 1000 или 10 000 и многие из них коррелированы?

Следующий урок — **метод главных компонент (PCA)**: как найти новые оси, которые сохраняют максимум variance и позволяют уменьшить dimensionality.

## Источники
- scikit-learn User Guide — DBSCAN and hierarchical clustering.
- scikit-learn DBSCAN API / clustering examples.
