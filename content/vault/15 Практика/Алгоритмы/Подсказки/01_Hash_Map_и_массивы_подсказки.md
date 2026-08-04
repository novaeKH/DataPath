---
title: "Hash Map и массивы — подсказки"
type: "practice"
area: "algorithms"
status: "active"
source: "Python_Interview_Preparation"
integrated: "2026-07-31"
rag: "include"
tags: ["algorithms/practice", "practice/hints"]
id: practice.algorithms.hash-map-i-massivy-podskazki
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Hash Map и массивы — подсказки

[[01_Hash_Map_и_массивы_задачи|← Условия]] · [[01_Hash_Map_и_массивы_решения|Решения]]

| Задача | Уровень 1 — направление | Уровень 2 — структура | Уровень 3 — алгоритм без кода |
|---|---|---|---|
| 1 | Ищите дополнение до target | dict значение→индекс | Для x проверьте `target-x` среди прошлых, затем сохраните x |
| 217 | Запоминайте увиденное | set | При первом повторе вернуть True, иначе добавлять |
| 242 | Сравните кратности | два dict/Counter | Проверить длины, посчитать символы и сравнить |
| 49 | Одинаковая сигнатура группы | dict key→list | Для слова построить hashable key частот/сортировки и append |
| 349 | Нужна уникальность | два set | Пересечь множества |
| 350 | Учитывайте запас каждого значения | Counter меньшего массива | При наличии count добавить и уменьшить |
| 387 | Сначала нужна глобальная частота | dict | Первый проход counts, второй — первый count 1 |
| 169 | Кандидат меняется при балансе 0 | две переменные | Boyer–Moore: same +1, different -1; при 0 новый кандидат |
| 128 | Начинайте цепь только с её начала | set | Если `x-1` нет, шагать x+1, x+2… и обновить максимум |
