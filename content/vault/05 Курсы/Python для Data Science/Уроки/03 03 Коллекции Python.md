---
title: 03 Коллекции Python
id: lesson.python-ds.03
schema_version: 2
type: lesson
area: python-ds
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.python-ds
module_id: module.python-ds.basics
module_order: 1
lesson_order: 3
content_path: 10 Знания/Python/03_Dict_Set_Hash_Map.md
skill_ids:
- python.03-dict-set-i-hash-map
estimated_minutes: 35
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 03 Коллекции Python

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python/03_Dict_Set_Hash_Map.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Модель хеш-таблицы"
    },
    {
      "type": "content",
      "source_heading": "Коллизии"
    },
    {
      "type": "content",
      "source_heading": "Hashable-ключ"
    },
    {
      "type": "content",
      "source_heading": "Dict и порядок"
    },
    {
      "type": "content",
      "source_heading": "Set против dict"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Переносимые шаблоны"
    },
    {
      "type": "content",
      "source_heading": "Почему поиск не «гарантированно O(1)»"
    },
    {
      "type": "content",
      "source_heading": "Где это встречается в Data Science"
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
