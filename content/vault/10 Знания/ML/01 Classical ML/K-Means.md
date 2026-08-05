---
title: K-Means
id: concept.ml.k-means
type: concept
area: ml
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- K-means clustering
- Метод k средних
tags:
- ml/classical
- ml/clustering
math_depth: 2
---

# K-Means

## Что решает K-Means

K-Means делит numerical points на $K$ групп так, чтобы объекты были близки к centroid своей группы. Он не знает бизнес-смысл и target: мы сами задаём features, scaling и число clusters.

## Objective

$$
J=\sum_{i=1}^{n}\lVert x_i-\mu_{c_i}\rVert_2^2.
$$

$c_i$ — cluster объекта, $\mu_k$ — mean points кластера. Objective называется inertia/within-cluster sum of squares.

## Lloyd algorithm

1. Инициализировать $K$ centroids.
2. Назначить каждый point ближайшему centroid.
3. Пересчитать centroid как mean assigned points.
4. Повторять до stability.

Assignment:

$$
c_i=\arg\min_k\lVert x_i-\mu_k\rVert^2.
$$

Update:

$$
\mu_k=\frac{1}{|C_k|}\sum_{i:c_i=k}x_i.
$$

Каждый шаг не увеличивает objective, но convergence идёт к local optimum.

## Числовой пример

Points на линии: `1, 2, 3, 10, 11, 12`, $K=2$.

После разумной initialization первый centroid окажется около `2`, второй около `11`. Assignment стабилен, means равны центрам двух compact groups.

Если добавить outlier `100`, второй centroid сильно сместится, потому что mean чувствителен к outliers.

## Initialization

K-Means++ выбирает новые centers с большей probability для далёких points. Запускают несколько initializations и оставляют solution с меньшей inertia.

## Scaling и representation

Distance зависит от units. Standardization часто обязательна, но equal scaling не всегда отражает domain importance. Category codes не подходят: разница между кодами не является distance.

## Geometry assumptions

Метод лучше работает для clusters:

- compact;
- convex/spherical;
- похожего size и density;
- разделимых Euclidean distance.

Он плохо описывает moons, nested rings, varying density и сильные outliers.

## Как выбрать K

- elbow inertia;
- silhouette;
- stability по samples/seeds;
- domain interpretability;
- downstream utility;
- минимальный support.

Inertia всегда уменьшается при росте K, поэтому просто минимум бессмысленен.

## Оценка без labels

Internal metrics измеряют geometry, которую метод уже оптимизирует. Хороший silhouette не гарантирует полезные бизнес-сегменты. Нужны profiling, stability и external outcome, не использованный для создания clusters.

## Prediction новых points

Новый объект относится к ближайшему centroid. Cluster IDs не имеют порядка и могут переставиться между runs. Для использования сохраняйте fitted pipeline и отдельное mapping semantics.

## Когда использовать

- кластеризация «шарообразных» групп примерно равного размера;
- большое число объектов, нужен быстрый и масштабируемый алгоритм;
- сегментация клиентов, сжатие представления (кодбуки), предобработка;
- НЕ использовать при кластерах сложной формы, разном размере/плотности, наличии шума — тогда DBSCAN/hierarchical.

## Визуализация

Компонент `kmeans-canvas`:

- добавление/перемещение points;
- выбор K;
- step-by-step assignment/update;
- K-Means++ vs random;
- scaling toggle;
- outlier;
- inertia и silhouette.

## sklearn пример

```python
from sklearn.cluster import KMeans
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

pipeline = Pipeline([
    ("scale", StandardScaler()),
    ("cluster", KMeans(n_clusters=4, n_init="auto", random_state=42)),
])
```

## Ответ для собеседования

> K-Means минимизирует сумму квадратов расстояний до центроидов (inertia) итеративным Lloyd-алгоритмом: назначение точек ближайшему центру, затем пересчёт центров. K задаётся заранее (elbow/silhouette), результат чувствителен к инициализации и масштабу признаков. Ограничение — геометрическое предположение о форме кластеров.

## Частые ошибки

- не scaling;
- интерпретировать ID как ordinal;
- выбирать K по красивому 2D PCA plot;
- давать clusters человеческие labels без profiling;
- оценивать stability на тех же объектах одним seed;
- игнорировать outliers;
- включать post-outcome features.

## Сравнение с DBSCAN и hierarchical

| | K-Means | DBSCAN | Hierarchical |
|---|---|---|---|
| Форма кластеров | сферическая | произвольная | произвольная |
| Число кластеров | задаётся | из eps | из дендрограммы |
| Шум | нет | есть | нет |
| Масштаб | большой | средний | малый/средний |

Если кластеры плотные и «шарообразные» — K-Means быстр и прост; если есть шум и сложные формы — DBSCAN; если нужна иерархия — hierarchical.

## Связи

- [[DBSCAN and Hierarchical Clustering]]
- [[Principal Component Analysis]]
- [[EDA Relationships Time and Groups]]
- [[Data Preprocessing and Feature Engineering]]
