---
title: 11 Relationships time groups
id: lesson.data-analysis.11
schema_version: 2
type: lesson
area: data-analysis
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.data-analysis
module_id: module.data-analysis.eda
module_order: 4
lesson_order: 3
content_path: 10 Знания/Data Analysis/EDA/EDA Relationships Time and Groups.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 11 Relationships time groups

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Data Analysis/EDA/EDA Relationships Time and Groups.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Связь не равна причинности"
    },
    {
      "type": "content",
      "source_heading": "Numerical–numerical"
    },
    {
      "type": "content",
      "source_heading": "Numerical–categorical"
    },
    {
      "type": "interactive",
      "component": "relationship-plot-lab"
    },
    {
      "type": "content",
      "source_heading": "Categorical–categorical"
    },
    {
      "type": "content",
      "source_heading": "Высокая cardinality"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Время"
    },
    {
      "type": "content",
      "source_heading": "Groups и повторные наблюдения"
    },
    {
      "type": "content",
      "source_heading": "Simpson's paradox"
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

## Статус

Контент готов как draft route. Включать в приложение после реализации реальных checkpoint и visual components.
