---
title: NumPy Foundations
id: concept.numpy.foundations
type: concept
area: numpy
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Основы NumPy
- ndarray
tags:
- numpy/core
- data/numerical
---

# NumPy Foundations

## Зачем NumPy

Python-список хранит ссылки на отдельные объекты. `numpy.ndarray` хранит однородные значения плотным блоком памяти и выполняет численные операции в оптимизированном нативном коде. Поэтому NumPy является фундаментом pandas, scikit-learn и многих библиотек ML.

## Создание массива

```python
import numpy as np

values = np.array([1, 2, 3], dtype=np.float64)
zeros = np.zeros((2, 3))
ones = np.ones((2, 3), dtype=np.int32)
grid = np.arange(0, 10, 2)
line = np.linspace(0.0, 1.0, 5)
```

Основные свойства:

```python
values.ndim   # число осей
values.shape  # длина каждой оси
values.size   # число элементов
values.dtype  # тип элементов
```

## Shape и оси

```python
matrix = np.array([[1, 2, 3], [4, 5, 6]])
print(matrix.shape)  # (2, 3): 2 строки, 3 столбца
```

Ось `0` идёт по строкам и агрегирует строки, оставляя столбцы. Ось `1` идёт по столбцам и агрегирует столбцы, оставляя строки.

```python
matrix.sum(axis=0)  # сумма по строкам -> по каждому столбцу
matrix.sum(axis=1)  # сумма по столбцам -> по каждой строке
```

## Dtype

Один массив имеет один dtype. Это даёт компактность и предсказуемую арифметику.

```python
np.array([1, 2, 3], dtype=np.int64)
np.array([1, 2, 3], dtype=np.float32)
```

Ошибки dtype:

- integer division или переполнение;
- `object` из-за смешанных значений;
- `float64` там, где `float32` достаточно;
- потеря точности при приведении;
- `NaN` требует floating dtype.

Проверяйте преобразование явно:

```python
values = values.astype(np.float32, copy=False)
```

## Индексация

```python
vector = np.array([10, 20, 30, 40])
vector[0]      # 10
vector[-1]     # 40
vector[1:3]    # [20, 30]

matrix[0, 2]   # первая строка, третий столбец
matrix[:, 1]   # второй столбец
matrix[0, :]   # первая строка
```

Срез часто является view, а не независимой копией:

```python
part = vector[1:3]
part[0] = 999
print(vector)  # исходный массив изменился
```

Для независимости используйте `.copy()`.

## Векторные операции

```python
values = np.array([1.0, 2.0, 3.0])
values * 2
values + 10
np.log1p(values)
values.mean()
values.std()
```

Операция применяется ко всему массиву без Python-цикла по элементам.

## Boolean mask

```python
mask = values >= 2
selected = values[mask]
values[values < 0] = 0
```

Маска должна быть совместима по shape. Boolean indexing обычно создаёт копию.

## Reshape и transpose

```python
values = np.arange(12)
matrix = values.reshape(3, 4)
transposed = matrix.T
flattened = matrix.ravel()
```

`reshape` возможен, если число элементов сохраняется. `ravel` старается вернуть view, `flatten` всегда копирует.

## Aggregations и NaN

```python
values = np.array([1.0, np.nan, 3.0])
np.mean(values)      # nan
np.nanmean(values)   # 2.0
```

Игнорирование пропуска должно быть осознанным: иногда `NaN` сигнализирует ошибку источника, а не значение, которое нужно молча пропустить.

## Random generator

```python
rng = np.random.default_rng(42)
sample = rng.normal(loc=0, scale=1, size=1000)
indices = rng.choice(len(values), size=10, replace=False)
```

Новый `Generator` предпочтительнее глобального `np.random.seed`, потому что зависимость можно явно передать функции.

## Частые ошибки

- путать axis `0` и `1`;
- неожиданно менять исходный массив через view;
- создавать `object` dtype;
- использовать Python-цикл вместо векторной операции;
- полагаться на broadcasting, не проверив shape;
- сравнивать floats через точное `==`;
- игнорировать переполнение integer dtype.

## Мини-практика

Создайте матрицу `100 × 3`, стандартизируйте каждый столбец и проверьте, что среднее примерно `0`, а standard deviation примерно `1`. Используйте `axis=0` и broadcasting.

## Связи

- [[NumPy Indexing Broadcasting and Vectorization]] — сложная индексация и broadcasting.
- [[pandas Foundations and Selection]] — таблицы поверх массивов.
- [[Linear Algebra for ML]] — matrix operations.
