---
title: Метрика, probability и threshold
id: lesson.classic-ml.framing.metrics
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.framing
module_order: 1
lesson_order: 3
content_path: 10 Знания/ML/05 Metrics and Validation/ML Metrics and Threshold Selection.md
skill_ids:
- ml.metrics_threshold
estimated_minutes: 45
difficulty: core
interactive_component: threshold-cost-explorer
source_ids:
- sklearn-user-guide
- google-mlcc
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Метрика, probability и threshold

## Результат урока

- отличить ranking, probability и decision metrics
- читать confusion matrix
- выбрать threshold по стоимости или constraint

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/05 Metrics and Validation/ML Metrics and Threshold Selection.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "content",
      "source_heading": "Идея за 30 секунд"
    },
    {
      "type": "content",
      "source_heading": "Сначала определить, что оцениваем"
    },
    {
      "type": "content",
      "source_heading": "Confusion matrix"
    },
    {
      "type": "interactive",
      "component": "threshold-cost-explorer"
    },
    {
      "type": "content",
      "source_heading": "Accuracy и balanced accuracy"
    },
    {
      "type": "content",
      "source_heading": "ROC-AUC"
    },
    {
      "type": "content",
      "source_heading": "Визуализация"
    },
    {
      "type": "content",
      "source_heading": "Частые ошибки"
    },
    {
      "type": "content",
      "source_heading": "Сравнение метрик"
    },
    {
      "type": "content",
      "source_heading": "Простой пример"
    },
    {
      "type": "content",
      "source_heading": "Пример кода"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему ROC-AUC и precision отвечают на разные вопросы?"
    },
    {
      "type": "content",
      "source_heading": "Precision–Recall и PR-AUC"
    },
    {
      "type": "content",
      "source_heading": "LogLoss и Brier score"
    },
    {
      "type": "content",
      "source_heading": "Threshold selection"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Выбери metric и threshold policy для ручной проверки 500 клиентов в неделю при редком positive class."
    },
    {
      "type": "content",
      "source_heading": "Multiclass averaging"
    },
    {
      "type": "content",
      "source_heading": "Regression metrics"
    },
    {
      "type": "content",
      "source_heading": "Связь с бизнесом"
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Почему threshold 0.5 не универсален и когда PR-AUC полезнее ROC-AUC?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Почему ROC-AUC и precision отвечают на разные вопросы?
2. Выбери metric и threshold policy для ручной проверки 500 клиентов в неделю при редком positive class.
3. Почему threshold 0.5 не универсален и когда PR-AUC полезнее ROC-AUC?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
