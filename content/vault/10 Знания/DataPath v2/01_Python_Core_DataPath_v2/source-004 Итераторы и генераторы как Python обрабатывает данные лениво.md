---
title: "Итераторы и генераторы: как Python обрабатывает данные лениво"
id: concept.datapath-v2.004
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 4
canonical_course: "Python Core"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Итераторы и генераторы

Список:

```python
squares = [x * x for x in range(10_000_000)]
```

создаёт все значения заранее.

Generator expression:

```python
squares = (x * x for x in range(10_000_000))
```

выдаёт значения по мере запроса.

Это **ленивое вычисление (lazy evaluation)**.

## 1. Iterable

Объект, по которому можно начать итерацию:

```python
iter(obj)
```

Examples:
- list
- tuple
- dict
- str
- range

## 2. Iterator

Iterator поддерживает:

```python
next(it)
```

и хранит текущее состояние обхода.

```python
it = iter([10, 20])
next(it)  # 10
next(it)  # 20
next(it)  # StopIteration
```

## 3. Что делает `for`

Conceptually:

```python
it = iter(obj)

while True:
    try:
        item = next(it)
    except StopIteration:
        break
```

Это объясняет протокол итерации.

## 4. Generator function

Функция с `yield`:

```python
def numbers(n):
    for i in range(n):
        yield i
```

Вызов:

```python
g = numbers(3)
```

не выполняет функцию до конца. Создаётся generator object.

Каждый `next(g)` продолжает выполнение до следующего `yield`.

## 5. Generator сохраняет state

Local variables и position кода сохраняются между `yield`.

```python
def counter():
    x = 0
    while True:
        yield x
        x += 1
```

Это state machine без отдельного class.

## 6. Memory

List:
```text
хранит N результатов
```

Generator:
```text
хранит state + текущий элемент
```

Но:
> generator не всегда быстрее по CPU; его преимущество часто memory/streaming.

## 7. One-pass nature

```python
g = (x for x in range(3))
list(g)  # [0,1,2]
list(g)  # []
```

Iterator exhausted.

Если нужно многократно обходить data, нужно заново создать generator или материализовать результат.

## 8. `yield from`

```python
def flatten(parts):
    for part in parts:
        yield from part
```

эквивалентно выдаче элементов nested iterable.

## 9. Pipeline

```python
def read_rows(path):
    with open(path, encoding="utf-8") as file:
        for line in file:
            name, age, x = line.rstrip().split(",")
            yield {"name": name, "age": int(age), "x": float(x)}

def valid(rows):
    for row in rows:
        if row["age"] >= 0:
            yield row

def transform(rows):
    for row in rows:
        yield row["x"] * 2
```

Можно соединять:
```text
disk → validate → transform → aggregate
```
без загрузки всего в memory.

## 10. `range`

`range(1_000_000_000)` не создаёт billion integers list.

Он представляет правило получения элементов.

Это lazy iterable-like object.

## 11. `enumerate`

```python
for i, row in enumerate(rows):
    print(i, row["name"])
```

не нужен manual counter.

## 12. `zip`

```python
for x, y in zip(xs, ys):
    print(x, y)
```

Итерация прекращается по shortest iterable.

Если silent truncation опасна, в современном Python можно использовать:

```python
zip(xs, ys, strict=True)
```

чтобы получить error при разных длинах.

## 13. `itertools`

Useful:
- `chain`
- `islice`
- `product`
- `combinations`

Например:
```python
from itertools import islice
first_100 = list(islice(stream, 100))
```

## 14. Когда generator не нужен

Если:
- dataset small;
- нужно многократно индексировать;
- нужен random access;
- vectorized NumPy/pandas operation проще/быстрее.

Не заменять pandas pipeline generator loops без причины.

## Визуализация DataPath

Показывать список как warehouse всех элементов и generator как conveyor, выдающий по одному.

## Типичные ошибки

- дважды использовать exhausted generator;
- думать, что generator всегда быстрее;
- `zip` silently truncates;
- materialize `list(generator)` и потерять memory benefit.

## Проверка понимания

1. Iterable vs iterator?
2. Что делает `next`?
3. Как `for` использует protocol?
4. Что сохраняет generator?
5. Почему memory lower?
6. Почему generator one-pass?
7. Для чего `yield from`?

## Мини-практика

Напишите generator, который читает integers и выдаёт только квадраты положительных,
не создавая промежуточных списков.

## Итог

Iterator — объект обхода. Generator — удобный способ создать iterator с сохранением состояния.

## Куда дальше

Теперь можно перейти к классам и понять, как Python сам реализует поведение объектов
через специальные методы вроде `__len__`, `__iter__` и `__call__`.
