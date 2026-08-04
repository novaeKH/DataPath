---
title: Gradient Boosting — Interview
type: interview
area: career
status: active
aliases:
  - Boosting Interview
tags:
  - interview/ml
id: interview.career.gradient-boosting-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# Gradient Boosting — Interview

> Knowledge: [[Gradient Boosting]], [[XGBoost LightGBM and CatBoost]].

## Вопрос 1 — Как работает Gradient Boosting?

### Ответ 20–30 секунд

Он строит additive model последовательно. На каждом step вычисляет negative gradient текущего loss по predictions — pseudo-residuals, fit tree на этот signal и добавляет correction с learning rate. Следующий gradient зависит от уже построенного ensemble.

### Если попросят глубже

При MSE pseudo-residual равен $y-\widehat{y}$, но для general loss это именно gradient. Tree приближает direction в function/prediction space.

### Follow-up

- Почему learners зависимы?
- Чем boosting отличается от bagging?

### Связанные знания

- [[Gradient Boosting]]
- [[Gradients Chain Rule and Optimization]]

## Вопрос 2 — Как связаны learning rate и iterations?

### Ответ 20–30 секунд

Learning rate задаёт силу correction каждого tree. Малый rate обычно требует больше iterations и даёт smoother fit; большой быстрее снижает train loss, но повышает риск overshoot/overfit. Использую высокий upper bound iterations и early stopping на validation.

### Если попросят глубже

Depth/leaves определяют interaction capacity одного step, поэтому rate, number of trees и base-tree complexity tuning взаимосвязаны.

### Follow-up

- Почему нельзя early-stop по test?
- Что означает слишком ранний best iteration?

### Связанные знания

- [[Gradient Boosting]]
- [[Validation Splits and Data Leakage]]

## Вопрос 3 — Что добавляет XGBoost?

### Ответ 20–30 секунд

XGBoost использует second-order Taylor approximation loss: sums gradients и Hessians определяют leaf weights и split gain. Objective явно penalizes число leaves и leaf weights; отсюда параметры `gamma`, `lambda`, `alpha`, `min_child_weight`.

### Если попросят глубже

Optimal leaf value без L1 — $-G/(H+\lambda)$. Hessian — curvature/effective weight, не общая probability confidence.

### Follow-up

- Выведите split gain.
- Что делает `min_child_weight`?

### Связанные знания

- [[XGBoost LightGBM and CatBoost]]
- [[Gradients Chain Rule and Optimization]]

## Вопрос 4 — Чем LightGBM отличается?

### Ответ 20–30 секунд

LightGBM binning features в histograms и обычно растит tree leaf-wise: делит leaf с максимальным gain. Это ускоряет large tabular training и быстро снижает train loss, но на малых данных local deep branches повышают overfit risk.

### Если попросят глубже

GOSS сохраняет большие gradients и reweights sample малых; EFB bundles mutually exclusive sparse features.

### Follow-up

- Как связаны `num_leaves` и `max_depth`?
- Почему GOSS без reweighting biased?

### Связанные знания

- [[XGBoost LightGBM and CatBoost]]

## Вопрос 5 — Что именно делает CatBoost?

### Ответ 20–30 секунд

CatBoost строит leakage-safe ordered target statistics: feature объекта использует только предыдущие labels в permutation. Ordered boosting также стремится считать gradient моделью, не видевшей текущий object. Symmetric trees дают быстрый predictable inference.

### Если попросят глубже

Ordered statistics и ordered boosting — разные mechanisms. Prior/smoothing стабилизирует rare categories; category нужно передать именно как category.

### Follow-up

- Почему naive target encoding leaks?
- Что такое prediction shift?

### Связанные знания

- [[XGBoost LightGBM and CatBoost]]
- [[Categorical Features]]
