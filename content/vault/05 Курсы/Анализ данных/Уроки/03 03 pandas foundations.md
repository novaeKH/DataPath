---
title: 03 pandas foundations
id: lesson.data-analysis.03
schema_version: 2
type: lesson
area: data-analysis
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.data-analysis
module_id: module.data-analysis.pandas
module_order: 2
lesson_order: 1
content_path: 10 Знания/Python Libraries/Pandas/pandas Foundations and Selection.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 03 pandas foundations

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Python Libraries/Pandas/pandas Foundations and Selection.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Зачем pandas"
    },
    {
      "type": "content",
      "source_heading": "Создание и чтение"
    },
    {
      "type": "content",
      "source_heading": "Grain и ключ"
    },
    {
      "type": "interactive",
      "component": "dataframe-selection-lab"
    },
    {
      "type": "content",
      "source_heading": "Выбор колонок"
    },
    {
      "type": "content",
      "source_heading": "`loc` и `iloc`"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Фильтрация"
    },
    {
      "type": "content",
      "source_heading": "Создание колонок"
    },
    {
      "type": "content",
      "source_heading": "`SettingWithCopy`"
    },
    {
      "type": "content",
      "source_heading": "Index"
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
