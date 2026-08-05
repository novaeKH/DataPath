---
title: 08 Transformer and language modeling
id: lesson.deep-learning.08
schema_version: 2
type: lesson
area: deep-learning
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.deep-learning
module_id: module.dl.transformers
module_order: 3
lesson_order: 2
content_path: 10 Знания/ML/02 Deep Learning/04 Теория/Transformer and Language Modeling.md
skill_ids:
- dl.foundations
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 08 Transformer and language modeling

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/02 Deep Learning/04 Теория/Transformer and Language Modeling.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Общая схема"
    },
    {
      "type": "content",
      "source_heading": "Tokenization"
    },
    {
      "type": "content",
      "source_heading": "Input representation"
    },
    {
      "type": "interactive",
      "component": "transformer-block-lab"
    },
    {
      "type": "content",
      "source_heading": "Pre-Norm block"
    },
    {
      "type": "content",
      "source_heading": "Feed-forward network"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Causal language modeling"
    },
    {
      "type": "content",
      "source_heading": "Perplexity"
    },
    {
      "type": "content",
      "source_heading": "Generation"
    },
    {
      "type": "content",
      "source_heading": "KV cache"
    },
    {
      "type": "content",
      "source_heading": "Training stages"
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
