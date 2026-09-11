---
title: "Итераторы и генераторы: как Python обрабатывает данные лениво"
id: lesson.python-ds.05
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.python-ds
module_id: module.python-ds.protocols
module_order: 2
lesson_order: 1
canonical_number: 4
content_path: 10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-004 Итераторы и генераторы как Python обрабатывает данные лениво.md
estimated_minutes: 25
difficulty: foundation
skill_ids:
- python.05-iterable-iterator-i-generator
prerequisites:
- lesson.python-ds.04
previous: lesson.python-ds.04
next: lesson.python-ds.06
tags:
- datapath/v2
- canonical/lesson
---
# Итераторы и генераторы: как Python обрабатывает данные лениво

## Результат урока

После урока вы сможете:

- Прослеживать состояние итератора и выполнение yield.
- Строить поток обработки и замечать, где данные материализуются в памяти.

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
      "component": "python-iterator-pipeline-flow",
      "title": "Интерактивная схема темы"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Итераторы и генераторы: как Python обрабатывает данные лениво» без подсказки?"
    }
  ]
}
```
