---
title: "Память, garbage collection и GIL — что нужно Data Scientist"
id: concept.datapath-v2.008
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 8
canonical_course: "Python Core"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Память, GC и GIL

Почему:
```python
df.copy()
```
иногда удваивает memory?

Почему Python thread не ускоряет CPU-heavy loop?

Почему NumPy nevertheless может использовать несколько CPU cores?

Нужна базовая модель runtime, но без погружения в CPython internals ради internals.

## 1. Objects consume memory

Python `int` — не raw 8-byte C integer. Это полноценный object с metadata.

List хранит ссылки на Python objects.

Поэтому:
```python
[1, 2, 3]
```
намного тяжелее плотного NumPy `int64` array.

Это одна из причин NumPy эффективнее для numeric data.

## 2. Reference counting

CPython в основном отслеживает количество ссылок на object.

Когда refcount становится 0, object можно освободить.

```python
x = [1,2]
y = x
del x
```

Object всё ещё нужен через `y`.

После:
```python
del y
```
ссылок нет.

## 3. Cycles

```python
a = []
a.append(a)
```

Object ссылается сам на себя.

Refcount alone не станет 0.

CPython имеет cyclic garbage collector для таких reference cycles.

## 4. `gc` module

Можно inspect/control GC через `gc`, но обычному DS редко нужно вручную вызывать collection.

Если memory leak, сначала ищите:
- retained references;
- growing caches;
- DataFrame copies;
- lists of predictions/logs.

Не начинайте с `gc.collect()` как универсального fix.

## 5. Why deleting variable may not reduce OS memory immediately

```python
del df
```

удаляет reference, но:
- other references may remain;
- Python allocator may keep memory for reuse;
- library allocator/native buffers may behave differently.

`del` не гарантирует мгновенное падение RSS процесса.

## 6. Copies

Pandas/NumPy operations can create copies.

```python
b = a.copy()
```

explicit.

Но некоторые operations may return view or copy depending API.

Need understand specific library semantics.

## 7. NumPy density

Million Python floats in list:
- million Python objects;
- million references.

NumPy:
```text
one ndarray object
+ contiguous numeric buffer
```

much more memory-efficient.

## 8. GIL

**Global Interpreter Lock (GIL)** in standard CPython traditionally allows only one thread at a time to execute Python bytecode within a process.

Therefore CPU-bound pure-Python loop:
```text
2 threads
```
usually doesn't scale to 2 CPU cores.

## 9. Threads still useful

If thread waits:
- network;
- disk;
- DB,

GIL can be released while blocked, and other threads progress.

So I/O-bound concurrency can benefit.

## 10. Native libraries

NumPy, BLAS, PyTorch, scikit-learn compiled kernels may release GIL and use native parallelism.

Thus:
> "Python has GIL" does not mean "NumPy can only use one core."

Pure Python bytecode and native numerical kernels differ.

## 11. Multiprocessing

Separate processes:
- separate Python interpreters;
- separate GILs.

Good for CPU-bound Python tasks.

Costs:
- process startup;
- serialization;
- duplicated memory;
- inter-process communication.

## 12. Joblib / sklearn

Some sklearn algorithms parallelize through joblib and `n_jobs`.

But nested parallelism can oversubscribe:
```text
CV processes × BLAS threads
```
→ too many threads, slower than expected.

More parallelism isn't automatically faster.

## 13. Memory sharing multiprocessing

Fork-like systems may initially share pages copy-on-write, but behavior platform-specific and writes duplicate memory.

macOS/Windows process start details differ.

For portable mental model:
> separate processes can substantially increase memory.

## 14. Asyncio

`asyncio` is for cooperative I/O concurrency, not automatic CPU parallel ML training.

Use:
- network clients;
- many waiting operations.

Not:
```text
speed up pandas loop
```

## 15. Profiling

Before optimizing:
- measure time;
- measure memory.

Tools:
```text
time.perf_counter
cProfile
line_profiler
memory_profiler/tracemalloc
```

Exact choice project-specific.

## 16. `tracemalloc`

Tracks Python memory allocations.

Useful to compare snapshots and find growing allocation lines, though native library buffers may not all appear as Python allocations.

## 17. Common DS memory mistakes

- keep raw + five transformed DataFrames;
- convert sparse matrix to dense;
- `.tolist()` huge ndarray;
- `pd.concat` repeatedly in loop;
- cache all batches;
- duplicate GPU tensors.

## 18. Better patterns

- process chunks;
- vectorize;
- use appropriate dtype;
- sparse representations;
- generators for streams;
- delete references when truly no longer needed;
- avoid copies.

## 19. Complexity meets memory

Algorithm can be O(n) time but O(n) extra memory.

Example:
```python
return list(groups.values())
```
creates output list references proportional to number groups.

Always state:
```text
time
extra memory
```

## Сквозной разбор: почему процесс занял всю память

Список из миллионов Python-чисел хранит не только значения, но и ссылки на отдельные объекты. Массив NumPy фиксированного `dtype` размещает значения плотнее. При преобразовании данных дополнительную память могут занимать исходный объект, копия и временный результат одновременно, поэтому пик важнее размера финального массива.

Удаление имени уменьшает число ссылок, но объект освобождается только когда ссылок больше нет. Циклы может обнаружить сборщик мусора, а аллокатор Python или нативной библиотеки не обязан сразу возвращать память операционной системе. Поэтому изменение RSS после `del` нельзя интерпретировать как единственный тест утечки.

GIL ограничивает одновременное выполнение Python-байткода потоками одного процесса, но поток полезен при ожидании сети или диска, а NumPy может выполнять нативный код с освобождением GIL. Для чистого CPU-кода используют процессы или векторизованные библиотеки, учитывая сериализацию и копирование памяти.

Диагностика начинается с измерения: профилируют время и память, проверяют размер промежуточных объектов и число параллельных работников. Часто лучше читать данные чанками, выбрать компактный `dtype` и убрать вложенный параллелизм, чем просто добавить ещё процессов.

## Визуализация DataPath

Show list of Python floats vs NumPy contiguous buffer, and threads:
```text
pure Python → one bytecode executor
native kernel → multiple native threads
```

## Типичные ошибки

- "GIL means no parallelism anywhere";
- `gc.collect()` as leak solution;
- `del` expected to immediately return RSS;
- multiprocessing without considering serialization/memory;
- nested oversubscription;
- dense conversion of sparse text.

## Проверка понимания

1. Why Python list of floats heavy?
2. Reference counting?
3. Why cycle needs GC?
4. Why `del` may not lower RSS?
5. What GIL restricts?
6. Why NumPy can still parallelize?
7. Threads vs processes?
8. Why async not CPU speedup?

## Мини-практика

For each task choose:
- thread;
- process;
- vectorized NumPy;
- async.

Tasks:
1. 10k HTTP requests;
2. pure Python prime calculation;
3. matrix multiplication;
4. reading many files.

## Итог блока Python

Теперь Python Core связан в одну модель:

```text
objects
→ collections
→ functions
→ iteration
→ objects/protocols
→ reliability
→ tests
→ runtime/memory
```

## Куда дальше

Следующий блок — NumPy, pandas и EDA: как Python становится инструментом реального анализа данных.
