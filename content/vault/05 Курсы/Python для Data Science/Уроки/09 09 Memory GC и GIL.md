---
title: 09 Memory GC и GIL
id: lesson.python-ds.09
schema_version: 2
type: lesson
area: python-ds
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.python-ds
module_id: module.python-ds.quality
module_order: 3
lesson_order: 2
content_path: 10 Знания/Python/09_Память_GC_GIL.md
skill_ids:
- python.09-pamiat-gc-i-gil
estimated_minutes: 35
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 09 Memory GC и GIL

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python/09_Память_GC_GIL.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Модель памяти без магии"
    },
    {
      "type": "content",
      "source_heading": "Подсчёт ссылок"
    },
    {
      "type": "content",
      "source_heading": "Циклический garbage collector"
    },
    {
      "type": "content",
      "source_heading": "GIL"
    },
    {
      "type": "content",
      "source_heading": "Threads, processes, async"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Память в Data Science"
    },
    {
      "type": "content",
      "source_heading": "Профилирование"
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
