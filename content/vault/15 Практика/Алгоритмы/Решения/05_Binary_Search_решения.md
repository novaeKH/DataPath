---
title: "Binary Search — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.binary-search-resheniia
schema_version: 2
language: ru
app: exclude
---
# Binary Search — решения

[[05_Binary_Search_подсказки|← Подсказки]] · [[06_Stack_Queue_решения|Следующий блок →]]

## LC 704 — Binary Search

```python
def binary_search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        middle = left + (right - left) // 2
        if nums[middle] == target:
            return middle
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle - 1
    return -1
```

Brute O(n), оптимально O(log n), O(1). Инвариант: target, если есть, остаётся в закрытом `[left,right]`.

## LC 35 — Search Insert Position

```python
def search_insert(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)
    while left < right:
        middle = left + (right - left) // 2
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle
    return left
```

Ищем lower bound — первую позицию `>= target`. O(log n), O(1). Работает на пустом списке и может вернуть n.

## LC 69 — Sqrt(x)

```python
def integer_sqrt(x: int) -> int:
    if x < 0:
        raise ValueError("x must be non-negative")
    left, right = 0, x
    answer = 0
    while left <= right:
        middle = left + (right - left) // 2
        if middle * middle <= x:
            answer = middle
            left = middle + 1
        else:
            right = middle - 1
    return answer
```

Ищем последний валидный m. O(log x), O(1). В языках с overflow сравнивают `m <= x/m`.

## LC 278 — First Bad Version

```python
from collections.abc import Callable

def first_bad_version(n: int, is_bad_version: Callable[[int], bool]) -> int:
    left, right = 1, n
    while left < right:
        middle = left + (right - left) // 2
        if is_bad_version(middle):
            right = middle
        else:
            left = middle + 1
    return left

assert first_bad_version(5, lambda version: version >= 4) == 4
```

В LeetCode callback предоставлен как `isBadVersion`. O(log n) вызовов, O(1).

## LC 153 — Find Minimum in Rotated Sorted Array

```python
def find_min_rotated(nums: list[int]) -> int:
    if not nums:
        raise ValueError("nums must not be empty")
    left, right = 0, len(nums) - 1
    while left < right:
        middle = left + (right - left) // 2
        if nums[middle] > nums[right]:
            left = middle + 1
        else:
            right = middle
    return nums[left]
```

O(log n), O(1). Уникальность важна; с дубликатами иногда приходится уменьшать right и худший случай O(n).

## LC 33 — Search in Rotated Sorted Array

```python
def search_rotated(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        middle = left + (right - left) // 2
        if nums[middle] == target:
            return middle
        if nums[left] <= nums[middle]:
            if nums[left] <= target < nums[middle]:
                right = middle - 1
            else:
                left = middle + 1
        else:
            if nums[middle] < target <= nums[right]:
                left = middle + 1
            else:
                right = middle - 1
    return -1
```

Одна половина всегда отсортирована; оставляем её только если target лежит в её границах. O(log n), O(1).
