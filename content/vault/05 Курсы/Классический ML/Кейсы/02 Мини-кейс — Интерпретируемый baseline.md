---
title: Мини-кейс — Интерпретируемый baseline
id: case.classic-ml.interpretable-baseline
schema_version: 2
type: practice
practice_kind: mini-case
area: ml
status: active
language: ru
rag: include
rag_collection: practice
app: include
course_id: course.classic-ml
module_order: 2
skill_ids:
- ml.linear_logistic_models
- ml.bias_variance_regularization
- ml.metrics_threshold
estimated_minutes: 45
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

# Мини-кейс — Интерпретируемый baseline

> [!case] Контекст
> Для отклика на предложение построить Logistic Regression baseline, обработать категории внутри pipeline, выбрать регуляризацию и объяснить коэффициенты без причинных утверждений.

## Что нужно сдать

- pipeline
- validation score
- таблица коэффициентов
- ограничения интерпретации

## Режимы

- **Guided:** этапы и ограниченные подсказки.
- **Standard:** контрольные точки без готового плана.
- **Interview:** устная защита и follow-up.
- **Real-world:** часть проблем нужно обнаружить самостоятельно.

## Контракт приложения

```datapath-case
{
  "schema_version": 1,
  "case_id": "case.classic-ml.interpretable-baseline",
  "modes": [
    "guided",
    "standard",
    "interview",
    "real-world"
  ],
  "evidence": [
    "pipeline",
    "validation score",
    "таблица коэффициентов",
    "ограничения интерпретации"
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
