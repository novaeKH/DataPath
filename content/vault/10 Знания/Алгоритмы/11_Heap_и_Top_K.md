---
title: "11. Heap и Top-K"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.11-heap-i-top-k
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 11. Heap и Top-K

[[10_Intervals|← Предыдущий]] · [[12_Linked_List|Следующий →]]

## 1. Цель урока

Выбирать heap, когда нужны малый Top-K, поток или повторное извлечение экстремума.

## 2. Главная идея

Heap гарантирует экстремум на вершине, но не полную сортировку. `heapq` — min-heap.

## 3. Как распознать

Top-K, k-й largest/smallest, поток, «каждый раз взять минимальный/максимальный».

## 4. Когда не подходит

Нужен полный порядок → sort. Один min/max → линейный проход. Частый поиск произвольного элемента → set/dict.

## 5. Необходимый Python

`heapq.heapify`, `heappush`, `heappop`, `heappushpop`, отрицательные числа для max-heap.

## 6. Универсальный шаблон Top-K

```python
from heapq import heappush, heappushpop

heap: list[int] = []
for value in values:
    if len(heap) < k:
        heappush(heap, value)
    elif value > heap[0]:
        heappushpop(heap, value)
```

## 7. Первая задача: LC 1046 Last Stone Weight

```python
from heapq import heapify, heappop, heappush

def last_stone_weight(stones: list[int]) -> int:
    heap = [-stone for stone in stones]
    heapify(heap)
    while len(heap) > 1:
        first = -heappop(heap)
        second = -heappop(heap)
        if first != second:
            heappush(heap, -(first - second))
    return -heap[0] if heap else 0
```

## 8. Вторая задача: LC 215

Поддерживать min-heap размера k: вершина — k-й largest среди просмотренных. O(n log k), память O(k). Quickselect — среднее O(n), но сложнее.

## 9. Третья задача без решения

LC 347: [[07_Heap_Top_K_задачи#LC 347 — Top K Frequent Elements]]. Что является объектом приоритета?

## 10. Трассировка Top-2 `[3,1,5]`

| value | heap |
|---:|---|
| 3 | [3] |
| 1 | [1,3] |
| 5 | [3,5] |

## 11. Инвариант

Heap содержит k крупнейших просмотренных элементов; вершина — минимальный из них.

## 12. Сложность

Build heap O(n), push/pop O(log n), peek O(1), Top-K O(n log k), память O(k).

## 13. Типичные ошибки

Считать heap отсортированным; неверный знак max-heap; не ограничить размер k; забыть k=0/пустой вход; сравнивать несравнимые tie-поля; сортировать всё при малом k.

## 14. Что сказать интервьюеру

> Храню min-heap размера k. Он содержит k лучших просмотренных элементов, а вершина — худший среди них. Новый больший элемент заменяет вершину. Время O(n log k), память O(k), что выгоднее полной сортировки при k ≪ n.

## 15. Мини-контрольная

Тип heapq? Peek? Build? Top-K сложность? Почему min-heap для largest?

<details><summary>Ответы</summary>
Min; heap[0] O(1); O(n); O(n log k); вершина — порог k лучших.
</details>

## 16. Практика

Обязательные: 215, 347, 1046. Дополнительная: 703. Повтор: heap vs sort.

## 17. Шпаргалка

Top-K largest → min-heap k; повторный max → отрицания; heap не отсортирован.

## Где это встречается в Data Science

Top-K объектов/признаков, streaming ranking, приоритетная обработка. Для DataFrame часто есть `nlargest`, но компромисс тот же.
