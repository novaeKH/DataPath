---
title: 12 Python for Data Science workflow
id: lesson.python-ds.12
schema_version: 2
type: lesson
area: python-ds
status: active
language: ru
rag: exclude
app: include
course_id: course.python-ds
module_id: module.python-ds.quality
module_order: 3
lesson_order: 5
content_path: 10 Знания/Python/10_Python_для_Data_Science.md
skill_ids:
- python.10-python-dlia-data-science
estimated_minutes: 35
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 12 Python for Data Science workflow

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python/10_Python_для_Data_Science.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Реши небольшой пример и объясни каждый шаг."
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Дай краткий ответ: что это, как работает, ограничения и применение."
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```
