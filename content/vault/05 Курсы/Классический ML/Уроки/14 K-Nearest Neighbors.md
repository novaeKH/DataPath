---
title: 14 K-Nearest Neighbors
id: lesson.classic-ml.expansion.14
schema_version: 2
type: lesson
area: classic-ml
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.classic-ml
module_id: module.classic-ml.additional-models
module_order: 6
lesson_order: 14
content_path: 10 Знания/ML/01 Classical ML/K-Nearest Neighbors.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 14 K-Nearest Neighbors

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/K-Nearest Neighbors.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Интуиция"
    },
    {
      "type": "content",
      "source_heading": "Алгоритм"
    },
    {
      "type": "content",
      "source_heading": "Distance"
    },
    {
      "type": "interactive",
      "component": "knn-neighbourhood-lab"
    },
    {
      "type": "content",
      "source_heading": "Почему scaling критичен"
    },
    {
      "type": "content",
      "source_heading": "Выбор K"
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
      "source_heading": "Curse of dimensionality"
    },
    {
      "type": "content",
      "source_heading": "Complexity"
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
