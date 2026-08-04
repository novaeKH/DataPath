---
title: "Code Review — задачи"
type: "interview"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["interview/python-algorithms"]
id: interview.python.code-review-zadachi
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Code Review — задачи

[[Алгоритмические_вопросы|← Вопросы]] · [[Code_Review_ответы|Ответы →]]

Сначала ответьте: что неверно, на каком входе проявится, как исправить, какова фактическая сложность? Ответы намеренно в отдельном файле.

## CR 1 — Mutable default

```python
def add_feature(name: str, features: list[str] = []) -> list[str]:
    features.append(name)
    return features
```

Что произойдёт при двух независимых вызовах?

## CR 2 — `is` вместо `==`

```python
def is_target(label: str) -> bool:
    return label is "positive"
```

Почему тест может случайно пройти?

## CR 3 — Изменение списка во время обхода

```python
def drop_missing(values: list[float | None]) -> list[float]:
    for value in values:
        if value is None:
            values.remove(value)
    return values
```

Какой вход покажет пропущенный элемент?

## CR 4 — Shallow copy

```python
train = [[1, 2], [3, 4]]
validation = train.copy()
validation[0].append(99)
```

Что стало с train?

## CR 5 — Потерянный `return`

```python
def accuracy(correct: int, total: int) -> float:
    if total == 0:
        return 0.0
    correct / total
```

Каков результат для `accuracy(8, 10)`?

## CR 6 — Граница цикла

```python
def adjacent_pairs(values: list[int]) -> list[tuple[int, int]]:
    return [(values[i], values[i + 1]) for i in range(len(values))]
```

Где ошибка?

## CR 7 — Бесконечный `while`

```python
left = 0
while left < len(values):
    if values[left] < 0:
        left += 1
```

На каком значении цикл застрянет?

## CR 8 — `right - left`

```python
best = max(best, right - left)
```

Если обе границы включены, что неверно?

## CR 9 — Неверное обновление окна

```python
for right in range(k, len(nums)):
    window_sum += nums[right]
    best = max(best, window_sum)
```

Что забыто?

## CR 10 — `if` вместо `while`

```python
if zero_count > k:
    zero_count -= nums[left] == 0
    left += 1
```

Почему одного шага может быть мало в общем variable window?

## CR 11 — Неверная сложность

```python
def duplicate(nums: list[int]) -> bool:
    seen: list[int] = []
    for num in nums:
        if num in seen:
            return True
        seen.append(num)
    return False
```

Почему это не O(n)?

## CR 12 — List вместо set

```python
unique = []
for user_id in user_ids:
    if user_id not in unique:
        unique.append(user_id)
```

Как сохранить порядок и улучшить среднюю сложность?

## CR 13 — Исчерпанный generator

```python
rows = (parse(line) for line in stream)
valid_count = sum(is_valid(row) for row in rows)
saved = list(rows)
```

Почему `saved` пуст?

## CR 14 — Late binding

```python
scorers = [lambda value: value * weight for weight in (1, 2, 3)]
```

Что вернут все функции для value 10?

## CR 15 — Неверный `__hash__`

```python
class Key:
    def __init__(self, value: int) -> None:
        self.value = value

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Key) and self.value == other.value

    __hash__ = object.__hash__
```

Какой контракт нарушен?

## CR 16 — Рекурсия без базы

```python
def depth(node: TreeNode) -> int:
    return 1 + max(depth(node.left), depth(node.right))
```

Что произойдёт на листе?

## CR 17 — Изменение dict во время обхода

```python
for key, value in metrics.items():
    if value is None:
        del metrics[key]
```

Как исправить?

## CR 18 — `sort()` и `sorted()`

```python
def choose_model(models: list[Model]) -> Model:
    ranked = models.sort(key=lambda model: model.score)
    return ranked[0]
```

Какие две проблемы возможны?

## CR 19 — `append()` и `extend()`

```python
columns = ["age", "income"]
columns.append(["country", "device"])
```

Какой стала структура и что ожидал автор?

После ответа откройте [[Code_Review_ответы]].
