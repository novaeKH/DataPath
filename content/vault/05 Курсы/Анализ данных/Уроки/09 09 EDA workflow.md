---
title: 09 EDA workflow
id: lesson.data-analysis.09
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
lesson_order: 1
content_path: 10 Знания/Data Analysis/EDA/Exploratory Data Analysis Workflow.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 09 EDA workflow

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Data Analysis/EDA/Exploratory Data Analysis Workflow.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Что такое EDA"
    },
    {
      "type": "content",
      "source_heading": "Шаг 1. Сформулировать задачу"
    },
    {
      "type": "content",
      "source_heading": "Шаг 2. Инвентаризация таблиц"
    },
    {
      "type": "interactive",
      "component": "eda-workflow-board"
    },
    {
      "type": "content",
      "source_heading": "Шаг 3. Проверка target"
    },
    {
      "type": "content",
      "source_heading": "Шаг 4. Data quality"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Шаг 5. Univariate analysis"
    },
    {
      "type": "content",
      "source_heading": "Шаг 6. Relationships"
    },
    {
      "type": "content",
      "source_heading": "Шаг 7. Leakage audit"
    },
    {
      "type": "content",
      "source_heading": "Шаг 8. Split и baseline"
    },
    {
      "type": "content",
      "source_heading": "Шаг 9. Зафиксировать выводы"
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
