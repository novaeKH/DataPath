---
title: "Linked List — решения"
type: "solution"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: exclude
tags: ["algorithms/practice", "practice/solutions"]
id: solution.algorithms.linked-list-resheniia
schema_version: 2
language: ru
app: exclude
---
# Linked List — решения

[[09_Linked_List_подсказки|← Подсказки]] · [[10_Trees_и_Grid_решения|Следующий блок →]]

```python
class ListNode:
    def __init__(self, val: int, next_node: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next_node
```

## LC 206 — Reverse Linked List

```python
def reverse_list(head: ListNode | None) -> ListNode | None:
    previous = None
    current = head
    while current is not None:
        next_node = current.next
        current.next = previous
        previous = current
        current = next_node
    return previous
```

O(n), O(1). Инвариант: previous — развёрнутый префикс, current — начало сохранённого суффикса. Главная ошибка — не сохранить next до перезаписи.

## LC 141 — Linked List Cycle

```python
def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

O(n), O(1). Сравниваем идентичность узлов, не значения. Альтернатива set узлов — O(n) память.

## LC 21 — Merge Two Sorted Lists

```python
def merge_two_lists(a: ListNode | None, b: ListNode | None) -> ListNode | None:
    dummy = ListNode(0)
    tail = dummy
    while a is not None and b is not None:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next
    tail.next = a if a is not None else b
    return dummy.next
```

O(n+m), O(1), узлы переиспользуются. Dummy устраняет отдельную инициализацию head.

## LC 876 — Middle of the Linked List

```python
def middle_node(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow
```

O(n), O(1). При чётной длине slow оказывается на втором среднем, как требует условие.
