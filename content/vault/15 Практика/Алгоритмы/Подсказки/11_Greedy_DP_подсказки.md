---
title: "Greedy и DP — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.greedy-i-dp-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Greedy и DP — подсказки

[[11_Greedy_DP_задачи|← Условия]] · [[11_Greedy_DP_решения|Решения]]

| Задача | Уровень 1 | Уровень 2 | Уровень 3 |
|---|---|---|---|
| 121 | Для продажи нужна лучшая прежняя покупка | min_price + best | Обновлять минимум префикса и profit |
| 53 | Текущий элемент либо начинает, либо продолжает | current + best | current=max(x,current+x); best=max(best,current) |
| 70 | Последний шаг пришёл с n-1 или n-2 | два DP-состояния | База 1,1; итеративный Fibonacci |
| 198 | Взять текущий или пропустить | prev2/prev1 | current=max(prev1,prev2+value), сдвинуть |
| 322 | Минимум по последней использованной монете | dp amount+1 | dp[0]=0; для each amount/coin обновить из dp[a-coin]+1 |
