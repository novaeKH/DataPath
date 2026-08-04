---
title: "Linked List — задачи без решений"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/tasks"]
id: practice.algorithms.linked-list-zadachi-bez-reshenii
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Linked List — задачи без решений

[[00_Каталог_задач|← Каталог]] · [[09_Linked_List_подсказки|Подсказки]]

```python
class ListNode:
    def __init__(self, val: int, next_node: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next_node
```

Каждая карточка содержит уровень, полное условие, входные данные, ожидаемый результат, примеры, ограничения и сигнатуру.

## LC 206 — Reverse Linked List

**Сложность:** Easy

**Условие:** Разверните односвязный список.

**Дано:** Голова односвязного списка `head` или `None`.

**Нужно вернуть:** Новую голову списка с обратным направлением всех ссылок.

**Примеры:** `1→2→3 → 3→2→1`; пустой остаётся пустым.

**Ограничения:** желательны O(n) время, O(1) память.

**Сигнатура:**

```python
def reverse_list(head: ListNode | None) -> ListNode | None:
    raise NotImplementedError
```

**Моё решение:**

```python

```

## LC 141 — Linked List Cycle

**Сложность:** Easy

**Условие:** Определите, есть ли цикл, не изменяя узлы.

**Дано:** Голова односвязного списка `head`; хвост может ссылаться на один из предыдущих узлов.

**Нужно вернуть:** `True`, если список содержит цикл, иначе `False`.

**Примеры:** `3→2→0→-4`, где хвост ведёт к узлу `2`, → `True`; `1→2→None → False`.

**Ограничения:** O(1) дополнительной памяти — целевой вариант.

**Сигнатура:**

```python
def has_cycle(head: ListNode | None) -> bool:
    raise NotImplementedError
```

**Перед кодом:** что происходит с расстоянием между slow и fast внутри цикла?

**Моё решение:**

```python

```

## LC 21 — Merge Two Sorted Lists

**Сложность:** Easy

**Условие:** Слейте два отсортированных связных списка.

**Дано:** Головы двух отсортированных односвязных списков `a` и `b`.

**Нужно вернуть:** Голову одного отсортированного списка, содержащего все исходные узлы.

**Примеры:** `1→2→4` и `1→3→4` → `1→1→2→3→4→4`.

**Ограничения:** Оба списка отсортированы по неубыванию; любой из них может быть пустым.

**Сигнатура:**

```python
def merge_two_lists(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    raise NotImplementedError
```

**Перед кодом:** как dummy node убирает особый случай головы?

**Моё решение:**

```python

```

## LC 876 — Middle of the Linked List

**Сложность:** Easy

**Условие:** Верните средний узел; при двух средних — второй.

**Дано:** Голова непустого односвязного списка `head`.

**Нужно вернуть:** Средний узел; при чётной длине — второй из двух средних.

**Примеры:** `1→2→3→4→5→6 → узел 4`.

**Ограничения:** В оригинале список непустой; при двух средних требуется вернуть второй.

**Сигнатура:**

```python
def middle_node(head: ListNode | None) -> ListNode | None:
    raise NotImplementedError
```

**Перед кодом:** сколько шагов делают slow и fast?

**Моё решение:**

```python

```
