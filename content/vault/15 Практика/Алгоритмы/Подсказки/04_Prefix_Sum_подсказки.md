---
title: "Prefix Sum — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.prefix-sum-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Prefix Sum — подсказки

[[04_Prefix_Sum_задачи|← Условия]] · [[04_Prefix_Sum_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 1480 | Накапливайте прошлую сумму | `total` + result | total += x, append total |
| 724 | Правая сумма выводится из total | total + left_sum | До добавления x сравнить `left == total-left-x` |
| 303 | Нулевой prefix упрощает границы | массив n+1 | query inclusive = p[right+1]-p[left] |
| 560 | Нужен прошлый prefix `current-k` | dict prefix→count | Начать `{0:1}`, добавить число ответов, затем записать current |
| 238 | Произведение слева и справа | result + две переменные | Первый проход записывает left product, обратный домножает right |
