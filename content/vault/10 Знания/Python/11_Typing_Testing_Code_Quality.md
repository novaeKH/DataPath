---
title: "11. Typing, testing и качество кода"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.11-typing-testing-i-kachestvo-koda
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 11. Typing, testing и качество кода

[[10_Python_для_Data_Science|← Предыдущий]] · [[Python_Core_Шпаргалка|Шпаргалка →]]

## Type hints как контракт

```python
from collections.abc import Iterable, Sequence
from typing import TypeVar

T = TypeVar("T")

def first(items: Sequence[T]) -> T:
    if not items:
        raise ValueError("items must not be empty")
    return items[0]
```

Принимайте наиболее общий интерфейс, который нужен функции (`Iterable`, `Sequence`, `Mapping`), а возвращайте конкретный тип. Не пишите `list`, если нужна только итерация.

`Any` отключает существенную часть проверки. Для внешних JSON-данных используйте валидацию, а не одно type assertion.

## Простые тесты

```python
def normalize_minmax(values: list[float]) -> list[float]:
    if not values:
        return []
    low, high = min(values), max(values)
    if low == high:
        return [0.0] * len(values)
    return [(value - low) / (high - low) for value in values]

assert normalize_minmax([]) == []
assert normalize_minmax([5.0]) == [0.0]
assert normalize_minmax([0.0, 10.0]) == [0.0, 1.0]
```

Для float используйте `math.isclose`/`pytest.approx`, а не точное сравнение сложных вычислений.

## Что тестировать в алгоритме

- минимальный вход;
- обычный пример;
- дубликаты;
- уже отсортированный/обратный порядок;
- ответа нет;
- ответ на границе;
- отрицательные числа, если разрешены;
- вход не изменён, если контракт это обещает.

## Читаемость

- имя описывает роль: `left`, `right`, `count_by_value`;
- функция делает одну вещь;
- инвариант можно увидеть в структуре цикла;
- комментарий объясняет «почему»;
- не оптимизируйте до измерения, но сразу избегайте асимптотически плохой структуры;
- не скрывайте исключения.

## Code review алгоритмического решения

1. Контракт и edge cases.
2. Корректность инварианта.
3. Границы и termination.
4. Фактическая, а не заявленная сложность.
5. Побочные эффекты.
6. Имена и типы.
7. Тесты, способные опровергнуть решение.

Практика: [[Code_Review_задачи]].

## Мини-контрольная

1. Проверяет ли Python аннотации автоматически?
2. Когда принимать `Iterable`, а когда `Sequence`?
3. Почему одного happy-path теста мало?
4. Как сравнивать float?
5. Чем комментарий «увеличиваем i» плох?

<details><summary>Ответы</summary>
1. Нет. 2. Только проход против индекса/len/повторного доступа. 3. Не ловит границы и неверный инвариант. 4. С допуском. 5. Пересказывает код, не объясняет причину.
</details>
