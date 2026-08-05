---
title: 05 GroupBy merge reshape
id: lesson.data-analysis.05
schema_version: 2
type: lesson
area: data-analysis
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.data-analysis
module_id: module.data-analysis.pandas
module_order: 2
lesson_order: 3
content_path: 10 Знания/Python Libraries/Pandas/pandas GroupBy Merge and Reshape.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 05 GroupBy merge reshape

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python Libraries/Pandas/pandas GroupBy Merge and Reshape.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "GroupBy: split–apply–combine"
    },
    {
      "type": "content",
      "source_heading": "`agg` и `transform`"
    },
    {
      "type": "content",
      "source_heading": "Merge"
    },
    {
      "type": "interactive",
      "component": "groupby-merge-lab"
    },
    {
      "type": "content",
      "source_heading": "Диагностика join"
    },
    {
      "type": "content",
      "source_heading": "Опасность many-to-many"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "`concat`"
    },
    {
      "type": "content",
      "source_heading": "Pivot и melt"
    },
    {
      "type": "content",
      "source_heading": "Cumulative и rolling признаки"
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
