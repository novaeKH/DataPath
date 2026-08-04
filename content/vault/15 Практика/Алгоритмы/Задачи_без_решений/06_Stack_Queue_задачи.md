---
title: "Stack и Queue — задачи без решений"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/tasks"]
id: practice.algorithms.stack-i-queue-zadachi-bez-reshenii
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Stack и Queue — задачи без решений

[[00_Каталог_задач|← Каталог]] · [[06_Stack_Queue_подсказки|Подсказки]]

Каждая карточка содержит уровень, полное условие, входные данные, ожидаемый результат, примеры, ограничения и сигнатуру.

## LC 20 — Valid Parentheses

**Сложность:** Easy

**Условие:** Проверьте правильность вложенности скобок `()[]{}`.

**Дано:** Строка `text`, состоящая из круглых, квадратных и фигурных скобок.

**Нужно вернуть:** `True`, если все скобки корректно закрыты и вложены, иначе `False`.

**Примеры:** `"()[]{}" → True`; `"(]" → False`.

**Ограничения:** строка состоит из скобок.

**Сигнатура:**

```python
def valid_parentheses(text: str) -> bool:
    raise NotImplementedError
```

**Моё решение:**

```python

```

## LC 155 — Min Stack

**Сложность:** Medium

**Условие:** Реализуйте stack с `push`, `pop`, `top`, `getMin`, все O(1).

**Дано:** Последовательность операций со стеком и значения для `push`.

**Нужно вернуть:** Класс с операциями `push`, `pop`, `top` и `get_min`, каждая за O(1).

**Примеры:** push -2,0,-3; getMin → -3; pop; top → 0; getMin → -2.

**Ограничения:** `pop`, `top` и `get_min` вызываются только для непустого стека; все операции должны быть O(1).

**Сигнатура:**

```python
class MinStack:
    def __init__(self) -> None:
        raise NotImplementedError
```

**Перед кодом:** какое дополнительное состояние синхронизировать?

**Моё решение:**

```python

```

## LC 232 — Implement Queue Using Stacks

**Сложность:** Easy

**Условие:** Реализуйте FIFO queue только через операции stack.

**Дано:** Последовательность операций очереди и значения для добавления.

**Нужно вернуть:** Класс FIFO-очереди с операциями `push`, `pop`, `peek` и `empty`.

**Примеры:** `push(1)`, `push(2)`, `peek() → 1`, `pop() → 1`, `empty() → False`.

**Ограничения:** `push`, `pop`, `peek`, `empty`; допустима амортизированная O(1).

**Сигнатура:**

```python
class MyQueue:
    def __init__(self) -> None:
        raise NotImplementedError
```

**Перед кодом:** когда переносить элементы между двумя stacks?

**Моё решение:**

```python

```

## LC 739 — Daily Temperatures

**Сложность:** Medium

**Условие:** Для каждого дня верните число дней до более высокой температуры, иначе 0.

**Дано:** Список дневных температур `temperatures`.

**Нужно вернуть:** Для каждого дня число дней до первой более высокой температуры или `0`.

**Примеры:** `[73,74,75,71,69,72,76,73] → [1,1,4,2,1,1,0,0]`.

**Ограничения:** Ответ имеет ту же длину, что и вход; если более тёплого дня нет, записывается `0`.

**Сигнатура:**

```python
def daily_temperatures(temperatures: list[int]) -> list[int]:
    raise NotImplementedError
```

**Перед кодом:** stack значений или индексов?

**Моё решение:**

```python

```

## LC 1047 — Remove All Adjacent Duplicates in String

**Сложность:** Easy

**Условие:** Повторно удаляйте соседние одинаковые пары и верните итог.

**Дано:** Строка `text`.

**Нужно вернуть:** Строку после повторного удаления всех соседних одинаковых пар.

**Примеры:** `"abbaca" → "ca"`.

**Ограничения:** После удаления пары могут образовываться новые одинаковые соседние пары.

**Сигнатура:**

```python
def remove_adjacent_duplicates(text: str) -> str:
    raise NotImplementedError
```

**Перед кодом:** какой объект хранит уже сокращённый префикс?

**Моё решение:**

```python

```
