---
title: "10. Intervals"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.10-intervals
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 10. Intervals

[[09_Monotonic_Stack|← Предыдущий]] · [[11_Heap_и_Top_K|Следующий →]]

## 1. Цель урока

Сортировать интервалы и поддерживать объединённый хвост.

## 2. Главная идея

После сортировки по началу новый интервал может пересекаться только с последним уже объединённым интервалом.

## 3. Как распознать

Встречи, временные диапазоны, перекрытия, объединить/вставить расписание.

## 4. Когда не подходит

Нужно обрабатывать динамический поток с удалениями → специализированная структура. Нужны только события начала/конца → sweep line может быть проще.

## 5. Необходимый Python

`sorted(intervals, key=lambda x: x[0])`, unpacking, работа с последним элементом.

## 6. Универсальный шаблон

```python
for start, end in sorted(intervals):
    if not merged or start > merged[-1][1]:
        merged.append([start, end])
    else:
        merged[-1][1] = max(merged[-1][1], end)
```

## 7. Первая задача: LC 56 Merge Intervals

```python
def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    merged: list[list[int]] = []
    for start, end in sorted(intervals):
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return merged

assert merge_intervals([[1, 3], [2, 6], [8, 10]]) == [[1, 6], [8, 10]]
```

## 8. Вторая задача: LC 57 Insert Interval

Добавить интервалы до нового, объединить пересекающиеся, затем добавить хвост. Вход уже отсортирован и непересекающийся.

## 9. Третья задача без решения

LC 252 / локальный Meeting Rooms: [[08_Intervals_задачи#LC 252 — Meeting Rooms]]. Нужно ли объединять?

## 10. Трассировка

| interval | merged до | действие |
|---|---|---|
| [1,3] | [] | append |
| `[2,6]` | `[[1,3]]` | extend end до 6 |
| `[8,10]` | `[[1,6]]` | append |

## 11. Инвариант

`merged` отсортирован, внутри нет пересечений, и он точно покрывает обработанные интервалы.

## 12. Сложность

O(n log n) из-за сортировки, проход O(n), память O(n) результата/копии сортировки.

## 13. Типичные ошибки

Не сортировать; неверно считать касание; обновлять end значением вместо max; менять вход; забыть пустой список; путать closed/open intervals.

## 14. Что сказать интервьюеру

> Сортирую по началу. После этого достаточно сравнивать новый интервал с последним объединённым: если начало позже его конца — добавляю, иначе расширяю конец. Сортировка O(n log n), проход O(n).

## 15. Мини-контрольная

Зачем сортировка? Какая часть инварианта? Что при `[1,2]` и `[2,3]`? Цена? Когда sweep line?

<details><summary>Ответы</summary>
Локализует пересечение; merged покрывает префикс; зависит от трактовки границ, в LC56 объединяются; O(n log n); число одновременных событий.
</details>

## 16. Практика

Обязательные: 56, локальный 252. Дополнительные: 57. Повтор: нарисовать интервалы.

## 17. Шпаргалка

Sort by start → compare with last end → append or extend max end.

## Где это встречается в Data Science

Объединение окон разметки, временных сегментов, интервалов аномалий.
