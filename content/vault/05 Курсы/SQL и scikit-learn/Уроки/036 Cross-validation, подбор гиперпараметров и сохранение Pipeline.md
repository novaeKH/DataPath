---
title: "Cross-validation, подбор гиперпараметров и сохранение Pipeline"
id: lesson.data-tools.cv-tuning
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.data-tools
module_id: module.data-tools.sklearn-validation
module_order: 4
lesson_order: 1
canonical_number: 36
content_path: 10 Знания/DataPath v2/06_scikit_learn_DataPath_v2/source-036 Cross-validation, подбор гиперпараметров и сохранение Pipeline.md
estimated_minutes: 30
difficulty: core
skill_ids:
- data-tools.cv-tuning
prerequisites:
- lesson.data-tools.preprocessing
previous: lesson.data-tools.preprocessing
next: lesson.classic-ml.framing.problem
tags:
- datapath/v2
- canonical/lesson
---
# Cross-validation, подбор гиперпараметров и сохранение Pipeline

## Результат урока

После урока вы сможете:

- Проверять всю процедуру внутри кросс-валидации.
- Отделять подбор настроек от финального теста и сохранять весь Pipeline.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_revision": "theory-2026-09",
  "scenes": [
    {
      "type": "hook",
      "title": "Цель главы"
    },
    {
      "type": "visual_demo",
      "component": "hyperparameter-search-landscape"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Cross-validation, подбор гиперпараметров и сохранение Pipeline» без подсказки?"
    }
  ]
}
```
