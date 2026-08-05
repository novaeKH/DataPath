---
title: 17 Preprocessing and Feature Engineering
id: lesson.classic-ml.expansion.17
schema_version: 2
type: lesson
area: classic-ml
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.classic-ml
module_id: module.classic-ml.production
module_order: 7
lesson_order: 17
content_path: 10 Знания/ML/01 Classical ML/Data Preprocessing and Feature Engineering.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 17 Preprocessing and Feature Engineering

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Data Preprocessing and Feature Engineering.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Зачем нужен preprocessing"
    },
    {
      "type": "content",
      "source_heading": "Главное правило"
    },
    {
      "type": "content",
      "source_heading": "Numerical features"
    },
    {
      "type": "interactive",
      "component": "preprocessing-pipeline-builder"
    },
    {
      "type": "content",
      "source_heading": "Categorical features"
    },
    {
      "type": "content",
      "source_heading": "Date and time"
    },
    {
      "type": "content",
      "source_heading": "Частые ошибки"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Aggregations"
    },
    {
      "type": "content",
      "source_heading": "Feature selection"
    },
    {
      "type": "content",
      "source_heading": "ColumnTransformer пример"
    },
    {
      "type": "content",
      "source_heading": "Train-serving consistency"
    },
    {
      "type": "content",
      "source_heading": "Визуализация"
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
