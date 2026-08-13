---
title: "Коллекции Python: list, tuple, dict, set и comprehensions"
id: concept.datapath-v2.002
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 2
canonical_course: "Python Core"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Коллекции Python: как выбрать правильную структуру

Одна и та же задача:

> хранить пользователей и быстро проверять, встречался ли `user_id`

может быть решена через:
```python
list
set
dict
```

Но стоимость операций будет разной.

## 1. `list`

Упорядоченная изменяемая последовательность.

```python
items = [10, 20, 30]
```

Частые операции:
```python
items.append(40)     # амортизированно O(1)
items[-1]            # O(1)
20 in items          # O(n)
items.insert(0, 5)   # O(n)
items.pop()          # O(1)
items.pop(0)         # O(n)
```

Почему `pop(0)` дорог? Остальные ссылки нужно сдвинуть.

## 2. Dynamic array

Python list — не linked list. Это динамический массив ссылок.

Когда capacity заканчивается, CPython выделяет больший блок и переносит ссылки. Поэтому `append` не гарантированно O(1) каждый конкретный раз, но **амортизированно O(1)**.

## 3. `tuple`

```python
point = (10, 20)
```

Плюсы:
- immutable container;
- может быть ключом `dict`, если элементы hashable;
- хорошо выражает fixed record.

Tuple не надо выбирать потому, что он «быстрее list» в любой ситуации. Главное — семантика неизменяемой структуры.

## 4. `dict`

```python
scores = {
    "alice": 0.91,
    "bob": 0.84,
}
```

Обычно:
```text
get/set/delete by key → average O(1)
```

Под капотом — hash table.

```python
scores["alice"]
scores.get("carol", 0)
```

`get` удобен, когда отсутствие key допустимо.

## 5. Что значит hashable

Чтобы объект был ключом dict или элементом set, он должен иметь стабильный hash и корректную equality semantics.

Обычно hashable:
- int
- str
- tuple из hashable элементов

Не hashable:
- list
- dict
- set

```python
{[1, 2]: "x"}  # TypeError
```

## 6. `set`

```python
seen = {10, 20, 30}
```

Сильная сторона:
```python
x in seen
```
в среднем O(1).

Типовая задача:

```python
def has_duplicate(nums):
    seen = set()

    for x in nums:
        if x in seen:
            return True
        seen.add(x)

    return False
```

Через list membership получилось бы O(n²) в худшем типовом анализе.

## 7. Операции множеств

```python
a | b   # union
a & b   # intersection
a - b   # difference
a ^ b   # symmetric difference
```

Полезны для:
- пересечения user IDs;
- удалённых/новых категорий;
- сравнения column names.

## 8. Порядок dict

В современном Python dict сохраняет insertion order как часть языка.

Но:
> dict остаётся mapping, а не заменой list для задач индексной последовательности.

## 9. Comprehensions

```python
squares = [x * x for x in range(10)]
```

Dictionary:
```python
mapping = {x: x * x for x in range(5)}
```

Set:
```python
unique_lengths = {len(s) for s in texts}
```

Comprehension хорош, если логика читается в одну мысль.

Плохо:

```python
result = [
    complicated(x)
    for x in xs
    if cond1(x)
    if cond2(transform(x))
]
```

если это ухудшает понимание.

Правильно:

```python
result = []
for x in xs:
    transformed = transform(x)
    if cond1(x) and cond2(transformed):
        result.append(complicated(x))
```

Здесь промежуточное значение и условия можно прочитать и отладить по отдельности.

## 10. Generator expression

```python
sum(x * x for x in range(1_000_000))
```

не строит промежуточный list миллионов элементов.

Это мост к ленивым вычислениям.

## 11. `defaultdict`

```python
from collections import defaultdict

groups = defaultdict(list)

for user, category in rows:
    groups[category].append(user)
```

Без `defaultdict`:

```python
groups = {}

for user, category in rows:
    if category not in groups:
        groups[category] = []
    groups[category].append(user)
```

или:

```python
groups.setdefault(category, []).append(user)
```

## 12. `Counter`

```python
from collections import Counter

freq = Counter(words)
```

Это dict-like структура для частот.

```python
freq.most_common(10)
```

Очень полезна на интервью и в EDA текста.

## 13. `deque`

Для очереди:

```python
from collections import deque

q = deque()
q.append(x)
q.popleft()
```

Операции с обоих концов O(1).

List `pop(0)` — O(n), поэтому для BFS выбирают `deque`.

## 14. Как выбирать

```text
нужен порядок + индекс → list
fixed immutable record → tuple
key → value → dict
fast membership / uniqueness → set
queue from both ends → deque
counts → Counter
```

## Визуализация DataPath

Показать одну задачу membership на list vs set и рост числа операций при n.

## Типичные ошибки

- `x in list` внутри большого цикла;
- `pop(0)` вместо deque;
- list как dict key;
- comprehension, который хуже обычного цикла;
- сортировка set ради каждого membership check.

## Проверка понимания

1. Почему list membership O(n)?
2. Почему dict/set average O(1)?
3. Что такое hashable?
4. Когда tuple лучше list?
5. Почему deque нужен BFS?
6. Что делает `defaultdict(list)`?
7. Generator expression vs list comprehension?

## Мини-практика

Есть 1 млн `user_id`, нужно:
- удалить duplicates;
- сохранить membership check;
- посчитать frequency.

Назовите структуры для каждого шага.

## Итог

Выбор структуры данных — это одновременно:
- семантика;
- читаемость;
- время;
- память.

## Куда дальше

Коллекции становятся особенно мощными внутри функций. Следующий урок — аргументы,
scope, `*args/**kwargs`, closures и decorators без магии.
