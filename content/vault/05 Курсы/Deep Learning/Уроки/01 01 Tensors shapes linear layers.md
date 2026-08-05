---
title: 01 Tensors shapes linear layers
id: lesson.deep-learning.01
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
lesson_order: 1
content_path: 10 Знания/ML/02 Deep Learning/04 Теория/Tensors Shapes and Linear Layers.md
skill_ids:
- dl.foundations
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 01 Tensors shapes linear layers

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/02 Deep Learning/04 Теория/Tensors Shapes and Linear Layers.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Почему всё начинается с shape"
    },
    {
      "type": "content",
      "source_heading": "Создание Tensor"
    },
    {
      "type": "content",
      "source_heading": "Dtype"
    },
    {
      "type": "interactive",
      "component": "tensor-shape-tracer"
    },
    {
      "type": "content",
      "source_heading": "Device"
    },
    {
      "type": "content",
      "source_heading": "Reshape"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Linear layer"
    },
    {
      "type": "content",
      "source_heading": "Batch dimension"
    },
    {
      "type": "content",
      "source_heading": "Broadcasting"
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
