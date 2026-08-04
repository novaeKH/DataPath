---
title: "Hash Map и массивы — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.hash-map-i-massivy-resheniia
schema_version: 2
language: ru
app: exclude
---
# Hash Map и массивы — решения

[[01_Hash_Map_и_массивы_подсказки|← Подсказки]] · [[02_Two_Pointers_решения|Следующий блок →]]

## LC 1 — Two Sum

**Brute force:** проверить все пары — O(n²), O(1).  
**Оптимально:** dict хранит значение → индекс для уже просмотренного префикса. До записи `x` проверяем complement, чтобы не взять один индекс дважды.

```python
def two_sum(nums: list[int], target: int) -> tuple[int, int]:
    index_by_value: dict[int, int] = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in index_by_value:
            return index_by_value[complement], index
        index_by_value[value] = index
    raise ValueError("solution does not exist")

assert two_sum([2, 7, 11, 15], 9) == (0, 1)
assert two_sum([3, 3], 6) == (0, 1)
```

Трассировка `[2,7]`: до 2 map пуст; сохраняем `2:0`. Для 7 complement 2 уже есть — ответ `(0,1)`. Инвариант: map содержит индексы только слева. O(n) среднее время, O(n) память. Ошибки: записать раньше проверки, вернуть значения, не оговорить отсутствие ответа.

## LC 217 — Contains Duplicate

Brute force — все пары O(n²). Set даёт O(n) среднее время и O(n) память.

```python
def contains_duplicate(nums: list[int]) -> bool:
    seen: set[int] = set()
    for value in nums:
        if value in seen:
            return True
        seen.add(value)
    return False
```

Альтернатива `len(nums) != len(set(nums))` коротка, но сразу материализует весь set и не делает early return.

## LC 242 — Valid Anagram

Сортировка — O(n log n). Частоты — O(n+m) времени, O(k) памяти.

```python
def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    counts: dict[str, int] = {}
    for char in s:
        counts[char] = counts.get(char, 0) + 1
    for char in t:
        if counts.get(char, 0) == 0:
            return False
        counts[char] -= 1
    return True
```

Edge cases: пустые строки, Unicode, разный регистр — трактуются буквально.

## LC 49 — Group Anagrams

Brute force сравнивает каждую пару. Понятный вариант использует отсортированную строку как ключ: O(N·K log K).

```python
from collections import defaultdict

def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: defaultdict[str, list[str]] = defaultdict(list)
    for word in words:
        key = "".join(sorted(word))
        groups[key].append(word)
    return list(groups.values())
```

Для строчных `a-z` ключ из 26 частот даёт O(N·K), но код длиннее. Инвариант: у всех слов в `groups[key]` одна каноническая сигнатура.

## LC 349 — Intersection of Two Arrays

```python
def intersection(nums1: list[int], nums2: list[int]) -> list[int]:
    return list(set(nums1) & set(nums2))
```

O(n+m) среднее время, O(n+m) память. Порядок не гарантирован. Если порядок ответа важен, нужен явный проход и `seen`.

## LC 350 — Intersection of Two Arrays II

```python
def intersect_multiset(nums1: list[int], nums2: list[int]) -> list[int]:
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    counts: dict[int, int] = {}
    for value in nums1:
        counts[value] = counts.get(value, 0) + 1
    result: list[int] = []
    for value in nums2:
        if counts.get(value, 0) > 0:
            result.append(value)
            counts[value] -= 1
    return result
```

O(n+m) среднее время, O(min(n,m)) память. Альтернатива для отсортированных массивов — Two Pointers с O(1) дополнительной памятью.

## LC 387 — First Unique Character

```python
def first_unique_char(text: str) -> int:
    counts: dict[str, int] = {}
    for char in text:
        counts[char] = counts.get(char, 0) + 1
    for index, char in enumerate(text):
        if counts[char] == 1:
            return index
    return -1
```

Два последовательных прохода — O(n), не O(n²). Память O(k).

## LC 169 — Majority Element

Count-map: O(n) памяти. Boyer–Moore использует O(1), потому что majority переживает взаимное «погашение» с другими значениями.

```python
def majority_element(nums: list[int]) -> int:
    if not nums:
        raise ValueError("nums must not be empty")
    candidate = nums[0]
    balance = 0
    for value in nums:
        if balance == 0:
            candidate = value
        balance += 1 if value == candidate else -1
    return candidate
```

O(n), O(1). Если majority не гарантирован, нужен второй проход для проверки.

## LC 128 — Longest Consecutive Sequence

Сортировка — O(n log n). Set позволяет начинать только там, где `x-1` отсутствует.

```python
def longest_consecutive(nums: list[int]) -> int:
    values = set(nums)
    best = 0
    for value in values:
        if value - 1 in values:
            continue
        length = 1
        while value + length in values:
            length += 1
        best = max(best, length)
    return best
```

Ожидаемое O(n): каждый элемент проходит внутренний while только как часть одной цепочки. Память O(n). Edge: пустой список → 0, дубликаты не влияют.
