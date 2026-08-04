---
title: "Code Review — ответы"
type: "interview"
area: "python"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["interview/python-algorithms"]
id: interview.python.code-review-otvety
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Code Review — ответы

[[Code_Review_задачи|← Задачи]]

## CR 1

Один default-list делится вызовами.

```python
def add_feature(name: str, features: list[str] | None = None) -> list[str]:
    result = [] if features is None else features
    result.append(name)
    return result
```

В ML: признаки предыдущего эксперимента могут «протечь» в следующий.

## CR 2

`is` проверяет идентичность; интернирование может скрыть ошибку.

```python
def is_target(label: str) -> bool:
    return label == "positive"
```

В ML: строковые labels из файла могут быть равны, но не идентичны.

## CR 3

Удаление сдвигает элементы, а iterator идёт дальше; `[None,None]` оставит один.

```python
def drop_missing(values: list[float | None]) -> list[float]:
    return [value for value in values if value is not None]
```

В ML: часть missing values незаметно останется.

## CR 4

Оба внешних списка ссылаются на один вложенный row; `train[0]` тоже получает 99.

```python
validation = [row.copy() for row in train]
```

Или `deepcopy`, если глубина неизвестна. В ML: validation preprocessing меняет train.

## CR 5

Ветка возвращает `None`.

```python
def accuracy(correct: int, total: int) -> float:
    if total == 0:
        return 0.0
    return correct / total
```

В ML: метрика становится None и ломает aggregation позже.

## CR 6

На последнем i читается индекс `len(values)`.

```python
def adjacent_pairs(values: list[int]) -> list[tuple[int, int]]:
    return [(values[i], values[i + 1]) for i in range(len(values) - 1)]
```

Или `itertools.pairwise`. В ML: ошибка на последнем timestamp.

## CR 7

На первом неотрицательном значении `left` не меняется.

```python
while left < len(values):
    if values[left] < 0:
        ...
    left += 1
```

В ML: batch worker зависает на валидной строке.

## CR 8

Длина включительного окна — `right-left+1`. В ML: rolling length и threshold систематически на единицу меньше.

## CR 9

Не удалён элемент, покидающий фиксированное окно.

```python
window_sum += nums[right] - nums[right - k]
```

В ML: rolling metric превращается в накопительную сумму.

## CR 10

Нарушение может требовать нескольких удалений; нужен `while`. В конкретной LC 1004 при добавлении одного нуля одного сдвига иногда достаточно для сохранения длины, но общий шаблон и доказательство безопаснее через `while`.

В ML: буфер остаётся больше разрешённого лимита.

## CR 11

`num in seen` для list — O(n), внутри n проходов получается O(n²).

```python
seen: set[int] = set()
```

В ML: дедупликация ID деградирует квадратично.

## CR 12

```python
seen: set[int] = set()
unique: list[int] = []
for user_id in user_ids:
    if user_id not in seen:
        seen.add(user_id)
        unique.append(user_id)
```

Среднее O(n), порядок сохранён. В ML: ускоряет подготовку уникальных сущностей.

## CR 13

Первый `sum` полностью потребил generator. Нужно создать его снова, объединить действия в один проход или материализовать заранее.

```python
rows = [parse(line) for line in stream]
```

В ML: после валидации нечего сохранять.

## CR 14

Все используют последнее `weight=3`, результат 30.

```python
scorers = [lambda value, weight=weight: value * weight for weight in (1, 2, 3)]
```

В ML: ensemble-функции получают один и тот же вес.

## CR 15

Равные по `value` объекты могут иметь разные identity-hash. Сделайте key неизменяемым:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Key:
    value: int
```

В ML: cache miss для логически одинаковой конфигурации.

## CR 16

На `None` будет обращение к атрибутам или бесконтрольная рекурсия.

```python
def depth(node: TreeNode | None) -> int:
    if node is None:
        return 0
    return 1 + max(depth(node.left), depth(node.right))
```

В ML: обход дерева правил падает на листе.

## CR 17

Размер dict меняется во время итерации.

```python
for key in list(metrics):
    if metrics[key] is None:
        del metrics[key]
```

Или comprehension. В ML: очистка метрик падает в конце pipeline.

## CR 18

`sort()` возвращает None; порядок по умолчанию возрастающий, поэтому `[0]` — худший score, если больше лучше.

```python
best = max(models, key=lambda model: model.score)
```

В ML: выбор худшей модели или `TypeError`.

## CR 19

Получилось `["age","income",["country","device"]]`; ожидался плоский список.

```python
columns.extend(["country", "device"])
```

В ML: селектор колонок получает вложенный list и падает.
