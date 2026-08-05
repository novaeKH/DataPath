---
title: "13. Recursion и Backtracking"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.13-recursion-i-backtracking
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
visual: true
---
# 13. Recursion и Backtracking

[[12_Linked_List|← Предыдущий]] · [[14_Trees_BFS_DFS|Следующий →]]

## 1. Цель урока

Определять базовый случай, уменьшать подзадачу и строить варианты по схеме choose → explore → unchoose.

## 2. Главная идея

Recursion решает задачу через меньшую версию. Backtracking перебирает дерево решений, откатывая состояние.

## 3. Как распознать

Иерархия, дерево, все комбинации/перестановки, «выбрать или не выбрать».

## 4. Когда не подходит

Глубина может превысить лимит Python; простой линейный проход яснее; повторяющиеся подзадачи требуют memoization/DP.

## 5. Необходимый Python

Вложенная функция, `nonlocal` при необходимости, `append/pop`, копия пути `path.copy()`.

## 6. Универсальный шаблон

```python
def backtrack(start: int) -> None:
    result.append(path.copy())
    for index in range(start, len(values)):
        path.append(values[index])
        backtrack(index + 1)
        path.pop()
```

## 7. Первая задача: factorial как модель

```python
def factorial(n: int) -> int:
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return 1
    return n * factorial(n - 1)
```

Базовый случай завершает рекурсию, аргумент уменьшается.

## 8. Вторая задача: subsets локально

Для каждого элемента две ветви: взять/не взять. Сложность O(n·2ⁿ) с учётом копирования результатов.

## 9. Третья задача без решения

Сгенерируйте комбинации длины k без повторов. Какой `start` передавать следующему вызову?

## 10. Трассировка `[1,2]`

`[] → [1] → [1,2] → откат [1] → откат [] → [2]`.

## 11. Инвариант

`path` содержит выбранные элементы текущей ветви; после `pop` состояние точно восстановлено для следующей ветви.

## 12. Сложность

Recursion: глубина стека равна глубине задачи. Backtracking часто экспоненциальный; считать нужно число состояний и стоимость копии результата.

## 13. Типичные ошибки

Нет базового случая; подзадача не уменьшается; забыть `pop`; добавить один mutable `path` без копии; общий mutable default; неверная оценка результата; использовать рекурсию на глубоком линейном входе.

## 14. Что сказать интервьюеру

> Состояние рекурсии — текущий path и следующая позиция. На шаге выбираю вариант, рекурсивно исследую, затем откатываю выбор. Инвариант: перед каждой итерацией path соответствует текущей ветви.

## 15. Мини-контрольная

Два требования к recursion? Зачем path.copy? Что делает pop? Когда memoization? Почему stack memory?

<details><summary>Ответы</summary>
База и прогресс; сохранить снимок; откат; повторяющиеся состояния; каждый вызов хранит frame.
</details>

## 16. Практика

Обязательное: factorial и subsets локально. Дополнительно: combinations. Повтор: нарисовать дерево решений.

## 17. Шпаргалка

Base case + smaller state. Backtracking = choose → recurse → unchoose.

## Где это встречается в Data Science

Обход пространств конфигураций и деревьев, но реальные hyperparameter search используют готовые стратегии; навык важен для ясного состояния.
