---
title: NumPy Indexing Broadcasting and Vectorization
id: concept.numpy.indexing-broadcasting-vectorization
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
- Broadcasting NumPy
- Векторизация NumPy
tags:
- numpy/core
- numpy/performance
---

# NumPy Indexing, Broadcasting and Vectorization

## Цель

Научиться преобразовывать массивы без лишних Python-циклов и при этом точно понимать shape результата. Большинство ошибок NumPy — это не математика, а неверная ось или неявное расширение размера.

## Basic, fancy и boolean indexing

Basic indexing использует integer/slice и часто возвращает view:

```python
matrix[:, 1:3]
```

Fancy indexing использует массив индексов и обычно возвращает копию:

```python
rows = matrix[[0, 3, 5]]
```

Boolean indexing:

```python
positive_rows = matrix[matrix[:, 0] > 0]
```

При присваивании маска меняет выбранные элементы исходного массива:

```python
matrix[matrix < 0] = 0
```

## Broadcasting

NumPy сравнивает shapes справа налево. Размеры совместимы, если они равны или один из них равен `1`.

```python
matrix.shape  # (100, 3)
means.shape   # (3,)
centered = matrix - means  # means растягивается по строкам
```

Явный вариант:

```python
means = matrix.mean(axis=0, keepdims=True)  # (1, 3)
centered = matrix - means
```

`keepdims=True` часто делает намерение понятнее.

### Несовместимый пример

Shapes `(100, 3)` и `(100,)` не совместимы так, как обычно ожидает новичок. Для вычитания значения из каждой строки нужно `(100, 1)`:

```python
row_means = matrix.mean(axis=1, keepdims=True)
centered_rows = matrix - row_means
```

## Векторизация

Плохо:

```python
result = []
for value in values:
    result.append((value - mean) / std)
```

Лучше:

```python
result = (values - mean) / std
```

Преимущество не только в краткости: вычисление выполняется в нативном цикле над плотной памятью.

## Условные выражения

```python
labels = np.where(scores >= 0.5, 1, 0)
clipped = np.clip(values, 0, 100)
```

Для нескольких условий:

```python
conditions = [scores < 0.3, scores < 0.7]
choices = ["low", "medium"]
segments = np.select(conditions, choices, default="high")
```

## Pairwise computations

Расстояния между объектами можно получить broadcasting:

```python
x = np.array([[0., 0.], [1., 1.]])      # (2, 2)
centers = np.array([[0., 1.], [2., 2.]]) # (2, 2)

diff = x[:, None, :] - centers[None, :, :]  # (2, 2, 2)
distances = np.sqrt((diff ** 2).sum(axis=2))
```

Но такой подход создаёт большой временный массив. Для крупных данных используйте специализированные функции или чанки.

## `einsum`

`np.einsum` выражает суммы по индексам:

```python
row_norms = np.einsum("ij,ij->i", matrix, matrix)
```

Он полезен, когда формула понятнее через индексы, но не должен заменять обычное `@` или `sum`, если они читаются проще.

## Matrix multiplication

```python
predictions = X @ weights
```

`*` означает element-wise multiplication, `@` — matrix multiplication. Это принципиально разные операции.

## Views, strides и contiguous memory

Transpose может изменить strides без копирования. Некоторые библиотеки требуют contiguous array:

```python
contiguous = np.ascontiguousarray(matrix.T)
```

Не вызывайте это автоматически: копия может быть дорогой.

## Производительность

Проверяйте:

- временные массивы;
- лишние копии;
- dtype;
- порядок памяти;
- размер batch;
- возможность использовать библиотечную функцию.

Векторизация не всегда уменьшает память. Выражение с несколькими операциями может создать несколько промежуточных arrays.

## Численная устойчивость

Для floats используйте:

```python
np.isclose(a, b)
np.allclose(array_a, array_b)
```

Не вычисляйте `np.exp(large_values)` без стабилизации. Для softmax сначала вычитают максимум.

## Связи

- [[NumPy Foundations]] — shape, dtype и views.
- [[K-Nearest Neighbors]] — расстояния.
- [[Embeddings and Attention]] — matrix shapes и broadcasting masks.
