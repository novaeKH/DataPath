---
title: "Intervals — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.intervals-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Intervals — подсказки

[[08_Intervals_задачи|← Условия]] · [[08_Intervals_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 56 | После сортировки смотрите только на хвост | sorted + merged | Если start>last_end append, иначе last_end=max |
| 57 | Три группы интервалов | result + new interval | До new append; пересечения расширяют new; затем хвост |
| 252 | После сортировки конфликтуют соседи | sorted by start | Если current.start < previous.end, вернуть False |
