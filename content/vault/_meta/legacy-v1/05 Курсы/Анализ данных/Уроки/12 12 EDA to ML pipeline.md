---
title: 12 EDA to ML pipeline
id: lesson.data-analysis.12
schema_version: 2
type: lesson
area: data-analysis
status: active
language: ru
rag: exclude
app: include
course_id: course.data-analysis
module_id: module.data-analysis.eda
module_order: 4
lesson_order: 4
content_path: 10 Знания/Data Analysis/EDA/From EDA to ML Pipeline.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 12 EDA to ML pipeline

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Data Analysis/EDA/From EDA to ML Pipeline.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "interactive",
      "component": "eda-to-pipeline-builder"
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
