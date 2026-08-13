---
title: "Broadcasting и векторные вычисления в NumPy"
id: concept.datapath-v2.010
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 10
canonical_course: "NumPy / pandas / EDA"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Broadcasting и векторные вычисления в NumPy

Broadcasting позволяет записать стандартизацию как `(X - mean) / std`, хотя `X` имеет форму `(n, d)`, а `mean/std` — `(d,)`. Это ключевой механизм NumPy и источник многих shape-bugs.

## Правило совместимости

Размерности сравниваются справа налево. Они совместимы, если равны или одна из них равна 1. Отсутствующая ведущая ось мысленно считается 1. Поэтому `(1000, 20)` и `(20,)` совместимы, а `(1000, 20)` и `(1000,)` — нет.

## Добавление оси

`v[:, None]` превращает `(n,)` в `(n,1)`, а `v[None, :]` — в `(1,n)`. Это не ручное копирование значений, а изменение представления формы.

## Boolean vectorization

Для массивов используют `&`, `|`, `~`, а не Python `and/or`. Каждое условие оборачивают в скобки: `(x > 0) & (x < 10)`.

## Матричное и поэлементное умножение

`A * B` — поэлементно; `A @ B` — matrix multiplication. Для ML это принципиально: `(n,d) @ (d,k) -> (n,k)`.

## Цена векторизации

Pairwise broadcasting `X[:,None,:] - Y[None,:,:]` удобно, но создаёт массив `(n,m,d)`. При больших n и m это может быть намного дороже Python-цикла с chunking. Векторизация — не магическая бесплатная память.

## Практический код

```python
import numpy as np

X = np.random.randn(1000, 20)
mu = X.mean(axis=0)
sigma = X.std(axis=0)

X_scaled = (X - mu) / sigma

row_bias = np.arange(1000)[:, None]
Y = X + row_bias
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- считать `(n,)` column vector
- использовать `and/or` на ndarray
- путать `*` и `@`
- забывать скобки в boolean mask
- создавать O(n²) broadcast-массив без оценки памяти

## Проверка понимания

1. Как проверяются broadcasting dimensions?
2. Почему `(10,5)+(5,)` работает?
3. Как создать `(10,1)`?
4. Чем `*` отличается от `@`?
5. Почему pairwise broadcasting может привести к OOM?

## Мини-практика

Для `X` формы `(500, 30)` вычтите: а) среднее каждого столбца; б) среднее каждой строки. Запишите формы mean-векторов, которые нужны в двух случаях.

## Что нужно унести

Broadcasting — неявное расширение совместимых singleton/отсутствующих осей. Чтобы уверенно работать с NumPy/PyTorch, нужно уметь читать shapes справа налево.

## Куда дальше

Дальше labels и heterogeneous types: pandas `Series` и `DataFrame`.
