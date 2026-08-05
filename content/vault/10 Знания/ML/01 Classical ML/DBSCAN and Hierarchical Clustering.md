---
title: DBSCAN and Hierarchical Clustering
id: concept.ml.dbscan-hierarchical-clustering
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
- DBSCAN
- Иерархическая кластеризация
tags:
- ml/clustering
math_depth: 1
---

# DBSCAN and Hierarchical Clustering

## Зачем альтернативы K-Means

K-Means предпочитает spherical clusters и требует K. DBSCAN ищет dense regions и noise, hierarchical clustering строит дерево вложенных объединений.

## DBSCAN

Parameters:

- `eps` — radius neighborhood;
- `min_samples` — минимальное число points для dense core.

Типы points:

- core — достаточно neighbours;
- border — рядом с core, но сам не core;
- noise — не принадлежит dense component.

Плюсы:

- не требует K;
- arbitrary shapes;
- отмечает noise.

Минусы:

- один `eps` плохо работает при varying density;
- sensitivity к scaling;
- high dimensions разрушают distance;
- нет простого universal `predict` для new points.

## Hierarchical clustering

Agglomerative approach:

1. каждый point — cluster;
2. объединить ближайшие clusters;
3. повторять до одного дерева.

Linkage:

- single — minimum pair distance, может chaining;
- complete — maximum distance, compact clusters;
- average — average pair distance;
- Ward — минимизирует increase within-cluster squared error, требует Euclidean.

Dendrogram показывает merge distances. Cut задаёт final clusters.

## Scaling и distance

Обе модели полностью зависят от representation. Standardization, feature weights и metric являются частью постановки.

## Оценка

Используйте:

- stability;
- silhouette с осторожностью;
- domain meaning;
- support;
- downstream utility;
- inspection noise.

## Небольшой пример DBSCAN

Представьте точки клиентов на плоскости после scaling двух признаков. Пусть `eps=0.4`, `min_samples=4`.

- если вокруг точки в радиусе 0.4 есть минимум четыре точки вместе с ней, это core point;
- сосед core point может расширить cluster;
- point с недостаточным числом neighbours, но рядом с core, становится border;
- isolated point становится noise и получает label `-1`.

DBSCAN не начинает с заданного количества clusters. Число clusters возникает из связных dense regions. Если увеличить `eps`, отдельные regions могут слиться. Если уменьшить — многие точки станут noise.

## Как подбирать eps

Один из ориентиров — k-distance plot: для каждой точки посчитать расстояние до k-го соседа, отсортировать эти расстояния и искать область резкого роста. Это не автоматический правильный ответ, а диагностический график. Значение `min_samples` зависит от dimensionality, noise и domain.

## Как читать dendrogram

Высота merge показывает distance или increase objective, при котором объединились clusters. Горизонтальный cut задаёт final partition. Большой вертикальный gap между merges может указывать на естественный уровень разделения, но решение всё равно проверяется по смыслу и stability.

Пример: четыре объекта A, B, C, D. Сначала A объединяется с B на distance 0.2, C с D на 0.3, а две пары — только на 2.5. Cut на высоте 1.0 даёт два clusters.

## Когда выбирать метод

- DBSCAN: irregular shapes, явный noise, умеренная dimensionality.
- Hierarchical: небольшие datasets, нужна hierarchy и dendrogram.
- K-Means: compact clusters, нужна быстрая assignment новых points.

Перед clustering полезно попробовать несколько reasonable representations, а не бесконечно крутить один `eps`.

## Мини-проверка

После StandardScaler DBSCAN помечает 70% объектов noise. Это не доказательство, что данных «плохие». Возможны слишком маленький `eps`, varying density, неподходящая metric или отсутствие cluster structure.

## Ответ для собеседования

> DBSCAN группирует точки по плотности: ядровые точки (≥ min_samples соседей в eps-окрестности) образуют кластеры, граничные присоединяются, остальные — шум. Не требует задания числа кластеров, находит кластеры произвольной формы и устойчив к outliers; главный параметр — eps. Hierarchical clustering строит дендрограмму агломеративной склейкой и позволяет выбрать число кластеров постфактум, но дороже по памяти и хуже масштабируется.

## Визуализация

Компонент `density-hierarchy-clustering-lab`:

- moons/blobs/varying density;
- eps/min_samples;
- core/border/noise;
- linkage selector;
- live dendrogram;
- compare K-Means.

## Частые ошибки

- DBSCAN без scaling;
- считать noise ошибками;
- выбирать eps по test outcome;
- single linkage на noisy data;
- интерпретировать dendrogram как ground truth;
- clustering user-level и row-level одновременно.

## Связи

- [[K-Means]]
- [[Anomaly Detection]]
- [[Principal Component Analysis]]
