---
title: "14. Trees, BFS и DFS"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.14-trees-bfs-i-dfs
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 14. Trees, BFS и DFS

[[13_Recursion_Backtracking|← Предыдущий]] · [[15_Matrix_и_Grid|Следующий →]]

## 1. Цель урока

Выбирать DFS для поддеревьев/глубины и BFS для уровней/минимума рёбер.

## 2. Главная идея

DFS завершает одну ветвь, BFS обрабатывает слой за слоем.

## 3. Как распознать

Дерево, глубина, одинаковые структуры, инверсия → DFS. Уровни, ближайший узел, минимум шагов → BFS.

## 4. Когда не подходит

У дерева без циклов visited не обязателен; у общего графа обязателен. BFS может использовать много памяти на широком уровне.

## 5. Необходимый Python

Recursion/stack для DFS, `deque` для BFS, `None`, type hints.

## 6. Универсальные шаблоны

```python
def dfs(node: TreeNode | None) -> None:
    if node is None:
        return
    dfs(node.left)
    dfs(node.right)
```

```python
queue = deque([root])
while queue:
    level_size = len(queue)
    for _ in range(level_size):
        node = queue.popleft()
```

## 7. Первая задача: LC 104 Maximum Depth

```python
def max_depth(root: "TreeNode | None") -> int:
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

Инвариант рекурсии: вызов возвращает корректную глубину своего поддерева.

## 8. Вторая задача: LC 102

BFS: в начале уровня `len(queue)` — число узлов текущего уровня. Собрать ровно их, детей оставить следующему уровню.

## 9. Третья задача без решения

LC 226: [[10_Trees_и_Grid_задачи#LC 226 — Invert Binary Tree]]. Нужно ли создавать новые узлы?

## 10. Трассировка BFS

| queue до уровня | output | queue после |
|---|---|---|
| `[3]` | `[3]` | `[9,20]` |
| `[9,20]` | `[9,20]` | `[15,7]` |

## 11. Инвариант

DFS-вызов решает поддерево. BFS-queue в начале внешней итерации содержит текущий уровень.

## 12. Сложность

O(n) время. DFS память O(h), BFS O(w), где h — высота, w — максимальная ширина.

## 13. Типичные ошибки

Нет base case; добавить `None` и читать атрибут; путать height в узлах/рёбрах; queue через list; не зафиксировать level_size; забыть visited в графе; рекурсия на очень глубоком дереве.

## 14. Что сказать интервьюеру

> DFS естественно сводит ответ узла к ответам детей. Для уровней использую BFS и фиксирую размер queue в начале слоя. Каждый узел посещается один раз: O(n); память O(h) для DFS или O(w) для BFS.

## 15. Мини-контрольная

Глубина пустого дерева? BFS-структура? DFS memory? Когда visited? Почему level_size фиксирован?

<details><summary>Ответы</summary>
0; deque; O(h); общий граф/возможные циклы; дети относятся к следующему уровню.
</details>

## 16. Практика

Обязательные: 104, 100, 226, 102. Дополнительные grid-задачи — следующий урок.

## 17. Шпаргалка

DFS: solve children. BFS: queue by level. O(n), memory height/width.

## Где это встречается в Data Science

Иерархии признаков, деревья решений как структуры, обход зависимостей и графов. Это не реализация sklearn tree, а переносимый навык обхода.
