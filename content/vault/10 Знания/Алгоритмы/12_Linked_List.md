---
title: "12. Linked List"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.12-linked-list
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 12. Linked List

[[11_Heap_и_Top_K|← Предыдущий]] · [[13_Recursion_Backtracking|Следующий →]]

## 1. Цель урока

Безопасно менять ссылки, использовать dummy node и slow/fast.

## 2. Главная идея

Узел хранит значение и ссылку на следующий. Доступ по позиции O(n), вставка после известного узла O(1).

## 3. Как распознать

Узлы `next`, разворот, цикл, середина, слияние списков.

## 4. Когда не подходит

Для случайного доступа нужен array. В Python встроенный list — не linked list.

## 5. Необходимый Python

`None`, классы/typing, временная ссылка перед перезаписью.

## 6. Универсальный узел

```python
class ListNode:
    def __init__(self, value: int, next_node: "ListNode | None" = None) -> None:
        self.val = value
        self.next = next_node
```

## 7. Первая задача: LC 206 Reverse Linked List

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

Инвариант: `previous` — полностью развёрнутый префикс; `current` — начало необработанного суффикса.

## 8. Вторая задача: LC 141

Slow идёт на 1, fast на 2. При цикле встретятся; без цикла fast достигнет `None`.

## 9. Третья задача без решения

LC 21: [[09_Linked_List_задачи#LC 21 — Merge Two Sorted Lists]]. Зачем dummy node?

## 10. Трассировка `1→2→3`

| previous | current | next |
|---|---|---|
| ∅ | 1 | 2 |
| 1→∅ | 2 | 3 |
| 2→1 | 3 | ∅ |

## 11. Инвариант

Развёрнутый префикс не потерян и заканчивается `None`; необработанный суффикс доступен через `current`.

## 12. Сложность

O(n) время, O(1) память итеративно. Рекурсия даёт O(n) stack.

## 13. Типичные ошибки

Потерять `next`; вернуть старую head; не проверить fast.next; сравнивать значения вместо узлов; цикл в результате; путать встроенный list.

## 14. Что сказать интервьюеру

> Перед изменением `current.next` сохраняю следующий узел. `previous` всегда является развёрнутым обработанным префиксом. Каждый узел посещаю один раз: O(n), O(1) памяти.

## 15. Мини-контрольная

Почему сохранить next? Как fast обнаруживает цикл? Цена индекса? Dummy node? Рекурсивная память?

<details><summary>Ответы</summary>
Иначе потеряем хвост; встретит slow; O(n); убирает особый случай головы; O(n).
</details>

## 16. Практика

Обязательные: 206, 141, 21. Дополнительная: 876. Повтор: нарисовать ссылки.

## 17. Шпаргалка

`next=current.next → current.next=prev → prev=current → current=next`.

## Где это встречается в Data Science

Редко как прикладная структура, но тренирует ссылки, mutation и инварианты; эти навыки полезны при работе с графами объектов и pipeline.
