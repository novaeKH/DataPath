---
title: "16. Graph basics"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.16-graph-basics
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
visual: true
---
# 16. Graph basics

[[15_Matrix_и_Grid|← Предыдущий]] · [[17_Greedy|Следующий →]]

## 1. Цель урока

Строить adjacency list и обходить граф без повторов.

## 2. Главная идея

Graph = вершины + рёбра. Adjacency list хранит `vertex → neighbors`.

## 3. Как распознать

Связи, зависимости, маршруты, компоненты, достижимость.

## 4. Когда не подходит

Для weighted shortest path нужен не обычный BFS. Для дерева можно обходиться без visited при известном parent.

## 5. Необходимый Python

`dict[int, list[int]]`, `defaultdict(list)`, set visited, stack/deque.

## 6. Универсальный шаблон BFS

```python
from collections import deque

visited = {start}
queue = deque([start])
while queue:
    node = queue.popleft()
    for neighbor in graph.get(node, []):
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
```

## 7. Первая задача: достижимость

Вернуть `target in visited` после BFS/раннего обнаружения. O(V+E).

## 8. Вторая задача: число компонент

Пройти по всем вершинам; для каждой непосещённой запустить обход и увеличить ответ.

## 9. Третья задача без решения

Постройте неориентированный adjacency list из списка пар. Почему каждое ребро добавляется дважды?

## 10. Трассировка

Graph `{0:[1,2],1:[0],2:[0]}`: queue `[0]` → `[1,2]` → `[2]` → `[]`.

## 11. Инвариант

Visited содержит вершины, уже обнаруженные и поставленные в обработку; одна вершина не попадает в queue повторно.

## 12. Сложность

O(V+E) время, O(V+E) хранение graph, O(V) visited/queue.

## 13. Типичные ошибки

Mark after dequeue; забыть isolated vertices; одно направление для undirected edge; рекурсия на глубоком графе; путать BFS и weighted shortest; mutable default adjacency.

## 14. Что сказать интервьюеру

> Храню граф списком смежности. Отмечаю вершину visited при добавлении в queue, поэтому каждая вершина и каждое ребро рассматриваются ограниченное число раз: O(V+E).

## 15. Мини-контрольная

Adjacency list memory? Когда mark? Undirected edge? BFS гарантирует что? Нужен ли visited?

<details><summary>Ответы</summary>
O(V+E); enqueue; в обе стороны; минимум рёбер в невзвешенном графе; при циклах да.
</details>

## 16. Практика

Обязательные grid-графы: 200, 733. Дополнительная: локальная достижимость. Повтор: компоненты.

## 17. Шпаргалка

Build adjacency → visited on discovery → BFS/DFS → O(V+E).

## Где это встречается в Data Science

Графы пользователей/товаров, зависимости pipeline, connected components. Для больших графов нужны специализированные системы.
