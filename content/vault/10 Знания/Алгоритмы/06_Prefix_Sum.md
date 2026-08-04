---
title: "06. Prefix Sum"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.06-prefix-sum
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 06. Prefix Sum

[[05_Sliding_Window|← Предыдущий]] · [[07_Binary_Search|Следующий →]]

## 1. Цель урока

Предобрабатывать последовательность для быстрых сумм диапазона и использовать «prefix sum → частота» для подсчёта подмассивов.

## 2. Главная идея

`prefix[i]` — сумма первых i элементов. Тогда сумма полуинтервала `[left, right)` равна `prefix[right] - prefix[left]`.

## 3. Как распознать

Много запросов суммы по диапазону, баланс слева/справа, подмассив с заданной суммой, накопительный итог.

## 4. Когда не подходит

Для одного движущегося окна проще Sliding Window. Для частых обновлений массива простой prefix устаревает. Для minimum-length с положительными числами окно часто лучше.

## 5. Необходимый Python

Список длины `n+1`, `enumerate`, `itertools.accumulate`, dict частот.

## 6. Универсальный шаблон

```python
def prefix_sums(nums: list[int]) -> list[int]:
    prefix = [0]
    for num in nums:
        prefix.append(prefix[-1] + num)
    return prefix
```

## 7. Первая задача: LC 1480 Running Sum

```python
def running_sum(nums: list[int]) -> list[int]:
    result: list[int] = []
    total = 0
    for num in nums:
        total += num
        result.append(total)
    return result

assert running_sum([1, 2, 3]) == [1, 3, 6]
```

O(n) времени, O(n) результата; дополнительное рабочее состояние O(1).

## 8. Вторая задача: LC 724 Pivot Index

Сначала `total`, затем поддерживать `left_sum`; правая сумма `total-left_sum-current`. Можно O(1) дополнительной памяти.

## 9. Третья задача без решения

LC 560: [[04_Prefix_Sum_задачи#LC 560 — Subarray Sum Equals K]]. Какое ранее встречавшееся значение prefix нужно найти?

## 10. Трассировка диапазона

Для `[2, -1, 4]` prefix `[0, 2, 1, 5]`; сумма индексов `[1, 3)` = `5 - 2 = 3`.

## 11. Инвариант

Перед обработкой `nums[i]` текущий `prefix` равен сумме `nums[:i]`; dict частот хранит prefix-суммы до текущей позиции.

## 12. Сложность

Предобработка O(n), запрос O(1), память O(n). Pivot без массива prefix: O(n) время, O(1) память.

## 13. Типичные ошибки

- смешать закрытый диапазон и полуинтервал;
- забыть начальный ноль;
- off-by-one в запросе;
- для LC 560 записать prefix до подсчёта и неверно учесть текущую позицию;
- применить Sliding Window к отрицательным числам;
- назвать O(1) память при массиве prefix.

## 14. Что сказать интервьюеру

> Сохраняю сумму первых i элементов с начальным нулём. Тогда любой диапазон получается разностью двух prefix за O(1). Предобработка O(n), память O(n). Для подсчёта подмассивов с суммой k ищу, сколько раз раньше встречался `current_prefix-k`.

## 15. Мини-контрольная

Зачем prefix[0]=0? Формула `[l,r)`? Почему отрицательные числа допустимы в LC 560? Цена запроса? Когда нужен Fenwick tree?

<details><summary>Ответы</summary>
Пустой префикс/единая формула; `p[r]-p[l]`; не нужна монотонность, используем map; O(1); при обновлениях и запросах.
</details>

## 16. Практика

Обязательные: 1480, 724, 303, 238. Дополнительная Medium: 560. Повтор: 724 и 560.

## 17. Шпаргалка

`prefix=[0]`; append last + x; range `[l,r)` = `p[r]-p[l]`; count target: `seen[prefix-k]`.

## Где это встречается в Data Science

Кумулятивные метрики и быстрые агрегаты по диапазонам. В production обновляемые данные могут требовать другой структуры или оконной функции БД.
