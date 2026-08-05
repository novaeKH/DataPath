---
title: 01 NumPy foundations
id: lesson.data-analysis.01
schema_version: 2
type: lesson
area: data-analysis
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.data-analysis
module_id: module.data-analysis.numpy
module_order: 1
lesson_order: 1
content_path: 10 Знания/Python Libraries/NumPy/NumPy Foundations.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 01 NumPy foundations

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python Libraries/NumPy/NumPy Foundations.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Зачем NumPy"
    },
    {
      "type": "content",
      "source_heading": "Создание массива"
    },
    {
      "type": "content",
      "source_heading": "Shape и оси"
    },
    {
      "type": "interactive",
      "component": "numpy-array-lab"
    },
    {
      "type": "content",
      "source_heading": "Dtype"
    },
    {
      "type": "content",
      "source_heading": "Индексация"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Векторные операции"
    },
    {
      "type": "content",
      "source_heading": "Boolean mask"
    },
    {
      "type": "content",
      "source_heading": "Reshape и transpose"
    },
    {
      "type": "content",
      "source_heading": "Random generator"
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
