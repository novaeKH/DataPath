---
title: "05. Sliding Window"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.05-sliding-window
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 05. Sliding Window

[[04_Two_Pointers|← Предыдущий]] · [[06_Prefix_Sum|Следующий →]]

## 1. Цель урока

Отличать фиксированное и переменное окно, обновлять состояние без пересчёта и выбирать `while` для восстановления условия.

## 2. Главная идея

Окно — непрерывный фрагмент. При сдвиге добавляем справа и удаляем слева, переиспользуя прежнее состояние.

## 3. Как распознать

«подмассив/подстрока», «непрерывный», максимум/минимум длины, ограничение «не более k», сумма/частоты внутри диапазона.

## 4. Когда не подходит

Если запросы по произвольным диапазонам без единого движения — Prefix Sum. Если отрицательные числа ломают монотонность суммы, окно для «минимальной длины с суммой ≥ target» неприменимо. Подпоследовательность не равна окну.

## 5. Необходимый Python

`range(k, n)`, `enumerate`, set/dict/Counter, два индекса, `while`.

## 6. Универсальные шаблоны

```python
window_sum = sum(nums[:k])
best = window_sum
for right in range(k, len(nums)):
    window_sum += nums[right] - nums[right - k]
    best = max(best, window_sum)
```

```python
left = 0
for right, value in enumerate(nums):
    add(value)
    while violates_condition():
        remove(nums[left])
        left += 1
    update_answer(right - left + 1)
```

## 7. Первая задача: LC 643 Maximum Average Subarray I

```python
def find_max_average(nums: list[int], k: int) -> float:
    if not 1 <= k <= len(nums):
        raise ValueError("k must be between 1 and len(nums)")
    window_sum = sum(nums[:k])
    best_sum = window_sum
    for right in range(k, len(nums)):
        window_sum += nums[right] - nums[right - k]
        best_sum = max(best_sum, window_sum)
    return best_sum / k

assert find_max_average([1, 12, -5, -6, 50, 3], 4) == 12.75
```

Время O(n), память O(1). Brute force с суммой каждого окна — O(nk).

## 8. Вторая задача: LC 3 Longest Substring Without Repeating Characters

Хранить символы текущего окна. При повторе сдвигать `left` в `while`, удаляя слева, пока окно снова уникально. Альтернатива: dict последняя позиция и jump `left`.

## 9. Третья задача без решения

LC 1004: [[03_Sliding_Window_задачи#LC 1004 — Max Consecutive Ones III]]. Что хранится: число нулей или число замен?

## 10. Трассировка LC 3 для `abba`

| right | char | left после восстановления | окно | best |
|---:|---|---:|---|---:|
| 0 | a | 0 | a | 1 |
| 1 | b | 0 | ab | 2 |
| 2 | b | 2 | b | 2 |
| 3 | a | 2 | ba | 2 |

## 11. Инвариант

После `while` текущее окно удовлетворяет ограничению. Для фиксированного окна состояние точно описывает последние k элементов.

## 12. Сложность

O(n), если каждый элемент добавляется и удаляется не более одного раза; память O(1), O(k) или O(алфавит) в зависимости от состояния.

## 13. Типичные ошибки

- пересчитывать сумму окна;
- использовать `if` вместо `while`;
- длина `right-left` вместо `+1`;
- удалить элемент, но не обновить count/set;
- обновить best до восстановления;
- считать любой вложенный while O(n²);
- применить суммовое окно с отрицательными числами без проверки монотонности.

## 14. Что сказать интервьюеру

> Подходит Sliding Window, потому что нужен непрерывный фрагмент и состояние можно обновлять при сдвиге. Расширяю окно справа, а пока ограничение нарушено — сжимаю слева. После цикла окно валидно; каждый элемент входит и выходит не более раза, значит O(n).

## 15. Мини-контрольная

Fixed или variable для LC 643? Зачем `while`? Формула длины? Почему O(n)? Когда сумма с target ломается?

<details><summary>Ответы</summary>
Fixed; нарушение может требовать нескольких удалений; `r-l+1`; оба указателя монотонны; отрицательные числа ломают монотонность.
</details>

## 16. Практика

Обязательные: 643, 3, 1004, 209. Дополнительные: 567, 424. Повтор: 3 через +1/+3/+7.

## 17. Шпаргалка

Непрерывный фрагмент; add right → while invalid remove left → update answer. Не забыть `+1`.

## Где это встречается в Data Science

Rolling-метрики, мониторинг дрейфа, буферы событий. В pandas это `rolling`, но ручной шаблон помогает понимать состояние и streaming-ограничения.
