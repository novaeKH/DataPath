---
title: "Prefix Sum — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.prefix-sum-resheniia
schema_version: 2
language: ru
app: exclude
---
# Prefix Sum — решения

[[04_Prefix_Sum_подсказки|← Подсказки]] · [[05_Binary_Search_решения|Следующий блок →]]

## LC 1480 — Running Sum

```python
def running_sum(nums: list[int]) -> list[int]:
    result: list[int] = []
    total = 0
    for value in nums:
        total += value
        result.append(total)
    return result
```

O(n), O(n) для результата, O(1) рабочего состояния.

## LC 724 — Pivot Index

```python
def pivot_index(nums: list[int]) -> int:
    total = sum(nums)
    left_sum = 0
    for index, value in enumerate(nums):
        if left_sum == total - left_sum - value:
            return index
        left_sum += value
    return -1
```

O(n), O(1). Проверяем до добавления текущего значения в left.

## LC 303 — Range Sum Query

```python
class NumArray:
    def __init__(self, nums: list[int]) -> None:
        self.prefix = [0]
        for value in nums:
            self.prefix.append(self.prefix[-1] + value)

    def sum_range(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]
```

Инициализация O(n), запрос O(1), память O(n). Интервал запроса включительный, поэтому `right+1`.

## LC 560 — Subarray Sum Equals K

```python
def subarray_sum(nums: list[int], k: int) -> int:
    count_by_prefix = {0: 1}
    prefix = 0
    answer = 0
    for value in nums:
        prefix += value
        answer += count_by_prefix.get(prefix - k, 0)
        count_by_prefix[prefix] = count_by_prefix.get(prefix, 0) + 1
    return answer
```

Brute O(n²). Оптимально O(n) среднее, O(n) память. `{0:1}` учитывает подмассив от начала. Сначала добавляем к ответу, затем текущий prefix в map — для корректной позиции.

## LC 238 — Product of Array Except Self

```python
def product_except_self(nums: list[int]) -> list[int]:
    result = [1] * len(nums)
    prefix_product = 1
    for index, value in enumerate(nums):
        result[index] = prefix_product
        prefix_product *= value
    suffix_product = 1
    for index in range(len(nums) - 1, -1, -1):
        result[index] *= suffix_product
        suffix_product *= nums[index]
    return result
```

O(n), O(1) дополнительной памяти без учёта результата. Работает с нулями и не использует деление.
