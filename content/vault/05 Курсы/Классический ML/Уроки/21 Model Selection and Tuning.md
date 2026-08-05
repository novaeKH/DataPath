---
title: 21 Model Selection and Tuning
id: lesson.classic-ml.expansion.21
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
lesson_order: 21
content_path: 10 Знания/ML/01 Classical ML/Model Selection and Hyperparameter Tuning.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 21 Model Selection and Tuning

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Model Selection and Hyperparameter Tuning.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Что выбирается"
    },
    {
      "type": "content",
      "source_heading": "Search space"
    },
    {
      "type": "content",
      "source_heading": "Grid и random search"
    },
    {
      "type": "interactive",
      "component": "hyperparameter-search-landscape"
    },
    {
      "type": "content",
      "source_heading": "Nested CV"
    },
    {
      "type": "content",
      "source_heading": "Early stopping"
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
      "source_heading": "Multiple comparisons"
    },
    {
      "type": "content",
      "source_heading": "Практический порядок"
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
