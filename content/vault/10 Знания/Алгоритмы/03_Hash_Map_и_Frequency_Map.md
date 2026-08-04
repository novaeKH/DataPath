---
title: "03. Hash Map и Frequency Map"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.03-hash-map-i-frequency-map
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# 03. Hash Map и Frequency Map

[[02_Array_String_Sorting|← Предыдущий]] · [[04_Two_Pointers|Следующий →]]

## 1. Цель урока

Узнавать задачи «видел/сколько/где/с чем связан», выбирать set или dict и формулировать хранимое состояние.

## 2. Главная идея

Платим O(n) памяти, чтобы заменить повторный линейный поиск на O(1) в среднем. Подробности устройства: [[03_Dict_Set_Hash_Map]].

## 3. Как распознать

«дубликат», «анаграмма», «частота», «первый уникальный», «найти пару», «сгруппировать», «последовательные значения без сортировки».

## 4. Когда не подходит

Если данные отсортированы и нужна пара — Two Pointers может дать O(1) памяти. Если нужен диапазон — Sliding Window/Prefix Sum. Если порядок определяет ближайший элемент — stack/deque.

## 5. Необходимый Python

`in`, `set.add`, `dict.get`, `.items()`, `defaultdict`, `Counter`, hashable keys.

## 6. Универсальные шаблоны

```python
def count(values: list[int]) -> dict[int, int]:
    frequencies: dict[int, int] = {}
    for value in values:
        frequencies[value] = frequencies.get(value, 0) + 1
    return frequencies
```

```python
def first_repeat(values: list[int]) -> int | None:
    seen: set[int] = set()
    for value in values:
        if value in seen:
            return value
        seen.add(value)
    return None
```

## 7. Первая задача: LC 217 Contains Duplicate

Brute force сравнивает все пары O(n²). Оптимально хранить просмотренные числа.

```python
def contains_duplicate(nums: list[int]) -> bool:
    seen: set[int] = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False

assert contains_duplicate([1, 2, 3, 1])
assert not contains_duplicate([])
```

Инвариант: `seen` содержит ровно элементы слева от текущего. Время O(n) среднее, память O(n).

## 8. Вторая задача: LC 242 Valid Anagram

Сравнить частоты символов. Можно `Counter(s) == Counter(t)`; на интервью сначала объясните явный dict. Время O(n + m), память O(k).

## 9. Третья задача без решения

LC 1 Two Sum: [[01_Hash_Map_и_массивы_задачи#LC 1 — Two Sum]]. Спросите себя, почему проверять complement нужно до записи текущего индекса.

## 10. Трассировка LC 217

| num | seen до | действие |
|---:|---|---|
| 1 | `{}` | добавить |
| 2 | `{1}` | добавить |
| 3 | `{1,2}` | добавить |
| 1 | `{1,2,3}` | вернуть True |

## 11. Инвариант

Set/dict описывает только уже обработанный префикс и обновляется один раз после проверки текущего элемента.

## 12. Сложность

Обычно O(n) времени и O(n) памяти. Уточнение: операции хеш-таблицы O(1) в среднем, худший случай O(n).

## 13. Типичные ошибки

- использовать list как `seen`, получая O(n²);
- хранить значение, но забыть нужный индекс;
- записать текущий элемент до проверки и использовать его дважды;
- путать число разных ключей k и длину n;
- применять изменяемый ключ;
- сортировать анаграмму и заявлять O(n);
- не определить поведение при нескольких ответах.

## 14. Что сказать интервьюеру

> Я заменяю повторный поиск хеш-таблицей. При проходе храню уже просмотренные элементы; инвариант — таблица описывает префикс слева. Проверка и вставка O(1) в среднем, поэтому суммарно O(n), дополнительная память O(n).

## 15. Мини-контрольная

Set или dict для membership? Почему худший случай O(n)? Что хранить для Two Sum? Для первого уникального нужен один или два прохода? Можно ли list-ключ?

<details><summary>Ответы</summary>
Set; коллизии/дорогие сравнения; value→index; обычно два; нет.
</details>

## 16. Практика

Обязательные: 217, 242, 1, 349, 387. Дополнительные: 49, 350, 128. Повтор: 217/1 через +1/+3/+7.

## 17. Шпаргалка

`seen: set`; `counts[x] = counts.get(x, 0)+1`; `value→index`; `key→list`; O(n) среднее, O(n) память.

## Где это встречается в Data Science

Подсчёт категорий, индексация ID, группировка, дедупликация. Навык переносится, хотя реальные объёмы часто обрабатываются pandas/SQL.
