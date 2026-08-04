---
title: "Sliding Window — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.sliding-window-resheniia
schema_version: 2
language: ru
app: exclude
---
# Sliding Window — решения

[[03_Sliding_Window_подсказки|← Подсказки]] · [[04_Prefix_Sum_решения|Следующий блок →]]

## LC 643 — Maximum Average Subarray I

```python
def find_max_average(nums: list[int], k: int) -> float:
    if not 1 <= k <= len(nums):
        raise ValueError("invalid k")
    window_sum = sum(nums[:k])
    best = window_sum
    for right in range(k, len(nums)):
        window_sum += nums[right] - nums[right - k]
        best = max(best, window_sum)
    return best / k
```

Brute пересчитывает k элементов для каждого окна: O(nk). Оптимально O(n), O(1). Состояние — сумма ровно последних k элементов.

## LC 3 — Longest Substring Without Repeating Characters

```python
def longest_unique_substring(text: str) -> int:
    last_index: dict[str, int] = {}
    left = 0
    best = 0
    for right, char in enumerate(text):
        if char in last_index and last_index[char] >= left:
            left = last_index[char] + 1
        last_index[char] = right
        best = max(best, right - left + 1)
    return best
```

O(n) среднее время, O(k) память. `max`-подобная проверка `>= left` не позволяет вернуть левую границу назад. Альтернатива set + while также O(n).

## LC 1004 — Max Consecutive Ones III

```python
def longest_ones(nums: list[int], k: int) -> int:
    left = 0
    zero_count = 0
    best = 0
    for right, value in enumerate(nums):
        zero_count += value == 0
        while zero_count > k:
            zero_count -= nums[left] == 0
            left += 1
        best = max(best, right - left + 1)
    return best
```

O(n), O(1). Инвариант после while: в окне не более k нулей.

## LC 567 — Permutation in String

```python
from collections import Counter

def check_inclusion(s1: str, s2: str) -> bool:
    width = len(s1)
    if width > len(s2):
        return False
    need = Counter(s1)
    window = Counter(s2[:width])
    if window == need:
        return True
    for right in range(width, len(s2)):
        entering = s2[right]
        leaving = s2[right - width]
        window[entering] += 1
        window[leaving] -= 1
        if window[leaving] == 0:
            del window[leaving]
        if window == need:
            return True
    return False
```

Для фиксированного алфавита сравнение массивов 26 — O(1), суммарно O(n). С Counter формально сравнение зависит от числа разных ключей.

## LC 424 — Longest Repeating Character Replacement

```python
def character_replacement(text: str, k: int) -> int:
    counts: dict[str, int] = {}
    left = 0
    max_frequency = 0
    best = 0
    for right, char in enumerate(text):
        counts[char] = counts.get(char, 0) + 1
        max_frequency = max(max_frequency, counts[char])
        while right - left + 1 - max_frequency > k:
            counts[text[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best
```

O(n), O(alphabet). `max_frequency` не уменьшаем: это верхняя граница, достаточная для максимальной длины; вариант с пересчётом проще доказать, но дороже для большого алфавита.

## LC 209 — Minimum Size Subarray Sum

```python
def min_subarray_len(target: int, nums: list[int]) -> int:
    left = 0
    window_sum = 0
    best = len(nums) + 1
    for right, value in enumerate(nums):
        window_sum += value
        while window_sum >= target:
            best = min(best, right - left + 1)
            window_sum -= nums[left]
            left += 1
    return 0 if best == len(nums) + 1 else best
```

O(n), O(1). Положительность чисел обязательна: удаление слева предсказуемо уменьшает сумму.
