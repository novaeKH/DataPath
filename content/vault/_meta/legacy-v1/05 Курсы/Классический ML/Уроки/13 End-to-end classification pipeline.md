---
title: End-to-end classification pipeline
id: lesson.classic-ml.end-to-end.pipeline
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.end-to-end
module_order: 5
lesson_order: 1
content_path: 15 Практика/sklearn/sklearn End-to-End Classification — Practice.md
skill_ids:
- ml.problem_framing
- ml.validation_split
- ml.data_leakage
- ml.metrics_threshold
- ml.error_analysis
estimated_minutes: 60
difficulty: core
interactive_component: pipeline-builder
source_ids:
- sklearn-user-guide
- made-with-ml
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# End-to-end classification pipeline

## Результат урока

- собрать validation-safe preprocessing и model
- получить out-of-fold/validation probabilities
- выбрать threshold и сохранить полный pipeline

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "15 Практика/sklearn/sklearn End-to-End Classification — Practice.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "interactive",
      "component": "pipeline-builder-lab"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Какие transformations должны fit только на train и почему estimator без preprocessing не является полным объектом оценки?"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Собери план pipeline для mixed numeric/categorical dataset и перечисли артефакты финального эксперимента."
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Расскажите end-to-end процесс от raw data до честной test оценки."
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Какие transformations должны fit только на train и почему estimator без preprocessing не является полным объектом оценки?
2. Собери план pipeline для mixed numeric/categorical dataset и перечисли артефакты финального эксперимента.
3. Расскажите end-to-end процесс от raw data до честной test оценки.

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
