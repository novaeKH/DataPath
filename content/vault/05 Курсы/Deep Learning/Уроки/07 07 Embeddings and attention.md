---
title: 07 Embeddings and attention
id: lesson.deep-learning.07
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
lesson_order: 1
content_path: 10 Знания/ML/02 Deep Learning/04 Теория/Embeddings and Attention.md
skill_ids:
- dl.foundations
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 07 Embeddings and attention

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/02 Deep Learning/04 Теория/Embeddings and Attention.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Embedding с нуля"
    },
    {
      "type": "content",
      "source_heading": "Static и contextual embeddings"
    },
    {
      "type": "content",
      "source_heading": "Зачем attention"
    },
    {
      "type": "interactive",
      "component": "attention-matrix-lab"
    },
    {
      "type": "content",
      "source_heading": "Scaled dot-product attention"
    },
    {
      "type": "content",
      "source_heading": "Почему scale"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Masks"
    },
    {
      "type": "content",
      "source_heading": "Multi-head"
    },
    {
      "type": "content",
      "source_heading": "Cross-attention"
    },
    {
      "type": "content",
      "source_heading": "Complexity"
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
