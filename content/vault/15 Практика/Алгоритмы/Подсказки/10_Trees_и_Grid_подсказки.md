---
title: "Trees и Grid — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.trees-i-grid-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Trees и Grid — подсказки

[[10_Trees_и_Grid_задачи|← Условия]] · [[10_Trees_и_Grid_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 104 | Ответ узла зависит от детей | recursion | None→0; 1+max(left,right) |
| 100 | Сравнивайте пары узлов | recursion | оба None true; один/value differ false; recurse children |
| 226 | Одинаковая операция в каждом узле | DFS | Swap children, рекурсивно invert |
| 102 | Обрабатывайте слоями | deque | На каждом outer loop фиксировать level_size |
| 200 | Новый остров = новый обход | grid DFS/BFS | При каждой неvisited земле count++, затопить компоненту |
| 733 | Обход только исходного цвета | DFS/BFS | Early return при same color; recolor on discovery |
| 994 | Все rotten стартуют одновременно | multi-source deque + fresh count | BFS слоями, уменьшать fresh; если останется — -1 |
