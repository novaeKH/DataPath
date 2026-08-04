---
type: interview
area: career
status: active
tags: [interview, python, pandas]
title: "Python and pandas — Interview"
id: interview.career.python-and-pandas-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Python and pandas — Interview

Полная теория: [[Python for Interviews]], [[Universal_Pandas_Data_Work_Pipeline]]  
Банк вопросов: [[Вопросы к собеседованию#12 Python]], [[Вопросы к собеседованию#13 pandas]]

## Mutable vs immutable

`list`, `dict`, `set` изменяемы; `int`, `float`, `str`, `tuple` неизменяемы, хотя tuple может содержать mutable object. Assignment привязывает имя к объекту, а не копирует его. Это объясняет aliasing и опасность mutable defaults.

## list vs tuple vs set vs dict

List — упорядоченная изменяемая последовательность, tuple — неизменяемая. Set хранит уникальные hashable элементы и даёт средний O(1) membership. Dict сопоставляет hashable key со value и сохраняет порядок вставки в современном Python.

## Что такое hashability?

Hashable object имеет стабильный hash и согласованное equality на протяжении жизни, поэтому может быть key dict или элементом set. Mutable list не hashable; tuple hashable только если hashable все элементы.

## `is` vs `==`

`==` сравнивает значения, `is` — identity одного объекта. `is` корректно применять к singleton, прежде всего `x is None`; сравнивать им числа и строки нельзя, даже если interning иногда маскирует ошибку.

## Shallow vs deep copy

Shallow copy создаёт новый внешний container, но вложенные объекты общие. Deep copy рекурсивно копирует graph объектов и может быть дорогим или семантически неверным для ресурсов. Перед копированием уточняю, какие уровни должны быть независимы.

## Iterable, iterator и generator

Iterable отдаёт iterator через `iter`. Iterator хранит состояние и возвращает элементы через `next` до `StopIteration`. Generator — удобный iterator, созданный `yield`; вычисляет элементы лениво и экономит память.

## Что такое decorator?

Функция, принимающая callable и возвращающая wrapped callable; применяется синтаксисом `@`. Используется для logging, timing, authorization, caching. `functools.wraps` сохраняет имя и metadata исходной функции.

## Что такое context manager?

Объект с `__enter__/__exit__` или функция `@contextmanager`, гарантирующая cleanup даже при exception. Типичный пример — файл, lock, transaction; эквивалентная идея — `try/finally`.

## `*args` и `**kwargs`

В объявлении собирают лишние positional args в tuple и keyword args в dict; в вызове распаковывают iterable/mapping. Явная сигнатура предпочтительнее, а passthrough kwargs требует аккуратного контракта.

## Как обрабатывать exceptions?

Ловить наиболее конкретные типы, не скрывать traceback пустым `except`, cleanup помещать в `finally` или context manager. Exception — часть контракта; после logging его либо осмысленно преобразуют через `raise ... from ...`, либо пробрасывают.

## Comprehension и lambda

Comprehension компактно строит list/set/dict, но сложную вложенную логику лучше вынести в именованную функцию. Lambda — короткая expression-функция; удобна как key, но не заменяет читаемый `def` и подвержена late binding в closures.

## Что происходит с памятью объектов Python?

Имя хранит ссылку на heap object; assignment не копирует. CPython в основном использует reference counting плюс cyclic garbage collector. Containers хранят ссылки, поэтому `sys.getsizeof` не показывает полный размер вложенного graph.

## Почему mutable default опасен?

Default вычисляется один раз при создании функции, поэтому список переиспользуется между вызовами. Пишут `arg=None`, затем создают новый объект внутри. Иногда общий cache намерен, но его нужно назвать явно.

## Что выведет `[[0]*3]*2` после изменения одного элемента?

Обе строки ссылаются на один внутренний list, поэтому изменение одной позиции видно в обеих. Независимая матрица: `[[0 for _ in range(3)] for _ in range(2)]`.

## Почему late binding ломает lambda в цикле?

Closure хранит ссылку на переменную, а не её значение в момент создания; все lambda увидят финальное значение. Зафиксировать можно default argument: `lambda x, i=i: x+i`.

## Как начать анализ DataFrame?

Проверяю grain, shape, sample, dtypes, missing, duplicates, cardinality, ranges и ключи. Затем формулирую инварианты и только после этого преобразую. См. полный контрольный pipeline в [[Universal_Pandas_Data_Work_Pipeline]].

## `groupby().agg()` vs `transform()`

`agg` уменьшает число строк до группы. `transform` возвращает результат исходной длины и позволяет добавить group statistic к каждой строке. Если результат должен присоединиться к исходным объектам без merge, часто нужен `transform`.

## Почему merge размножает строки?

Если key не уникален с обеих сторон, получается many-to-many: число комбинаций умножается. До merge проверяю uniqueness и ожидаемую cardinality, после — количество строк и unmatched keys; в pandas использую `validate='one_to_one'` и аналоги.

## Как искать дубли?

Сначала определяю business key и grain, затем `duplicated(key, keep=False)` и сортирую группы для анализа. Полные одинаковые строки — лишь частный случай; удалять дубли без понимания причины опасно.

## Как обрабатывать missing values в pandas?

Считаю доли по столбцам и сегментам, проверяю смысл пропуска. Для модели imputation fit только на train; для анализа не заменяю NaN на 0 без основания. Помню, что агрегаты часто игнорируют NaN, а merge не равен SQL по всем corner cases.

## Как работать с datetime?

Явно `pd.to_datetime(..., errors='coerce', utc=...)`, затем проверка timezone, диапазона и NaT. Для time features учитываю cutoff и не использую будущее; сортировка обязательна перед lag/rolling.

## Как делать filtering и sort?

Для нескольких условий нужны скобки и `&`/`|`, а не Python `and/or`; NaN обрабатываются явно. `sort_values` с несколькими keys и стабильным tie-breaker нужен перед `drop_duplicates`, lag и rolling, иначе результат неоднозначен.

## Что такое pivot table?

`pivot` требует уникальной пары index/columns и только reshapes. `pivot_table` умеет агрегировать дубли через `aggfunc`, поэтому надо явно назвать смысл aggregation и `fill_value`; иначе можно скрыть проблему grain.

## Как посчитать rolling feature без leakage?

Сначала сортировать внутри entity по времени, затем сдвинуть историю `shift(1)` и только потом rolling/expanding. Граница окна должна соответствовать доступным данным. Результат проверяется вручную на одном пользователе.

## Как написать пользовательскую агрегацию?

Предпочитаю vectorized named aggregation. `apply` использую, когда форма или логика действительно сложная, потому что он медленнее и менее предсказуем. Всегда фиксирую grain результата и имена столбцов.

## Как посчитать признаки пользователя по транзакциям?

Фиксирую cutoff и groupby user только по past rows: count, nunique merchants, sum/mean/std amount, recency, rolling windows и category shares. Затем проверяю одну строку вручную, join cardinality и отсутствие future data; mappings/statistics строятся внутри fold.
