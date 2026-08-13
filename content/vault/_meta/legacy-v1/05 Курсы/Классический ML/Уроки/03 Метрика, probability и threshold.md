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
      "type": "interactive",
      "component": "threshold-cost-explorer"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему ROC-AUC и precision отвечают на разные вопросы?"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Выбери metric и threshold policy для ручной проверки 500 клиентов в неделю при редком positive class."
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
