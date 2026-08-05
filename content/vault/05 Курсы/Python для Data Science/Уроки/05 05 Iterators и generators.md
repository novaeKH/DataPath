---
title: 05 Iterators и generators
id: lesson.python-ds.05
schema_version: 2
type: lesson
area: python-ds
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.python-ds
module_id: module.python-ds.structure
module_order: 2
lesson_order: 2
content_path: 10 Знания/Python/05_Iterable_Iterator_Generator.md
skill_ids:
- python.05-iterable-iterator-i-generator
estimated_minutes: 35
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 05 Iterators и generators

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python/05_Iterable_Iterator_Generator.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Три понятия"
    },
    {
      "type": "content",
      "source_heading": "Что делает `for`"
    },
    {
      "type": "content",
      "source_heading": "Свой iterator через класс"
    },
    {
      "type": "content",
      "source_heading": "Generator function и `yield`"
    },
    {
      "type": "content",
      "source_heading": "`yield from`"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Потоковое чтение файла"
    },
    {
      "type": "content",
      "source_heading": "Память: список против генератора"
    },
    {
      "type": "content",
      "source_heading": "Когда generator неудобен"
    },
    {
      "type": "content",
      "source_heading": "Исчерпание"
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
