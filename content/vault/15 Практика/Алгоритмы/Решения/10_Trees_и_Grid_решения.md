---
title: "Trees и Grid — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.trees-i-grid-resheniia
schema_version: 2
language: ru
app: exclude
---
# Trees и Grid — решения

[[10_Trees_и_Grid_подсказки|← Подсказки]] · [[11_Greedy_DP_решения|Следующий блок →]]

```python
class TreeNode:
    def __init__(self, val: int, left: "TreeNode | None" = None, right: "TreeNode | None" = None) -> None:
        self.val, self.left, self.right = val, left, right
```

## LC 104 — Maximum Depth

```python
def max_depth(root: TreeNode | None) -> int:
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
```

O(n) время, O(h) stack. Контракт рекурсии: вернуть глубину своего поддерева.

## LC 100 — Same Tree

```python
def is_same_tree(p: TreeNode | None, q: TreeNode | None) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None or p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)
```

O(n), O(h). Short-circuit прекращает сравнение после расхождения.

## LC 226 — Invert Binary Tree

```python
def invert_tree(root: TreeNode | None) -> TreeNode | None:
    if root is None:
        return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
```

O(n), O(h), меняет дерево. Если вход менять нельзя, создайте новые узлы — O(n) дополнительной памяти.

## LC 102 — Level Order Traversal

```python
from collections import deque

def level_order(root: TreeNode | None) -> list[list[int]]:
    if root is None:
        return []
    result: list[list[int]] = []
    queue = deque([root])
    while queue:
        level: list[int] = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left is not None:
                queue.append(node.left)
            if node.right is not None:
                queue.append(node.right)
        result.append(level)
    return result
```

O(n), O(w). `range(len(queue))` фиксирует текущий уровень до добавления детей.

## LC 200 — Number of Islands

```python
def num_islands(grid: list[list[str]]) -> int:
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])

    def flood(row: int, col: int) -> None:
        if not (0 <= row < rows and 0 <= col < cols) or grid[row][col] != "1":
            return
        grid[row][col] = "0"
        flood(row + 1, col)
        flood(row - 1, col)
        flood(row, col + 1)
        flood(row, col - 1)

    islands = 0
    for row in range(rows):
        for col in range(cols):
            if grid[row][col] == "1":
                islands += 1
                flood(row, col)
    return islands
```

O(RC), O(RC) stack worst-case; изменяет grid. Итеративный BFS избегает recursion limit.

## LC 733 — Flood Fill

```python
from collections import deque

def flood_fill(image: list[list[int]], sr: int, sc: int, color: int) -> list[list[int]]:
    original = image[sr][sc]
    if original == color:
        return image
    rows, cols = len(image), len(image[0])
    queue = deque([(sr, sc)])
    image[sr][sc] = color
    while queue:
        row, col = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = row + dr, col + dc
            if 0 <= nr < rows and 0 <= nc < cols and image[nr][nc] == original:
                image[nr][nc] = color
                queue.append((nr, nc))
    return image
```

O(RC), O(RC). Mark on enqueue предотвращает дубли.

## LC 994 — Rotting Oranges

```python
from collections import deque

def oranges_rotting(grid: list[list[int]]) -> int:
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    queue: deque[tuple[int, int]] = deque()
    fresh = 0
    for row in range(rows):
        for col in range(cols):
            if grid[row][col] == 2:
                queue.append((row, col))
            elif grid[row][col] == 1:
                fresh += 1
    minutes = 0
    while queue and fresh:
        for _ in range(len(queue)):
            row, col = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1
```

O(RC), O(RC). Все источники добавлены до BFS, поэтому слой соответствует минуте.
