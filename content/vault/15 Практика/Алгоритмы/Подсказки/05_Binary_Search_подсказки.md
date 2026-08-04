---
title: "Binary Search — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.binary-search-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Binary Search — подсказки

[[05_Binary_Search_задачи|← Условия]] · [[05_Binary_Search_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 704 | Отбрасывайте половину | закрытый `[l,r]` | Сравнить middle; обновить `m±1` |
| 35 | Нужна левая граница | полуинтервал `[l,r)` | Если `nums[m] < target`, l=m+1, иначе r=m |
| 69 | Ищите последний m с `m²≤x` | answer search | При валидном m сохранить и идти вправо |
| 278 | Ищите первый True | `[1,n]` | Bad middle оставляет middle кандидатом, good исключает |
| 153 | Одна половина содержит pivot | сравнение с right | Если `nums[m] > nums[r]`, минимум справа, иначе включая m слева |
| 33 | Одна половина отсортирована | границы + target range | Определить sorted half и оставить её только если target внутри |
