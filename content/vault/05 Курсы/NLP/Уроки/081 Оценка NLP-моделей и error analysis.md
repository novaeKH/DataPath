---
title: "Оценка NLP-моделей и error analysis"
id: lesson.nlp.evaluation
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.nlp
module_id: module.nlp.workflow
module_order: 3
lesson_order: 1
canonical_number: 81
content_path: 10 Знания/DataPath v2/13_NLP_DataPath_v2/source-081 Оценка NLP-моделей и error analysis.md
estimated_minutes: 30
difficulty: core
skill_ids:
- datapath.v2.081
prerequisites:
- lesson.classic-ml.framing.metrics
- lesson.nlp.bert-evaluation
previous: lesson.nlp.bert-evaluation
next: lesson.nlp.end-to-end
tags:
- datapath/v2
- canonical/lesson
---
# Оценка NLP-моделей и error analysis

## Результат урока

После урока вы сможете:

- Рассчитывать и интерпретировать метрики по классам.
- Проводить парный анализ ошибок и учитывать зависимость примеров.

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
      "component": "nlp-error-analysis-flow",
      "title": "Интерактивная схема темы"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Оценка NLP-моделей и error analysis» без подсказки?"
    }
  ]
}
```
