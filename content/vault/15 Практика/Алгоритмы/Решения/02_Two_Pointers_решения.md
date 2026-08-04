---
title: "Two Pointers — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.two-pointers-resheniia
schema_version: 2
language: ru
app: exclude
---
# Two Pointers — решения

[[02_Two_Pointers_подсказки|← Подсказки]] · [[03_Sliding_Window_решения|Следующий блок →]]

## LC 344 — Reverse String

```python
def reverse_string(chars: list[str]) -> None:
    left, right = 0, len(chars) - 1
    while left < right:
        chars[left], chars[right] = chars[right], chars[left]
        left += 1
        right -= 1
```

Brute с `chars[::-1]` создаёт копию O(n). Здесь O(n), O(1); вне `[left,right]` уже готово.

## LC 125 — Valid Palindrome

```python
def is_palindrome(text: str) -> bool:
    left, right = 0, len(text) - 1
    while left < right:
        while left < right and not text[left].isalnum():
            left += 1
        while left < right and not text[right].isalnum():
            right -= 1
        if text[left].casefold() != text[right].casefold():
            return False
        left += 1
        right -= 1
    return True
```

O(n), O(1). Альтернатива с filtered string проще, но O(n) память. Ошибка: `if` вместо `while` при нескольких разделителях.

## LC 26 — Remove Duplicates

```python
def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    write = 1
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write
```

Инвариант: `nums[:write]` — уникальный префикс просмотренных данных. O(n), O(1).

## LC 27 — Remove Element

```python
def remove_element(nums: list[int], value: int) -> int:
    write = 0
    for current in nums:
        if current != value:
            nums[write] = current
            write += 1
    return write
```

O(n), O(1), порядок сохранён. Если порядок не важен и target редок, можно менять с хвостом.

## LC 88 — Merge Sorted Array

```python
def merge_sorted(nums1: list[int], m: int, nums2: list[int], n: int) -> None:
    left, right, write = m - 1, n - 1, m + n - 1
    while right >= 0:
        if left >= 0 and nums1[left] > nums2[right]:
            nums1[write] = nums1[left]
            left -= 1
        else:
            nums1[write] = nums2[right]
            right -= 1
        write -= 1
```

Пишем с конца, чтобы не затирать nums1. O(m+n), O(1). Остаток nums1 уже на месте.

## LC 167 — Two Sum II

```python
def two_sum_sorted(numbers: list[int], target: int) -> list[int]:
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]
        if total < target:
            left += 1
        else:
            right -= 1
    raise ValueError("solution does not exist")
```

O(n), O(1). Корректность движения опирается на сортировку.

## LC 283 — Move Zeroes

```python
def move_zeroes(nums: list[int]) -> None:
    write = 0
    for value in nums:
        if value != 0:
            nums[write] = value
            write += 1
    for index in range(write, len(nums)):
        nums[index] = 0
```

O(n), O(1), относительный порядок сохранён. Альтернатива swap делает один проход, но больше записей.

## LC 11 — Container With Most Water

```python
def max_area(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        width = right - left
        best = max(best, width * min(height[left], height[right]))
        if height[left] <= height[right]:
            left += 1
        else:
            right -= 1
    return best
```

Brute all pairs O(n²). Двигаем короткую линию: движение длинной уменьшит ширину и не увеличит ограничивающую высоту. O(n), O(1).
