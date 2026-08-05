---
title: DL Debugging and Experiment Design
id: concept.dl.debugging-experiment-design
type: concept
area: dl
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Отладка Deep Learning
tags:
- dl/debugging
- dl/experiments
math_depth: 1
---

# DL Debugging and Experiment Design

## Отладка по слоям

Не начинайте с большого run. Проверяйте pipeline в порядке:

1. один batch;
2. shapes/dtypes/ranges;
3. forward;
4. finite loss;
5. backward gradients;
6. overfit tiny subset;
7. short train/validation run;
8. full experiment.

## Overfit tiny batch

Model должна почти идеально запомнить 10–100 examples. Если не может, вероятны bug, insufficient capacity, wrong loss/labels или optimization issue.

## Sanity baselines

- random/constant prediction;
- shuffled labels;
- simple linear model;
- no-feature baseline;
- data leakage check.

Model на shuffled labels не должна generalize. Слишком высокий validation score подозрителен.

## Проверка gradients

```python
for name, param in model.named_parameters():
    if param.grad is not None:
        print(name, param.grad.norm().item())
```

Ищите zero, exploding, NaN и layers без gradients.

## Curves

Логируйте train/val loss, metric, lr, gradient norm, throughput, memory. График должен быть связан с exact run/config.

## Ablation

Меняйте одну важную вещь за раз:

- augmentation;
- layer;
- loss;
- optimizer;
- feature set.

Случайный набор одновременно изменённых параметров не объясняет improvement.

## Experiment record

Сохраняйте:

- hypothesis;
- data/version/split;
- code commit;
- config;
- seed;
- hardware;
- metrics;
- artifacts;
- conclusion;
- next step.

## NaN debugging

Проверить:

- input finite;
- log/division/sqrt domain;
- learning rate;
- AMP overflow;
- gradient norm;
- loss implementation;
- normalization;
- invalid labels/mask.

## Визуализация

Компонент `dl-debugging-decision-tree`:

- symptom selector;
- diagnostic steps;
- train/val curve examples;
- gradient histograms;
- tiny-batch test;
- likely causes.

## Частые ошибки

- запускать 10 часов до sanity check;
- менять пять things;
- не сохранять config;
- смотреть только final metric;
- игнорировать data duplicates;
- считать seed полноценным reproducibility;
- использовать test для debugging.

## Связи

- [[Training Evaluation and Inference in PyTorch]]
- [[Optimization and Regularization in Deep Learning]]
- [[Validation Splits and Data Leakage]]
