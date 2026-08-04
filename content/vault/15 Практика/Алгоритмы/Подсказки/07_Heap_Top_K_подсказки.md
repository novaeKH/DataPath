---
title: "Heap и Top-K — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.heap-i-top-k-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Heap и Top-K — подсказки

[[07_Heap_Top_K_задачи|← Условия]] · [[07_Heap_Top_K_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 215 | Храните только k лучших | min-heap k | Push; если размер >k, pop; вершина — ответ |
| 347 | Сначала частоты | Counter + heap или bucket | В heap пары `(frequency,value)`, ограничить k |
| 703 | Инвариант живёт между `add` | min-heap k как поле | В init/add push и обрезать; вернуть heap[0] |
| 1046 | Нужны два максимума многократно | max-heap через отрицания | Pop два, разницу вернуть, пока >1 |
