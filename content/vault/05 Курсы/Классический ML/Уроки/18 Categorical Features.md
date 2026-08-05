---
title: 18 Categorical Features
id: lesson.classic-ml.expansion.18
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
lesson_order: 18
content_path: 10 Знания/ML/01 Основы/Интервью/Categorical Features.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 18 Categorical Features

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Основы/Интервью/Categorical Features.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "1. Что считать категорией"
    },
    {
      "type": "content",
      "source_heading": "2. One-Hot Encoding"
    },
    {
      "type": "content",
      "source_heading": "3. Ordinal Encoding"
    },
    {
      "type": "interactive",
      "component": "categorical-encoding-lab"
    },
    {
      "type": "content",
      "source_heading": "5. Frequency / Count Encoding"
    },
    {
      "type": "content",
      "source_heading": "6. Target / Mean Encoding"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "7. Leave-one-out и ordered encoding"
    },
    {
      "type": "content",
      "source_heading": "9. Native categorical handling"
    },
    {
      "type": "content",
      "source_heading": "11. Новые категории на production"
    },
    {
      "type": "content",
      "source_heading": "13. Практический выбор"
    },
    {
      "type": "content",
      "source_heading": "14. Типичные ошибки"
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
