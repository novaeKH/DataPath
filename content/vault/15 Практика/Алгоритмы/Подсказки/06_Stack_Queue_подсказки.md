---
title: "Stack и Queue — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.stack-i-queue-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Stack и Queue — подсказки

[[06_Stack_Queue_задачи|← Условия]] · [[06_Stack_Queue_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 20 | Последняя открытая должна закрыться первой | stack + closing→opening map | Opening push; closing сравнить с pop; в конце stack пуст |
| 155 | Храните минимум на каждом уровне | stack пар `(value,min)` | При push min=min(value,current); pop удаляет пару |
| 232 | Два раза развернуть порядок | input/output stacks | Push в input; при пустом output перелить из input |
| 739 | Новый warmer разрешает прошлые дни | decreasing stack индексов | Пока current > value[top], pop и записать разницу |
| 1047 | Stack — уже сокращённый префикс | list chars | Если top==char pop, иначе push; join |
