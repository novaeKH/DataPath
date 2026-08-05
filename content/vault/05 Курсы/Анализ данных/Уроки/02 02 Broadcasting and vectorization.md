---
title: 02 Broadcasting and vectorization
id: lesson.data-analysis.02
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
lesson_order: 2
content_path: 10 Знания/Python Libraries/NumPy/NumPy Indexing Broadcasting and Vectorization.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 02 Broadcasting and vectorization

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python Libraries/NumPy/NumPy Indexing Broadcasting and Vectorization.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Basic, fancy и boolean indexing"
    },
    {
      "type": "content",
      "source_heading": "Broadcasting"
    },
    {
      "type": "content",
      "source_heading": "Векторизация"
    },
    {
      "type": "interactive",
      "component": "numpy-broadcasting-lab"
    },
    {
      "type": "content",
      "source_heading": "Условные выражения"
    },
    {
      "type": "content",
      "source_heading": "Pairwise computations"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Matrix multiplication"
    },
    {
      "type": "content",
      "source_heading": "Производительность"
    },
    {
      "type": "content",
      "source_heading": "Численная устойчивость"
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
