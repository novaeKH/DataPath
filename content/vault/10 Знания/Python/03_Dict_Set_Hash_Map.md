---
title: "03. Dict, set и Hash Map"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.03-dict-set-i-hash-map
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 03. Dict, set и Hash Map

[[02_List_Tuple_String|← Предыдущий]] · [[04_Функции_и_области_видимости|Следующий →]]

## Модель хеш-таблицы

Hash Map (хеш-таблица) хранит пары ключ → значение. Python `dict` — Hash Map, `set` — Hash Set: он хранит только ключи.

Упрощённый путь поиска:

```text
ключ → hash(ключа) → начальная позиция → проверка кандидата
                                 ↘ при коллизии поиск другой позиции
```

`hash(obj)` возвращает целое хеш-значение. Таблица преобразует его в начальную позицию с учётом текущего размера. Точные детали CPython не нужны для junior-интервью.

## Коллизии

Коллизия — разные ключи претендуют на одну позицию. Python проверяет хеш и равенство ключа, а при конфликте пробует другие позиции (open addressing). Поэтому коллизия не означает потерю элемента.

В среднем таблица остаётся разреженной, и число проверок ограничено: поиск, вставка и удаление — O(1) в среднем. Теоретический худший случай — O(n), если много ключей приводят к длинной последовательности проб или сравнение ключей само дорого.

Когда таблица заполняется, Python выделяет более крупную и перераспределяет записи. Такой resize дорог, но редок; средняя стоимость серии вставок остаётся O(1) на операцию. Load factor — доля заполнения; точный порог — реализационная деталь.

## Hashable-ключ

Ключ должен иметь стабильный хеш во время нахождения в таблице и согласованные `__eq__`/`__hash__`.

- `int`, `str`, `bytes`, `frozenset` обычно hashable;
- `list`, `dict`, `set` не hashable, потому что меняются;
- tuple hashable только если hashable каждый элемент.

```python
hash((1, "a"))       # допустимо
# hash((1, [2, 3]))  # TypeError
```

Главный контракт:

```text
a == b  ⇒  hash(a) == hash(b)
```

Обратное неверно: одинаковый хеш не обязан означать равенство. Если класс переопределяет равенство и остаётся изменяемым, безопаснее не делать его hashable.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class FeatureKey:
    name: str
    version: int
```

`frozen=True` позволяет dataclass с hashable-полями быть безопасным ключом.

## Dict и порядок

Начиная с Python 3.7 сохранение порядка вставки — гарантия языка:

```python
scores = {"cat": 2, "dog": 5}
assert list(scores) == ["cat", "dog"]
```

Итерация по `dict` даёт ключи; `.items()` — пары; `.values()` — значения. Изменять размер словаря во время итерации нельзя.

## Set против dict

| Вопрос | Структура | Пример |
|---|---|---|
| Встречался ли объект? | `set` | дедупликация ID |
| Сколько раз встречался? | `dict[T, int]` | частоты категорий |
| Где встречался? | `dict[T, list[int]]` | значение → позиции |
| С чем связан? | `dict[K, V]` | признак → метаданные |
| Уникальные элементы двух наборов | `set` | пересечение |

## Переносимые шаблоны

### Дедупликация

```python
def unique_in_order(items: list[int]) -> list[int]:
    seen: set[int] = set()
    result: list[int] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result
```

### Частотный словарь

```python
def frequencies(items: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts
```

### Число → индекс

```python
def two_sum(nums: list[int], target: int) -> tuple[int, int] | None:
    index_by_value: dict[int, int] = {}
    for index, value in enumerate(nums):
        need = target - value
        if need in index_by_value:
            return index_by_value[need], index
        index_by_value[value] = index
    return None
```

Проверка идёт до сохранения текущего индекса: так один элемент не используется дважды.

### Значение → список позиций

```python
from collections import defaultdict

def positions(items: list[str]) -> dict[str, list[int]]:
    result: defaultdict[str, list[int]] = defaultdict(list)
    for index, item in enumerate(items):
        result[item].append(index)
    return dict(result)
```

### Группировка

Для анаграмм ключом может быть `tuple` частот или отсортированная строка. Первый даёт O(k) на слово для фиксированного алфавита, второй — O(k log k).

## Почему поиск не «гарантированно O(1)»

O(1) для `dict` и `set` — средняя/амортизированная оценка при качественном распределении хешей. Худший случай O(n). Кроме того, вычисление `hash` и `__eq__` пользовательского ключа может само быть дорогим.

## Как объяснить Hash Map интервьюеру за 30 секунд

> Hash Map хранит ключи в таблице. Хеш-функция превращает ключ в целое число, по которому выбирается начальная позиция. Если разные ключи попали в одну позицию, возникает коллизия; Python проверяет равенство и ищет другую позицию. При нормальном распределении поиск и вставка работают за O(1) в среднем, но в худшем случае могут стать O(n). Ключ должен быть hashable: его хеш не должен меняться, а равные ключи обязаны иметь одинаковый хеш.

## Где это встречается в Data Science

- подсчёт категорий и пропусков;
- группировка записей до pandas;
- индекс объекта по ID;
- дедупликация наблюдений;
- кэширование feature engineering;
- построение inverted index «значение → строки».

## Вопросы с подвохом

```python
d = {True: "bool", 1: "int", 1.0: "float"}
print(d, len(d))
```

`True == 1 == 1.0` и их хеши согласованы, поэтому это одна логическая запись; последнее значение — `"float"`.

```python
class BadKey:
    def __init__(self, value: int) -> None:
        self.value = value

    def __eq__(self, other: object) -> bool:
        return isinstance(other, BadKey) and self.value == other.value

    __hash__ = object.__hash__
```

Здесь равные по `value` объекты могут иметь разные хеши — контракт нарушен.

## Мини-контрольная

1. Что возвращает `hash()`?
2. Почему list нельзя сделать ключом обычного dict?
3. Когда tuple не hashable?
4. Чем Hash Set отличается от Hash Map?
5. Почему две вставки могут иметь разную фактическую стоимость?
6. Должны ли два объекта с одним хешем быть равны?
7. Что хранить для Two Sum?

<details>
<summary>Ответы</summary>

1. Целое хеш-значение. 2. Он изменяем, стабильность нарушается. 3. Если содержит неhashable-элемент. 4. Только ключи против ключ → значение. 5. Resize. 6. Нет. 7. Уже просмотренное значение → индекс.

</details>

Практика: [[01_Hash_Map_и_массивы_задачи]], [[01_Hash_Map_и_массивы_подсказки]], [[01_Hash_Map_и_массивы_решения]].
