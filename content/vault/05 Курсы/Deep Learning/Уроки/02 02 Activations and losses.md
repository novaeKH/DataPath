---
title: 02 Activations and losses
id: lesson.deep-learning.02
schema_version: 2
type: lesson
area: deep-learning
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.deep-learning
module_id: module.dl.foundations
module_order: 1
lesson_order: 2
content_path: 10 Знания/ML/02 Deep Learning/04 Теория/Activation Functions and Losses.md
skill_ids:
- dl.foundations
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 02 Activations and losses

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/02 Deep Learning/04 Теория/Activation Functions and Losses.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Зачем нужна activation"
    },
    {
      "type": "content",
      "source_heading": "ReLU"
    },
    {
      "type": "content",
      "source_heading": "Leaky ReLU, GELU, SiLU"
    },
    {
      "type": "interactive",
      "component": "activation-loss-explorer"
    },
    {
      "type": "content",
      "source_heading": "Output layer и loss должны совпадать"
    },
    {
      "type": "content",
      "source_heading": "Logits, probabilities, predictions"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Cross-entropy как likelihood"
    },
    {
      "type": "content",
      "source_heading": "Class weights"
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
