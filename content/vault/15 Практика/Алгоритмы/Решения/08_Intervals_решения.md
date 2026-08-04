---
title: "Intervals — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.intervals-resheniia
schema_version: 2
language: ru
app: exclude
---
# Intervals — решения

[[08_Intervals_подсказки|← Подсказки]] · [[09_Linked_List_решения|Следующий блок →]]

## LC 56 — Merge Intervals

```python
def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    merged: list[list[int]] = []
    for start, end in sorted(intervals):
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return merged
```

O(n log n), O(n) результата. Инвариант: merged отсортирован, не пересекается и покрывает обработанный префикс.

## LC 57 — Insert Interval

```python
def insert_interval(intervals: list[list[int]], new: list[int]) -> list[list[int]]:
    result: list[list[int]] = []
    index = 0
    while index < len(intervals) and intervals[index][1] < new[0]:
        result.append(intervals[index])
        index += 1
    start, end = new
    while index < len(intervals) and intervals[index][0] <= end:
        start = min(start, intervals[index][0])
        end = max(end, intervals[index][1])
        index += 1
    result.append([start, end])
    result.extend(intervals[index:])
    return result
```

O(n) время, O(n) результат. Три фазы: до, пересечения, после.

## LC 252 — Meeting Rooms / локальный аналог

```python
def can_attend_meetings(intervals: list[tuple[int, int]]) -> bool:
    ordered = sorted(intervals)
    for previous, current in zip(ordered, ordered[1:]):
        if current[0] < previous[1]:
            return False
    return True
```

O(n log n), O(n) из-за sorted. Для полуоткрытых интервалов встреча при `current.start == previous.end` допустима.
