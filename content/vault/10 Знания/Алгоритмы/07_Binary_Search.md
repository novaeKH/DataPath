---
title: "07. Binary Search"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.07-binary-search
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 07. Binary Search

[[06_Prefix_Sum|← Предыдущий]] · [[08_Stack_Queue_Deque|Следующий →]]

## 1. Цель урока

Писать Binary Search без ошибок границ и видеть монотонный предикат, а не только «поиск числа».

## 2. Главная идея

На каждом шаге половина кандидатов точно отбрасывается.

## 3. Как распознать

Отсортированный вход; первый/последний подходящий; минимальное допустимое значение; ответ меняется `False…False, True…True`.

## 4. Когда не подходит

Нет порядка/монотонности; данные малы и линейный поиск яснее; вставка в list всё равно O(n).

## 5. Необходимый Python

Целочисленное `//`, полуинтервал `[left,right)`, `bisect_left`.

## 6. Универсальный шаблон

```python
left, right = 0, len(values)
while left < right:
    middle = left + (right - left) // 2
    if values[middle] < target:
        left = middle + 1
    else:
        right = middle
# left — первая позиция со значением >= target
```

## 7. Первая задача: LC 704 Binary Search

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

assert binary_search([-1, 0, 3, 5, 9], 9) == 4
assert binary_search([], 2) == -1
```

## 8. Вторая задача: LC 35 Search Insert Position

Ищите первую позицию `>= target` в полуинтервале. После цикла `left` может равняться `len(nums)`.

## 9. Третья задача без решения

LC 69 Sqrt(x): [[05_Binary_Search_задачи#LC 69 — Sqrt(x)]]. Какой предикат монотонен?

## 10. Трассировка

| left | right | middle | value | действие |
|---:|---:|---:|---:|---|
| 0 | 4 | 2 | 3 | left=3 |
| 3 | 4 | 3 | 5 | left=4 |
| 4 | 4 | 4 | 9 | ответ |

## 11. Инвариант

Искомое значение, если существует, остаётся внутри текущего диапазона кандидатов.

## 12. Сложность

O(log n) времени, O(1) памяти итеративно. Рекурсивно O(log n) stack.

## 13. Типичные ошибки

- смешать `[l,r]` и `[l,r)`;
- не исключить middle и зациклиться;
- неверный `<=`;
- читать `nums[middle]` на пустом входе;
- применять к немонотонному условию;
- считать вставку через bisect O(log n).

## 14. Что сказать интервьюеру

> Поддерживаю диапазон возможных ответов. Проверка middle позволяет безопасно исключить половину, и после обновления ответ остаётся в диапазоне. Размер уменьшается вдвое, поэтому O(log n), память O(1).

## 15. Мини-контрольная

Почему `left + (right-left)//2`? Что возвращает lower bound? Когда `left==len`? Цена `insort`? Сложность рекурсивной памяти?

<details><summary>Ответы</summary>
Защита от overflow в других языках/ясность; первая позиция ≥ target; target больше всех; O(n); O(log n).
</details>

## 16. Практика

Обязательные: 704, 35, 69, 278. Дополнительные: 153, 33. Повтор: написать оба шаблона границ.

## 17. Шпаргалка

Выберите один контракт диапазона и не смешивайте. Движение обязательно исключает middle.

## Где это встречается в Data Science

Поиск порога или минимального параметра при монотонной метрике; поиск позиции в отсортированных бинах.
