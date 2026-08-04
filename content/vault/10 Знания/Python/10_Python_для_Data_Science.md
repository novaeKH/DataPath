---
title: "10. Python для Data Science"
type: "concept"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["python/core", "interview/python"]
id: concept.python.10-python-dlia-data-science
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 10. Python для Data Science

[[09_Память_GC_GIL|← Предыдущий]] · [[11_Typing_Testing_Code_Quality|Следующий →]]

## Базовая реализация → идиоматичный инструмент

### Агрегации: dict → Counter/defaultdict

```python
def count_labels(labels: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    return counts
```

```python
from collections import Counter

counts = Counter(labels)
```

Сначала умейте объяснить dict-шаблон, затем используйте `Counter`. Для группировки:

```python
from collections import defaultdict

rows_by_group: defaultdict[str, list[int]] = defaultdict(list)
for index, label in enumerate(labels):
    rows_by_group[label].append(index)
```

### Дедупликация: set

`set(values)` быстро убирает повторы, но не обещает порядок. Для порядка используйте `list(dict.fromkeys(values))` или явный `seen`.

### Скользящие вычисления: deque

```python
from collections import deque

window: deque[float] = deque(maxlen=3)
for value in stream:
    window.append(value)
```

`deque` даёт O(1) операции с обоих концов; list `pop(0)` — O(n).

### Top-K: heapq

```python
from heapq import nlargest

top_features = nlargest(5, features, key=lambda row: row.score)
```

Если нужны все элементы по порядку — сортировка яснее. Если `k << n` или поток — heap обычно полезнее.

### Порог: bisect

```python
from bisect import bisect_left

index = bisect_left(sorted_thresholds, value)
```

Поиск O(log n), вставка в list после найденной позиции остаётся O(n).

### Комбинации: itertools

`chain`, `islice`, `pairwise`, `product`, `combinations` выражают потоковые операции без ручных индексов. Не материализуйте бесконечный iterator.

## `enumerate`, `zip`, `any`, `all`

```python
for index, row in enumerate(rows):
    ...

for feature, weight in zip(features, weights, strict=True):
    ...

has_missing = any(value is None for value in row)
all_valid = all(value >= 0 for value in values)
```

`any` и `all` short-circuit. `all([]) == True`, `any([]) == False`.

## `sorted`, `min`, `max` с `key`

```python
best = max(models, key=lambda model: model.validation_score)
ranked = sorted(models, key=lambda model: (-model.validation_score, model.name))
```

`max(..., key=...)` не требует полной сортировки: O(n) вместо O(n log n).

## Python-цикл и NumPy-векторизация

```python
def standardize_python(values: list[float], mean: float, std: float) -> list[float]:
    if std == 0:
        raise ValueError("std must be non-zero")
    return [(value - mean) / std for value in values]
```

```python
import numpy as np

array = np.asarray(values, dtype=float)
standardized = (array - array.mean()) / array.std()
```

Векторизация убирает Python-level цикл и использует компактную память/native loops. Но создаёт временные массивы и не всегда выгодна на маленьких данных. Проверяйте dtype, broadcasting, NaN и память.

## Generator для потока

```python
from collections.abc import Iterable, Iterator

def positive(values: Iterable[float]) -> Iterator[float]:
    for value in values:
        if value > 0:
            yield value
```

## Перенос алгоритмов в DS

| Шаблон | Рабочая аналогия |
|---|---|
| Hash Map | категории, агрегации, индексация |
| set | дедупликация |
| Sliding Window | rolling-метрики, временные ряды |
| Prefix Sum | быстрые range aggregates |
| Binary Search | поиск порога в монотонном критерии |
| heap | Top-K объектов/признаков |
| BFS/DFS | компоненты графа, обход зависимостей |
| generator | батчи и большие файлы |

LeetCode не имитирует ежедневную работу DS. Он тренирует ясность состояния, выбор структуры, оценку стоимости и проверку edge cases.

## Мини-контрольная

1. Почему `max(key=...)` лучше сортировки для одного максимума?
2. Что делает `zip(..., strict=True)`?
3. Когда deque лучше list?
4. Почему `bisect.insort` не O(log n)?
5. Какие риски у векторизации?

<details><summary>Ответы</summary>
1. O(n) против O(n log n). 2. Проверяет равную длину. 3. Частые операции слева. 4. Сдвиг списка O(n). 5. Память, временные массивы, dtype, broadcasting, NaN.
</details>
