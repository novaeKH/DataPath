---
title: "08. Stack, Queue и deque"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.08-stack-queue-i-deque
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 08. Stack, Queue и deque

[[07_Binary_Search|← Предыдущий]] · [[09_Monotonic_Stack|Следующий →]]

## 1. Цель урока

Выбирать LIFO/FIFO и использовать Python-структуру без случайной O(n) операции.

## 2. Главная идея

Stack возвращает последний добавленный элемент (LIFO), queue — первый (FIFO), deque делает O(1) операции с обоих концов.

## 3. Как распознать

Скобки, отмена/откат, вложенность, следующий незакрытый объект → stack. Уровни, очередь задач, кратчайшие шаги → queue.

## 4. Когда не подходит

Нужен произвольный priority → heap. Нужен membership → set. `list.pop(0)` не подходит для большой queue.

## 5. Необходимый Python

Stack: `list.append/pop`. Queue: `collections.deque.append/popleft`. Эти операции
работают с концами контейнеров за амортизированное O(1); `list.pop(0)` сдвигает
остальные элементы и поэтому даёт O(n).

## 6. Универсальные шаблоны

```python
stack: list[int] = []
stack.append(value)
last = stack.pop()
```

```python
from collections import deque
queue = deque([start])
current = queue.popleft()
```

## 7. Первая задача: LC 20 Valid Parentheses

```python
def is_valid_parentheses(text: str) -> bool:
    opening_by_closing = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for char in text:
        if char in opening_by_closing.values():
            stack.append(char)
        elif not stack or stack.pop() != opening_by_closing.get(char):
            return False
    return not stack
```

Инвариант: stack содержит незакрытые скобки обработанного префикса. O(n) время, O(n) память.

## 8. Вторая задача: LC 1047

Если вершина stack равна символу — удалить, иначе добавить. Результат `"".join(stack)`.

## 9. Третья задача без решения

LC 232: [[06_Stack_Queue_задачи#LC 232 — Implement Queue Using Stacks]]. Как распределить дорогой перенос между операциями?

## 10. Трассировка `([])`

| char | stack |
|---|---|
| `(` | `(` |
| `[` | `([` |
| `]` | `(` |
| `)` | пуст |

## 11. Инвариант

Stack хранит незавершённые объекты в порядке их открытия; queue выдаёт узлы в порядке добавления.

## 12. Сложность

Операции с концом list и обоими концами deque — O(1) амортизированно; list `pop(0)` — O(n).

## 13. Типичные ошибки

- `pop` из пустого stack;
- не проверить пустоту в конце;
- queue через `pop(0)`;
- потерять порядок при переносе между stacks;
- хранить значения, когда нужны индексы;
- назвать amortized O(1) строгим O(1) для каждой операции.

## 14. Что сказать интервьюеру

> Здесь важен последний незакрытый объект, поэтому stack. После каждого символа stack точно хранит незакрытые элементы префикса. Каждый символ добавляется и удаляется максимум один раз: O(n), память O(n).

## 15. Мини-контрольная

LIFO? FIFO? Queue в Python? Почему `pop(0)` плох? Что хранит stack скобок?

<details><summary>Ответы</summary>
Stack; queue; deque; сдвиг O(n); незакрытые opening brackets.
</details>

## 16. Практика

Обязательные: 20, 1047, 232. Дополнительные: 155, 739 после следующего урока.

## 17. Шпаргалка

Stack = list end. Queue = deque/popleft. Всегда проверяйте пустоту.

## Где это встречается в Data Science

Очереди батчей, streaming-буферы, обход зависимостей, отмена преобразований. Для многопроцессных очередей нужны другие синхронизированные структуры.
