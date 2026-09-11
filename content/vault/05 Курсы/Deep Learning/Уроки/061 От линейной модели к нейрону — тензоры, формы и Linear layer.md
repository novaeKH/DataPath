---
title: "От линейной модели к нейрону — тензоры, формы и Linear layer"
id: lesson.deep-learning.01
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.deep-learning
module_id: module.deep-learning.foundations
module_order: 1
lesson_order: 1
canonical_number: 61
content_path: 10 Знания/DataPath v2/11_DL_Foundations_DataPath_v2/source-061 От линейной модели к нейрону — тензоры, формы и Linear layer.md
estimated_minutes: 25
difficulty: foundation
skill_ids:
- dl.foundations
prerequisites:
- lesson.math-ds.gradients
- lesson.classic-ml.linear.regression
previous: lesson.classic-ml.end-to-end.pipeline
next: lesson.deep-learning.02
tags:
- datapath/v2
- canonical/lesson
---
# От линейной модели к нейрону — тензоры, формы и Linear layer

## Результат урока

После урока вы сможете:

- Проследить формы от пакета данных до линейного слоя.
- Вычислить выход нейрона и найти опасное broadcasting в loss.

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
      "component": "neuron-computation-lab"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «От линейной модели к нейрону — тензоры, формы и Linear layer» без подсказки?"
    }
  ]
}
```
