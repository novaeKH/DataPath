---
title: "Stack и Queue — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.stack-i-queue-resheniia
schema_version: 2
language: ru
app: exclude
---
# Stack и Queue — решения

[[06_Stack_Queue_подсказки|← Подсказки]] · [[07_Heap_Top_K_решения|Следующий блок →]]

## LC 20 — Valid Parentheses

```python
def valid_parentheses(text: str) -> bool:
    opening_by_closing = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for char in text:
        if char in "([{":
            stack.append(char)
        elif not stack or stack.pop() != opening_by_closing[char]:
            return False
    return not stack
```

O(n), O(n). Инвариант: stack — незакрытые скобки префикса. Edge: closing при пустом stack и незакрытый остаток.

## LC 155 — Min Stack

```python
class MinStack:
    def __init__(self) -> None:
        self._items: list[tuple[int, int]] = []

    def push(self, value: int) -> None:
        current_min = value if not self._items else min(value, self._items[-1][1])
        self._items.append((value, current_min))

    def pop(self) -> None:
        self._items.pop()

    def top(self) -> int:
        return self._items[-1][0]

    def get_min(self) -> int:
        return self._items[-1][1]
```

Все операции O(1), память O(n). Альтернатива — два синхронизированных stacks.

## LC 232 — Implement Queue Using Stacks

```python
class MyQueue:
    def __init__(self) -> None:
        self._input: list[int] = []
        self._output: list[int] = []

    def push(self, value: int) -> None:
        self._input.append(value)

    def _prepare_output(self) -> None:
        if not self._output:
            while self._input:
                self._output.append(self._input.pop())

    def pop(self) -> int:
        self._prepare_output()
        return self._output.pop()

    def peek(self) -> int:
        self._prepare_output()
        return self._output[-1]

    def empty(self) -> bool:
        return not self._input and not self._output
```

Каждый элемент перекладывается максимум один раз: push O(1), pop/peek O(1) амортизированно, память O(n).

## LC 739 — Daily Temperatures

```python
def daily_temperatures(temperatures: list[int]) -> list[int]:
    answer = [0] * len(temperatures)
    stack: list[int] = []
    for index, temperature in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < temperature:
            previous = stack.pop()
            answer[previous] = index - previous
        stack.append(index)
    return answer
```

Brute O(n²), monotonic stack O(n), O(n). Каждый индекс push/pop не более раза.

## LC 1047 — Remove Adjacent Duplicates

```python
def remove_adjacent_duplicates(text: str) -> str:
    stack: list[str] = []
    for char in text:
        if stack and stack[-1] == char:
            stack.pop()
        else:
            stack.append(char)
    return "".join(stack)
```

O(n) время и память. Stack всегда равен полностью сокращённому обработанному префиксу.
