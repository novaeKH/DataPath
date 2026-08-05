---
title: 08 Decorators и closures
id: lesson.python-ds.08
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
lesson_order: 4
content_path: 10 Знания/Python/08_Декораторы_и_замыкания.md
skill_ids:
- python.08-dekoratory-i-zamykaniia
estimated_minutes: 35
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 08 Decorators и closures

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python/08_Декораторы_и_замыкания.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Функция как объект"
    },
    {
      "type": "content",
      "source_heading": "Вложенная функция и замыкание"
    },
    {
      "type": "content",
      "source_heading": "Что делает декоратор"
    },
    {
      "type": "content",
      "source_heading": "Сохранение метаданных"
    },
    {
      "type": "content",
      "source_heading": "Декоратор с параметрами"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Применение в DS/ML"
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
