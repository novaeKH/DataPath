---
type: source
area: python
status: active
tags: [python, interview]
aliases:
  - Python для собеседований
title: "Python for Interviews"
rag: exclude
id: source.python.python-for-interviews
schema_version: 2
language: ru
app: exclude
---
# Python for Interviews

Быстрое повторение: [[Python and pandas — Interview]]

## 1. Объекты и ссылки

Переменная хранит ссылку на объект. `b = a` не копирует объект. Изменяемые контейнеры могут изменяться через любую ссылку.

```python
a = [[1], [2]]
b = a
b[0].append(9)
# a == [[1, 9], [2]]
```

## 2. Mutable vs immutable

Обычно mutable: `list`, `dict`, `set`. Immutable: `int`, `float`, `str`, `tuple` (но может содержать mutable object).

Неизменяемость важна для hashability и безопасного разделения состояния.

## 3. list, tuple, set, dict

- list: порядок, дубли, изменение, индекс.
- tuple: фиксированная последовательность, hashable только если элементы hashable.
- set: уникальные hashable элементы, быстрый membership.
- dict: mapping ключ→значение, ключ hashable.

Средний lookup `dict/set` — $O(1)$, но худший теоретически $O(n)$.

## 4. Hashability

Hash должен быть стабильным за жизнь объекта; равные объекты имеют одинаковый hash. Mutable list не может быть ключом, потому что изменение нарушило бы bucket lookup.

## 5. `is` vs `==`

- `==` сравнивает значения.
- `is` — идентичность объекта.

`is None` корректен; полагаться на interning малых чисел/строк нельзя.

## 6. Shallow vs deep copy

Shallow copy создаёт новый внешний контейнер, но вложенные объекты общие. `deepcopy` рекурсивно копирует граф объектов и может быть дорогим/неочевидным при custom classes.

## 7. Iterable, iterator, generator

- Iterable умеет вернуть iterator.
- Iterator хранит состояние и реализует `__next__`.
- Generator — iterator, созданный функцией с `yield` или generator expression.

После исчерпания iterator не перезапускается.

## 8. Decorator

Декоратор принимает функцию и возвращает callable с дополнительным поведением. `functools.wraps` сохраняет metadata.

## 9. Context manager

`with` вызывает `__enter__` и гарантирует `__exit__`, даже при exception. Примеры: файл, lock, transaction, `torch.no_grad()`.

## 10. `*args` и `**kwargs`

В объявлении собирают positional/keyword arguments. При вызове `*` и `**` распаковывают iterable/mapping.

## 11. Exceptions

Ловить узкий тип, не скрывать `Exception` без причины, использовать `finally` для cleanup, `raise ... from ...` для цепочки причин.

## 12. Comprehension и lambda

Comprehension удобен для простого преобразования/фильтра, но сложная логика читаемее обычным циклом. `lambda` — одно выражение, не замена большой функции.

## 13. Память на базовом уровне

CPython использует reference counting плюс cyclic garbage collector. Контейнер хранит ссылки. Малые объекты имеют overhead, поэтому NumPy массивы компактнее списков чисел.

## 14. Частые ловушки

### Mutable default

```python
def add(x, bucket=[]):
    bucket.append(x)
    return bucket
```

Default создаётся один раз. Использовать `None`.

### Late binding

```python
funcs = [lambda: i for i in range(3)]
# все читают финальное i
```

Зафиксировать `lambda i=i: i`.

### Aliased lists

```python
grid = [[0] * 3] * 3
```

Строки — ссылки на один список. Использовать comprehension.

### Изменение списка во время итерации

Может пропускать элементы. Создать новый список или итерироваться по копии.

## Связи

- [[Python and pandas — Interview|Быстрое повторение]]
- [[Universal_Pandas_Data_Work_Pipeline]]
- [[01 Вопросы — Python и pandas]]

