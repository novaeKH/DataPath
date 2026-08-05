---
title: "18. Dynamic Programming — основы"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.18-dynamic-programming-osnovy
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
visual: true
---
# 18. Dynamic Programming — основы

[[17_Greedy|← Предыдущий]] · [[Algorithms_Шпаргалка|Шпаргалка →]]

## 1. Цель урока

Определять состояние, переход, базу и порядок вычисления; реализовать memoization и tabulation.

## 2. Главная идея

DP сохраняет ответы повторяющихся подзадач. Нужны: состояние, переход, базовый случай, порядок.

## 3. Как распознать

Число способов, min/max при выборе, «взять или пропустить», повторяющиеся состояния.

## 4. Когда не подходит

Нет перекрывающихся подзадач; достаточно greedy; пространство состояний слишком велико; простая формула/проход яснее.

## 5. Необходимый Python

`functools.cache`, list DP, аккуратная инициализация, sentinel infinity.

## 6. Универсальные шаблоны

```python
from functools import cache

@cache
def solve(state: int) -> int:
    if is_base(state):
        return base_value
    return combine(solve(previous_state))
```

Tabulation вычисляет состояния от базы к ответу.

## 7. Первая задача: LC 70 Climbing Stairs

```python
def climb_stairs(n: int) -> int:
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return 1
    previous, current = 1, 1
    for _ in range(2, n + 1):
        previous, current = current, previous + current
    return current
```

Состояние `dp[i]` — число способов достичь i. Переход `dp[i]=dp[i-1]+dp[i-2]`. O(n), O(1).

## 8. Вторая задача: LC 198 House Robber

Состояние префикса: максимум денег до текущего дома. Переход: пропустить (`prev1`) или взять (`prev2 + value`).

## 9. Третья задача без решения

LC 322 Coin Change: [[11_Greedy_DP_задачи#LC 322 — Coin Change]]. Это дополнительная Medium. Почему greedy по самой большой монете не универсален?

## 10. Трассировка stairs

| i | dp[i-2] | dp[i-1] | dp[i] |
|---:|---:|---:|---:|
| 2 | 1 | 1 | 2 |
| 3 | 1 | 2 | 3 |
| 4 | 2 | 3 | 5 |

## 11. Инвариант

Перед вычислением i предыдущие состояния корректны и содержат всю информацию, нужную переходу.

## 12. Сложность

Число состояний × цена перехода. Memoization добавляет recursion stack; tabulation — таблицу, иногда память сжимается до нескольких предыдущих состояний.

## 13. Типичные ошибки

Не определить смысл dp[i]; неверная база; вычислить в неверном порядке; оставить экспоненциальную рекурсию без cache; перепутать «невозможно» и 0; сжать память до проверки зависимостей; использовать mutable cache-key.

## 14. Что сказать интервьюеру

> `dp[i]` означает … База … Переход рассматривает … Состояния вычисляю в порядке, где зависимости готовы. Всего n состояний и O(1) переход, значит O(n). Храню два предыдущих значения, поэтому O(1) памяти.

## 15. Мини-контрольная

Четыре части DP? Memoization? Tabulation? Как оценить время? Когда сжать память?

<details><summary>Ответы</summary>
State/transition/base/order; top-down cache; bottom-up table; states×transition; когда нужны только несколько прошлых состояний.
</details>

## 16. Практика

Обязательные: 70, 198. Дополнительная: 322. Повтор: сформулировать state словами до кода.

## 17. Шпаргалка

Meaning of state → base → transition → order → answer → complexity.

## Где это встречается в Data Science

Последовательные оптимизации и динамические модели, но junior DS чаще проверяют мышление на базовых задачах, не продвинутый DP.
