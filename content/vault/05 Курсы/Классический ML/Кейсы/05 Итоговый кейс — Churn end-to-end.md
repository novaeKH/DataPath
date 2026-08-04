---
title: Итоговый кейс — Churn end-to-end
id: case.classic-ml.churn-end-to-end
schema_version: 2
type: practice
practice_kind: module-case
area: ml
status: active
language: ru
rag: include
rag_collection: practice
app: include
course_id: course.classic-ml
module_order: 5
skill_ids:
- ml.problem_framing
- ml.validation_split
- ml.data_leakage
- ml.metrics_threshold
- ml.linear_logistic_models
- ml.tree_ensembles
- ml.error_analysis
estimated_minutes: 150
difficulty: standard
modes:
- guided
- standard
- interview
- real-world
source_ids:
- sklearn-user-guide
- google-mlcc
- islr
tags:
- practice/case
- course/classical-ml
cssclasses:
- course-case
---

# Итоговый кейс — Churn end-to-end

> [!case] Контекст
> От постановки задачи до защиты решения: определить cutoff, собрать признаки, построить baseline, сравнить модели, выбрать threshold, проанализировать ошибки и подготовить короткий model card.

## Что нужно сдать

- prediction contract
- reproducible pipeline
- model comparison
- threshold policy
- error analysis
- model card

## Режимы

- **Guided:** этапы и ограниченные подсказки.
- **Standard:** контрольные точки без готового плана.
- **Interview:** устная защита и follow-up.
- **Real-world:** часть проблем нужно обнаружить самостоятельно.

## Контракт приложения

```datapath-case
{
  "schema_version": 1,
  "case_id": "case.classic-ml.churn-end-to-end",
  "modes": [
    "guided",
    "standard",
    "interview",
    "real-world"
  ],
  "evidence": [
    "prediction contract",
    "reproducible pipeline",
    "model comparison",
    "threshold policy",
    "error analysis",
    "model card"
  ],
  "assistant_policy": {
    "guided": "давать следующий шаг, но не готовое решение",
    "standard": "отвечать только на конкретный вопрос",
    "interview": "задавать follow-up и проверять допущения",
    "real-world": "не раскрывать все проблемы заранее"
  }
}
```

## Критерий завершения

Решение воспроизводимо, допущения названы, validation соответствует моменту использования модели, а выводы не выходят за пределы полученных данных.
