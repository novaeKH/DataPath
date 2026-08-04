---
title: "Heap и Top-K — задачи без решений"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/tasks"]
id: practice.algorithms.heap-i-top-k-zadachi-bez-reshenii
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Heap и Top-K — задачи без решений

[[00_Каталог_задач|← Каталог]] · [[07_Heap_Top_K_подсказки|Подсказки]]

Каждая карточка содержит уровень, полное условие, входные данные, ожидаемый результат, примеры, ограничения и сигнатуру.

## LC 215 — Kth Largest Element in an Array

**Сложность:** Medium

**Условие:** Верните k-й крупнейший элемент, не k-й уникальный.

**Дано:** Список чисел `nums` и номер позиции `k`.

**Нужно вернуть:** `k`-й по величине элемент с учётом повторов.

**Примеры:** `[3,2,1,5,6,4], k=2 → 5`.

**Ограничения:** `1 ≤ k ≤ n`.

**Сигнатура:**

```python
def find_kth_largest(nums: list[int], k: int) -> int:
    raise NotImplementedError
```

**Перед кодом:** что означает вершина min-heap размера k?

**Моё решение:**

```python

```

## LC 347 — Top K Frequent Elements

**Сложность:** Medium

**Условие:** Верните k самых частых значений.

**Дано:** Список чисел `nums` и количество результатов `k`.

**Нужно вернуть:** `k` наиболее часто встречающихся значений.

**Примеры:** `[1,1,1,2,2,3], k=2 → [1,2]`.

**Ограничения:** ответ уникален по условию оригинала.

**Сигнатура:**

```python
def top_k_frequent(nums: list[int], k: int) -> list[int]:
    raise NotImplementedError
```

**Перед кодом:** какие пары помещать в heap?

**Моё решение:**

```python

```

## LC 703 — Kth Largest Element in a Stream

**Сложность:** Easy

**Условие:** Класс принимает k и начальный поток; `add(value)` возвращает текущий k-й largest.

**Дано:** Число `k`, начальный список `nums` и последующие значения потока.

**Нужно вернуть:** После каждого `add(value)` текущий `k`-й по величине элемент потока.

**Примеры:** k=3, `[4,5,8,2]`; add(3) → 4, add(5) → 5.

**Ограничения:** После обработки очередного значения в потоке должно находиться не меньше `k` элементов.

**Сигнатура:**

```python
class KthLargest:
    def __init__(self, k: int, nums: list[int]) -> None:
        raise NotImplementedError
```

**Перед кодом:** какой размер heap поддерживать всегда?

**Моё решение:**

```python

```

## LC 1046 — Last Stone Weight

**Сложность:** Easy

**Условие:** Каждый раз разбивайте две самые тяжёлые «глыбы»; верните остаток или 0.

**Дано:** Список положительных весов `stones`.

**Нужно вернуть:** Вес последнего камня или `0`, если камней не осталось.

**Примеры:** `[2,7,4,1,8,1] → 1`.

**Ограничения:** Веса положительны; если после столкновений не осталось камней, вернуть `0`.

**Сигнатура:**

```python
def last_stone_weight(stones: list[int]) -> int:
    raise NotImplementedError
```

**Перед кодом:** как эмулировать max-heap через `heapq`?

**Моё решение:**

```python

```
