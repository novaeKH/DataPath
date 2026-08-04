---
title: "09. Память, GC и GIL"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.09-pamiat-gc-i-gil
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 09. Память, GC и GIL

[[08_Декораторы_и_замыкания|← Предыдущий]] · [[10_Python_для_Data_Science|Следующий →]]

## Reference counting и garbage collector

В CPython объект обычно освобождается, когда счётчик сильных ссылок становится нулём. Но циклы могут удерживать друг друга:

```python
a: list[object] = []
b: list[object] = [a]
a.append(b)
```

Циклический garbage collector находит недостижимые циклы. Это дополнение к reference counting, а не его замена.

`del name` удаляет привязку или элемент контейнера; он не обещает уничтожить объект:

```python
items = [1, 2]
alias = items
del items
assert alias == [1, 2]
```

## Stack и heap — интуитивно

Frame вызова функции содержит локальные имена и состояние выполнения; объекты живут в управляемой Python памяти (условно «heap»), а локальные имена ссылаются на них. Не переносите буквально модель C: для интервью достаточно разделять время жизни frame и объектов.

## GIL

Global Interpreter Lock в обычной сборке CPython позволяет в момент времени исполнять Python bytecode только одному потоку процесса. Поэтому несколько threads обычно не ускоряют чистый CPU-bound Python-код.

GIL не означает «параллелизма нет вообще»:

- во время блокирующего IO GIL освобождается;
- C/Fortran-расширения, включая многие операции NumPy, могут освободить GIL;
- разные процессы имеют разные интерпретаторы и GIL;
- в современных версиях Python существуют экспериментальные/free-threaded сборки, но на junior-собеседовании всегда уточняйте, что говорите об обычном CPython.

## Threading, multiprocessing, asyncio

| Инструмент | Лучше для | Модель | Цена |
|---|---|---|---|
| `threading` | IO-bound, блокирующие библиотеки | несколько потоков, общая память | синхронизация и race conditions |
| `multiprocessing` | CPU-bound Python | процессы, отдельная память | сериализация, запуск, копии данных |
| `asyncio` | много конкурентного IO | один event loop, cooperative tasks | библиотеки должны быть async |

CPU-bound: численные циклы, парсинг, тяжёлые преобразования.  
IO-bound: сеть, диск, ожидание БД.

NumPy быстрее не «из-за магии GIL»: вычислительные циклы реализованы в оптимизированном native-коде, используют компактные типизированные массивы, SIMD/BLAS и иногда несколько потоков.

## Ответ за 30 секунд

> CPython в основном управляет жизнью объектов через reference counting, а циклический GC собирает недостижимые циклы. `del` удаляет ссылку, а не обязательно объект. GIL ограничивает одновременное выполнение Python bytecode потоками одного процесса, поэтому threads полезны главным образом для IO. Для CPU-bound Python используют процессы или native-библиотеки. NumPy выполняет тяжёлые циклы вне Python и часто освобождает GIL.

## Мини-контрольная

1. Почему циклам мало reference counting?
2. Уничтожает ли `del` объект?
3. Что обычно выбрать для CPU-bound Python?
4. Почему threads полезны для IO?
5. Почему NumPy может масштабироваться?

<details><summary>Ответы</summary>
1. Ссылки внутри цикла не падают до нуля. 2. Не обязательно. 3. Processes/native code. 4. Поток ждёт, другой работает, GIL освобождается на IO. 5. Native loops/BLAS и освобождение GIL.
</details>
