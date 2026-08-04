---
title: "Python Core — шпаргалка"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.python-core-shpargalka
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Python Core — шпаргалка

[[11_Typing_Testing_Code_Quality|← Предыдущий]] · [[01_Big_O|К алгоритмам →]]

| Вопрос | Короткий ответ |
|---|---|
| Имя и объект | присваивание связывает имя с объектом, не копирует |
| `is` / `==` | идентичность / равенство |
| shallow / deep | новый внешний контейнер / рекурсивная копия |
| mutable default | создаётся один раз; используйте `None` |
| list | динамический массив ссылок; index O(1), insert(0) O(n) |
| tuple | неизменяемая последовательность; hashable, если hashable элементы |
| dict/set | O(1) в среднем, O(n) худший случай |
| hash-контракт | `a == b` ⇒ `hash(a) == hash(b)` |
| LEGB | Local → Enclosing → Global → Builtins |
| closure | функция + доступ к внешнему окружению |
| iterable | умеет дать iterator |
| iterator | `__next__` до `StopIteration`, обычно одноразовый |
| generator | ленивый iterator через `yield` |
| `for` | `iter()` + повторный `next()` |
| `len(obj)` | `obj.__len__()` |
| `x in obj` | `__contains__` или fallback к итерации |
| `obj[key]` | `__getitem__` |
| `with obj` | `__enter__` / `__exit__` |
| `__repr__` / `__str__` | разработчик / пользователь |
| `del` | удаляет привязку/элемент, не гарантирует уничтожение объекта |
| GC | reference counting + сборщик циклов в CPython |
| GIL | один поток исполняет Python bytecode; IO/native code могут параллелиться |
| thread/process/async | IO с blocking API / CPU / много async IO |
| `sort` / `sorted` | in-place + `None` / новый список |
| `any` / `all` | short-circuit; `False`/`True` для пустого |

## 30-секундные ответы

- **Generator:** ленивый одноразовый iterator, сохраняющий состояние между `yield`; экономит память, но не даёт `len` и случайный доступ.
- **Hash Map:** hash → позиция, коллизии разрешаются проверкой и другими позициями; O(1) в среднем, ключ hashable.
- **Mutable default:** объект создаётся при определении функции и делится вызовами; использовать `None`.
- **GIL:** ограничивает параллельный Python bytecode в обычном CPython, но не IO, процессы и native вычисления.

## Перед интервью

Проговорите без конспекта: mutable/immutable, `is/==`, shallow/deep, list internals, hashability, LEGB, iterator/generator, 8 dunder-методов, exceptions/context manager, GIL, vectorization.
