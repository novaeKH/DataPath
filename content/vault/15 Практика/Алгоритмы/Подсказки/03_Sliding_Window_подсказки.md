---
title: "Sliding Window — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.sliding-window-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Sliding Window — подсказки

[[03_Sliding_Window_задачи|← Условия]] · [[03_Sliding_Window_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 643 | Окно фиксировано | сумма окна | Первую сумму посчитать, затем +right -left |
| 3 | Окно должно быть уникальным | set или last index dict | Добавить справа; пока повтор — удалять слева; обновить длину |
| 1004 | Валидно, пока нулей ≤ k | `zero_count` | Добавлять ноль справа, while >k убирать слева |
| 567 | Окно длины len(s1) | две frequency maps/массивы 26 | Сравнить первое окно, затем сдвигать counts |
| 424 | Нужны длина и максимальная частота | counts + max_frequency | Пока `window_len-max_freq > k`, сжимать |
| 209 | Положительность делает сумму монотонной | window_sum | Расширять, а при sum≥target сжимать и минимизировать |
