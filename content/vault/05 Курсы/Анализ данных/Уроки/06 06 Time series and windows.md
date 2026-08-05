---
title: 06 Time series and windows
id: lesson.data-analysis.06
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
lesson_order: 4
content_path: 10 Знания/Python Libraries/Pandas/pandas Time Series and Window Functions.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 06 Time series and windows

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python Libraries/Pandas/pandas Time Series and Window Functions.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Даты как тип, а не строка"
    },
    {
      "type": "content",
      "source_heading": "Извлечение признаков"
    },
    {
      "type": "content",
      "source_heading": "Временной индекс и resample"
    },
    {
      "type": "interactive",
      "component": "time-window-lab"
    },
    {
      "type": "content",
      "source_heading": "Rolling window"
    },
    {
      "type": "content",
      "source_heading": "Grouped rolling"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "`shift`, `diff`, `pct_change`"
    },
    {
      "type": "content",
      "source_heading": "Cutoff и leakage"
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
