---
title: "05. Iterable, iterator и generator"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.05-iterable-iterator-i-generator
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 05. Iterable, iterator и generator

[[04_Функции_и_области_видимости|← Предыдущий]] · [[06_OOP_и_магические_методы|Следующий →]]

## Три понятия

- **iterable** — объект, у которого можно запросить iterator через `iter(obj)`;
- **iterator** — объект с `__next__()`, который выдаёт следующий элемент или поднимает `StopIteration`;
- **generator** — удобный способ создать iterator через функцию с `yield` или generator expression.

```python
numbers = [10, 20]       # iterable, но не iterator
iterator = iter(numbers)
assert next(iterator) == 10
assert next(iterator) == 20
# next(iterator) -> StopIteration
```

Список хранит данные и каждый вызов `iter(list)` создаёт новый iterator. Iterator хранит текущую позицию и обычно одноразовый.

## Что делает `for`

Упрощённо:

```python
iterator = iter(iterable)
while True:
    try:
        item = next(iterator)
    except StopIteration:
        break
    process(item)
```

На практике не ловите `StopIteration` внутри generator-функции без необходимости.

## Свой iterator через класс

```python
class Countdown:
    def __init__(self, start: int) -> None:
        self.current = start

    def __iter__(self) -> "Countdown":
        return self

    def __next__(self) -> int:
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value

assert list(Countdown(3)) == [3, 2, 1]
```

Iterator возвращает себя из `__iter__`. Контейнер обычно возвращает новый iterator.

## Generator function и `yield`

Если в функции есть `yield`, вызов создаёт generator и не исполняет тело сразу:

```python
from collections.abc import Iterator

def countdown(start: int) -> Iterator[int]:
    current = start
    while current > 0:
        yield current
        current -= 1
```

`next()` выполняет код до следующего `yield`, возвращает значение и замораживает локальное состояние. `return` завершает generator; значение `return` становится данными `StopIteration`, но обычный `for` их не показывает.

Generator expression:

```python
squares = (value * value for value in range(1_000_000))
```

Он ленивый: считает элемент по запросу, а не создаёт миллион результатов сразу.

## `yield from`

```python
from collections.abc import Iterable, Iterator

def flatten(groups: Iterable[Iterable[int]]) -> Iterator[int]:
    for group in groups:
        yield from group
```

На базовом уровне `yield from iterable` делегирует выдачу элементов другому iterable.

## Потоковое чтение файла

```python
from collections.abc import Iterator
from pathlib import Path

def non_empty_lines(path: Path) -> Iterator[str]:
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            stripped = line.strip()
            if stripped:
                yield stripped
```

Файл остаётся открыт, пока generator активен. Если остановились раньше, закройте generator (`generator.close()`) или спроектируйте внешний `with`.

## Память: список против генератора

```python
import sys

values = [x * x for x in range(100_000)]
lazy_values = (x * x for x in range(100_000))

print(sys.getsizeof(values))
print(sys.getsizeof(lazy_values))
```

`getsizeof` показывает только сам контейнер, не полный граф объектов, но разница иллюстрирует принцип: список хранит ссылки на все результаты, generator — состояние вычисления. Экономия памяти не означает, что generator всегда быстрее.

## Когда generator неудобен

- нужен случайный доступ или `len`;
- данные надо пройти несколько раз;
- вычисление дорого и результаты выгодно кэшировать;
- нужна простая отладка/сериализация;
- ресурс должен закрыться сразу независимо от потребления.

Материализуйте осознанно: `items = list(generator)`.

## Исчерпание

```python
generator = (x * x for x in range(3))
print(list(generator))  # [0, 1, 4]
print(list(generator))  # []

iterable = range(3)
print(list(iterable), list(iterable))  # два полных прохода
```

## Ответы трёх уровней

### За 20 секунд

> Iterable умеет создавать iterator. Iterator хранит позицию и отдаёт элементы через `next` до `StopIteration`. Generator — iterator, удобно создаваемый через `yield`; он ленивый и обычно одноразовый.

### Нормальный ответ

> Список iterable, потому что `iter(list)` возвращает отдельный iterator, но у самого списка нет состояния текущего прохода. Цикл `for` вызывает `iter`, затем `next` до `StopIteration`. Generator сохраняет frame и локальные переменные между `yield`, поэтому вычисляет по одному элементу и экономит память. После исчерпания повторный проход пуст.

### Углублённый ответ

> Протокол iterator состоит из `__iter__`, возвращающего iterator, и `__next__`, поднимающего `StopIteration`. Iterator часто возвращает себя, контейнер — новый iterator. Generator function при вызове создаёт generator object; код выполняется по запросу, состояние приостанавливается в точке `yield`. Ленивость уменьшает пиковую память и поддерживает бесконечные потоки, но лишает случайного доступа и повторного прохода без повторного создания.

## Где это встречается в Data Science

- чтение больших файлов и батчей;
- последовательные ETL-преобразования;
- выдача батчей модели;
- pipeline без хранения всех промежуточных результатов.

## Мини-контрольная

1. Почему list не iterator?
2. Что завершает iterator?
3. Выполняется ли generator function при вызове?
4. Можно ли пройти generator дважды?
5. Чем `return` отличается от `yield`?
6. Когда список предпочтительнее?

<details>
<summary>Ответы</summary>

1. Не хранит позицию прохода и не имеет `__next__`. 2. `StopIteration`. 3. Нет, создаётся объект. 4. Только если создать новый. 5. Завершает против выдаёт и приостанавливает. 6. Повторные проходы, индекс, `len`, кэширование.

</details>
