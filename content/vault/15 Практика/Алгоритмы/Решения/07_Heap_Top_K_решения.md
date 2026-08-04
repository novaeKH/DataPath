---
title: "Heap и Top-K — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.heap-i-top-k-resheniia
schema_version: 2
language: ru
app: exclude
---
# Heap и Top-K — решения

[[07_Heap_Top_K_подсказки|← Подсказки]] · [[08_Intervals_решения|Следующий блок →]]

## LC 215 — Kth Largest

```python
from heapq import heappop, heappush

def find_kth_largest(nums: list[int], k: int) -> int:
    if not 1 <= k <= len(nums):
        raise ValueError("invalid k")
    heap: list[int] = []
    for value in nums:
        heappush(heap, value)
        if len(heap) > k:
            heappop(heap)
    return heap[0]
```

Сортировка O(n log n). Heap O(n log k), O(k). Вершина — минимальный из k крупнейших.

## LC 347 — Top K Frequent Elements

```python
from collections import Counter
from heapq import nlargest

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    counts = Counter(nums)
    return [value for value, _ in nlargest(k, counts.items(), key=lambda pair: pair[1])]
```

O(n + u log k), O(u), где u — число уникальных. Bucket sort может дать O(n), но использует массив buckets длины n+1.

## LC 703 — Kth Largest in a Stream

```python
from heapq import heapify, heappop, heappush

class KthLargest:
    def __init__(self, k: int, nums: list[int]) -> None:
        if k < 1:
            raise ValueError("k must be positive")
        self._k = k
        self._heap = list(nums)
        heapify(self._heap)
        while len(self._heap) > k:
            heappop(self._heap)

    def add(self, value: int) -> int:
        heappush(self._heap, value)
        if len(self._heap) > self._k:
            heappop(self._heap)
        return self._heap[0]
```

Каждый add O(log k), память O(k). Инвариант сохраняется между вызовами.

## LC 1046 — Last Stone Weight

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

O(n log n) в худшем случае, O(n) память для копии heap. Отрицания эмулируют max-heap.
