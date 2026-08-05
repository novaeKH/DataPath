---
title: 15 Naive Bayes
id: lesson.classic-ml.expansion.15
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
lesson_order: 15
content_path: 10 Знания/ML/01 Classical ML/Naive Bayes.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 15 Naive Bayes

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Naive Bayes.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Идея"
    },
    {
      "type": "content",
      "source_heading": "Пошаговый пример"
    },
    {
      "type": "content",
      "source_heading": "Варианты"
    },
    {
      "type": "interactive",
      "component": "naive-bayes-evidence-lab"
    },
    {
      "type": "content",
      "source_heading": "Smoothing"
    },
    {
      "type": "content",
      "source_heading": "Почему работает"
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
      "source_heading": "Priors и imbalance"
    },
    {
      "type": "content",
      "source_heading": "Text pipeline"
    },
    {
      "type": "content",
      "source_heading": "Calibration"
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
