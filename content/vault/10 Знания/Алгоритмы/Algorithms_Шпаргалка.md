---
title: "Algorithms — шпаргалка"
type: "concept"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
tags: ["algorithms/patterns", "interview/algorithms"]
id: concept.algorithms.algorithms-shpargalka
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---
# Algorithms — шпаргалка

[[18_Dynamic_Programming_Basics|← Предыдущий]] · [[00_Главная_страница|Главная]]

| Сигнал | Шаблон | Состояние | Обычно |
|---|---|---|---|
| уже видел / частота | set / Hash Map | seen/counts | O(n), O(n) |
| сортированный массив, пара | Two Pointers | left/right | O(n), O(1) |
| непрерывный фрагмент | Sliding Window | left + window state | O(n) |
| суммы диапазона | Prefix Sum | сумма префикса | O(n) build, O(1) query |
| монотонный ответ | Binary Search | диапазон кандидатов | O(log n) |
| последний незакрытый | stack | unresolved | O(n) |
| уровни / минимум рёбер | BFS | queue + visited | O(V+E) |
| ветвь/поддерево | DFS | stack/recursion | O(V+E) |
| следующий больший | monotonic stack | unresolved indices | O(n) |
| перекрывающиеся интервалы | sort + merge | merged tail | O(n log n) |
| Top-K | heap | heap size k | O(n log k) |
| linked list | pointer rewiring | prev/current/next | O(n) |
| все варианты | backtracking | path | экспонента |
| локально безопасный выбор | greedy | best prefix | часто O(n) |
| повторные подзадачи | DP | state table | states × transition |

## Амортизированный анализ

В Sliding Window или monotonic stack внутренний `while` не делает алгоритм O(n²), если каждый элемент удаляется не более одного раза. Считайте операции суммарно.

## Выбор между похожими подходами

- Hash Map vs Two Pointers: неотсортированный вход и нужна память O(n) vs сортированный/in-place.
- Sliding Window vs Prefix Sum: одно движущееся валидное окно vs много range-запросов/суммы с отрицательными числами.
- BFS vs DFS: уровни/минимум рёбер vs поддеревья/компоненты.
- Heap vs sort: малый k/поток vs нужен полный порядок.
- Greedy vs DP: есть доказуемо безопасный локальный выбор vs нужно сравнивать состояния.

## Перед отправкой решения

- контракт уточнён;
- инвариант сформулирован;
- пустой и минимальный вход проверены;
- границы не смешаны;
- время и дополнительная память названы отдельно;
- Python-операции имеют ожидаемую стоимость;
- решение можно объяснить за 30–60 секунд.
