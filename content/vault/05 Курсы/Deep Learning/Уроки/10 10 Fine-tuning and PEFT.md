---
title: 10 Fine-tuning and PEFT
id: lesson.deep-learning.10
schema_version: 2
type: lesson
area: deep-learning
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.deep-learning
module_id: module.dl.training
module_order: 4
lesson_order: 2
content_path: 10 Знания/ML/02 Deep Learning/04 Теория/Fine-Tuning Transfer Learning and PEFT.md
  and PEFT.md
skill_ids:
- dl.foundations
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 10 Fine-tuning and PEFT

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/02 Deep Learning/04 Теория/Fine-Tuning Transfer Learning and PEFT.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Transfer learning"
    },
    {
      "type": "content",
      "source_heading": "Feature extractor"
    },
    {
      "type": "content",
      "source_heading": "Full fine-tuning"
    },
    {
      "type": "interactive",
      "component": "fine-tuning-parameter-budget"
    },
    {
      "type": "content",
      "source_heading": "Gradual unfreezing"
    },
    {
      "type": "content",
      "source_heading": "LoRA"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "QLoRA"
    },
    {
      "type": "content",
      "source_heading": "Data format и loss mask"
    },
    {
      "type": "content",
      "source_heading": "Evaluation"
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
