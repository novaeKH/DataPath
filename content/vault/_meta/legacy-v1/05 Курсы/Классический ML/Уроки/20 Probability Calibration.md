---
title: 20 Probability Calibration
id: lesson.classic-ml.expansion.20
schema_version: 2
type: lesson
area: classic-ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.production
module_order: 7
lesson_order: 20
content_path: 10 Знания/ML/01 Classical ML/Probability Calibration.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/lesson
---

# 20 Probability Calibration

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Probability Calibration.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "interactive",
      "component": "calibration-reliability-lab"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
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
