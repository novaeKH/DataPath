---
title: "Память, garbage collection и GIL — что нужно Data Scientist"
id: lesson.python-ds.09
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.python-ds
module_id: module.python-ds.reliability
module_order: 3
lesson_order: 3
canonical_number: 8
content_path: 10 Знания/DataPath v2/01_Python_Core_DataPath_v2/source-008 Память, garbage collection и GIL — что нужно Data Scientist.md
estimated_minutes: 30
difficulty: foundation
skill_ids:
- python.09-pamiat-gc-i-gil
prerequisites:
- lesson.python-ds.02
- lesson.python-ds.05
previous: lesson.python-ds.11
next: lesson.data-analysis.01
tags:
- datapath/v2
- canonical/lesson
---
# Память, garbage collection и GIL — что нужно Data Scientist

## Результат урока

После урока вы сможете:

- Объяснять время жизни объектов и измерять выделение памяти.
- Различать задачи для потоков, процессов и асинхронного ввода-вывода.

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
      "component": "python-memory-gil-flow",
      "title": "Интерактивная схема темы"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Память, garbage collection и GIL — что нужно Data Scientist» без подсказки?"
    }
  ]
}
```
