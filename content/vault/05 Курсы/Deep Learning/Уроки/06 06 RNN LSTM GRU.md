---
title: 06 RNN LSTM GRU
id: lesson.deep-learning.06
schema_version: 2
type: lesson
area: deep-learning
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.deep-learning
module_id: module.dl.architectures
module_order: 2
lesson_order: 2
content_path: 10 Знания/ML/02 Deep Learning/04 Теория/Recurrent Networks LSTM and GRU.md
  GRU.md
skill_ids:
- dl.foundations
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 06 RNN LSTM GRU

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/02 Deep Learning/04 Теория/Recurrent Networks LSTM and GRU.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Зачем sequence model"
    },
    {
      "type": "content",
      "source_heading": "Vanilla RNN"
    },
    {
      "type": "content",
      "source_heading": "LSTM"
    },
    {
      "type": "interactive",
      "component": "rnn-state-gates-lab"
    },
    {
      "type": "content",
      "source_heading": "GRU"
    },
    {
      "type": "content",
      "source_heading": "Shapes и PyTorch"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Many-to-one и many-to-many"
    },
    {
      "type": "content",
      "source_heading": "Teacher forcing"
    },
    {
      "type": "content",
      "source_heading": "Когда RNN всё ещё полезна"
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
