---
title: "06. OOP и магические методы"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.06-oop-i-magicheskie-metody
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 06. OOP и магические методы

[[05_Iterable_Iterator_Generator|← Предыдущий]] · [[07_Исключения_и_Context_Manager|Следующий →]]

## Базовая модель

Класс описывает поведение и структуру, экземпляр — конкретный объект. `self` — обычный параметр, в который при вызове `obj.method()` Python передаёт `obj`.

```python
from dataclasses import dataclass

@dataclass
class Batch:
    values: list[float]       # атрибут экземпляра
    label: str = "train"

    source = "local"          # атрибут класса
```

Ищется сначала атрибут экземпляра, затем класса и базовых классов. Изменяемый атрибут класса часто становится случайно общим состоянием.

## Наследование и композиция

- наследование: `Dog` — это `Animal`;
- композиция: `Pipeline` содержит `Transformer`.

Композиция обычно проще, если нужна замена компонентов, а не отношение «является». Полиморфизм в Python часто основан на поведении: объект подходит, если поддерживает нужный протокол (duck typing).

MRO — порядок, в котором Python ищет методы в иерархии. `Class.mro()` его показывает. `super()` продолжает поиск по MRO, а не просто означает «вызвать родителя».

```python
class BaseTransformer:
    def transform(self, value: float) -> float:
        return value

class Scaler(BaseTransformer):
    def __init__(self, factor: float) -> None:
        self.factor = factor

    def transform(self, value: float) -> float:
        base = super().transform(value)
        return base * self.factor
```

## `classmethod`, `staticmethod`, `property`

```python
class Threshold:
    def __init__(self, value: float) -> None:
        self._value = value

    @classmethod
    def from_percent(cls, percent: float) -> "Threshold":
        return cls(percent / 100)

    @staticmethod
    def is_valid(value: float) -> bool:
        return 0 <= value <= 1

    @property
    def value(self) -> float:
        return self._value
```

- `classmethod` получает класс и удобен для альтернативного конструктора;
- `staticmethod` логически относится к классу, но не использует класс/экземпляр;
- `property` сохраняет интерфейс атрибута, добавляя вычисление или проверку.

## Один класс, много dunder-протоколов

```python
from collections.abc import Iterator

class FeatureVector:
    def __init__(self, values: list[float]) -> None:
        self._values = list(values)
        self._position = 0

    def __repr__(self) -> str:
        return f"FeatureVector(values={self._values!r})"

    def __str__(self) -> str:
        return f"vector[{len(self)}]"

    def __len__(self) -> int:
        return len(self._values)

    def __getitem__(self, index: int) -> float:
        return self._values[index]

    def __setitem__(self, index: int, value: float) -> None:
        self._values[index] = value

    def __contains__(self, value: object) -> bool:
        return value in self._values

    def __iter__(self) -> Iterator[float]:
        return iter(self._values)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, FeatureVector):
            return NotImplemented
        return self._values == other._values

    def __lt__(self, other: "FeatureVector") -> bool:
        return len(self) < len(other)

    def __call__(self, scale: float) -> list[float]:
        return [value * scale for value in self]
```

Какая конструкция обслуживается:

| Синтаксис | Метод |
|---|---|
| `FeatureVector(values)` | `__new__`, затем `__init__` |
| `repr(obj)` | `__repr__` |
| `str(obj)`, `print(obj)` | `__str__` |
| `len(obj)` | `__len__` |
| `obj[key]` / `obj[key] = x` | `__getitem__` / `__setitem__` |
| `x in obj` | `__contains__` или fallback к итерации |
| `iter(obj)` | `__iter__` |
| `next(iterator)` | `__next__` |
| `a == b`, `a < b` | `__eq__`, `__lt__` |
| `hash(obj)` | `__hash__` |
| `obj()` | `__call__` |
| `with obj` | `__enter__`, `__exit__` |

`__new__` создаёт экземпляр, `__init__` инициализирует уже созданный. На junior-уровне `__new__` нужен в основном для неизменяемых типов и контроля создания.

### `__repr__` против `__str__`

`repr` — точное, полезное разработчику представление; по возможности однозначное. `str` — человекочитаемое. Если `__str__` нет, используется `__repr__`.

### Равенство и хеш

Если изменяемый `FeatureVector` сравнивается по `_values`, делать его ключом опасно: значения поменяются, а место в таблице — нет. Поэтому Python обычно устанавливает `__hash__ = None`, когда определён `__eq__`.

Для неизменяемого value object:

```python
@dataclass(frozen=True)
class ModelKey:
    name: str
    version: int
```

## Context manager как класс

```python
class Timer:
    def __enter__(self) -> "Timer":
        from time import perf_counter
        self.started = perf_counter()
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        from time import perf_counter
        self.elapsed = perf_counter() - self.started
        return False  # исключение не подавляем
```

Подробнее: [[07_Исключения_и_Context_Manager]].

## Где OOP полезно в ML

- sklearn-совместимые transformer/estimator;
- конфигурации и неизменяемые ключи экспериментов;
- интерфейс источников данных;
- композиция pipeline;
- объект модели с методами `fit`, `predict`, `save`.

Не превращайте каждую функцию в класс. Если нет состояния, жизненного цикла или полиморфизма, функция часто проще.

## Что сказать интервьюеру

> Dunder-методы связывают пользовательский класс с протоколами Python: `len` вызывает `__len__`, индекс — `__getitem__`, `for` — `__iter__`, вызов объекта — `__call__`, а `with` — `__enter__`/`__exit__`. Наследование задаёт отношение «является», композиция — «содержит». `super` продолжает поиск по MRO. Для value objects удобно использовать frozen dataclass.

## Мини-контрольная

1. Чем атрибут класса отличается от атрибута экземпляра?
2. Что получает `classmethod`?
3. Почему `super()` связан с MRO?
4. Что вернуть из `__eq__` для неизвестного типа?
5. Почему изменяемый объект опасен как ключ?
6. Какая конструкция вызывает `__contains__`?

<details>
<summary>Ответы</summary>

1. Общий fallback на классе против значения в экземпляре. 2. `cls`. 3. Продолжает кооперативный поиск. 4. `NotImplemented`. 5. Хеш/равенство могут измениться. 6. `x in obj`.

</details>
