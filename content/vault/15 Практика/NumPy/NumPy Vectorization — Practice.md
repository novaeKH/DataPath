---
title: NumPy Vectorization — Practice
id: practice.numpy.vectorization
type: practice
area: numpy
schema_version: 2
language: ru
status: active
rag: include
rag_collection: practice
app: source
practice_kind: exercise
skill_ids:
- numpy.broadcasting
- numpy.vectorization
estimated_minutes: 45
tags:
- practice/numpy
---

# NumPy Vectorization — Practice

## Задача

Дана matrix признаков `(n, d)`. Реализуйте без Python-цикла:

1. standardization по columns;
2. clipping в `[-3, 3]`;
3. pairwise squared distances до centroids;
4. nearest centroid ID;
5. проверку результата на маленьком ручном примере.

## Ограничения

- не использовать цикл по rows;
- не менять исходный array;
- обработать zero standard deviation;
- объяснить shapes каждого intermediate tensor.

## Проверки

- mean normalized columns около 0;
- finite values;
- output shape `(n,)`;
- совпадение с slow reference на small input.

## Связи

- [[NumPy Foundations]]
- [[NumPy Indexing Broadcasting and Vectorization]]
- [[K-Means]]
