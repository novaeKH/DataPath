---
title: "Pipeline и ColumnTransformer: preprocessing без leakage"
id: lesson.data-tools.preprocessing
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.data-tools
module_id: module.data-tools.sklearn-api
module_order: 3
lesson_order: 2
canonical_number: 35
content_path: 10 Знания/DataPath v2/06_scikit_learn_DataPath_v2/source-035 Pipeline и ColumnTransformer preprocessing без leakage.md
estimated_minutes: 30
difficulty: core
skill_ids:
- data-tools.preprocessing
prerequisites:
- lesson.data-tools.estimator-pipeline
previous: lesson.data-tools.estimator-pipeline
next: lesson.data-tools.cv-tuning
tags:
- datapath/v2
- canonical/lesson
---
# Pipeline и ColumnTransformer: preprocessing без leakage

## Результат урока

После урока вы сможете:

- Собрать Pipeline с разными преобразованиями столбцов.
- Проверять пропуски, неизвестные категории и отсутствие утечки.

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
      "component": "preprocessing-pipeline-builder"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Pipeline и ColumnTransformer: preprocessing без leakage» без подсказки?"
    }
  ]
}
```
