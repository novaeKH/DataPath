---
title: 16 Support Vector Machines
id: lesson.classic-ml.expansion.16
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
lesson_order: 16
content_path: 10 Знания/ML/01 Classical ML/Support Vector Machines.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 16 Support Vector Machines

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Support Vector Machines.md",
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
      "source_heading": "Linear hard-margin SVM"
    },
    {
      "type": "content",
      "source_heading": "Soft margin"
    },
    {
      "type": "interactive",
      "component": "svm-margin-kernel-lab"
    },
    {
      "type": "content",
      "source_heading": "Hinge loss"
    },
    {
      "type": "content",
      "source_heading": "Kernel trick"
    },
    {
      "type": "content",
      "source_heading": "Частые ошибки"
    },
    {
      "type": "content",
      "source_heading": "sklearn пример"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Scaling"
    },
    {
      "type": "content",
      "source_heading": "Probability"
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
