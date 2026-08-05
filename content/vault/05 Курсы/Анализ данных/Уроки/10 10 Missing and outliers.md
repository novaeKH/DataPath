---
title: 10 Missing and outliers
id: lesson.data-analysis.10
schema_version: 2
type: lesson
area: data-analysis
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.data-analysis
module_id: module.data-analysis.eda
module_order: 4
lesson_order: 2
content_path: 10 Знания/Data Analysis/EDA/Data Quality Missing Values and Outliers.md
skill_ids:
- data.analysis
estimated_minutes: 40
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 10 Missing and outliers

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Data Analysis/EDA/Data Quality Missing Values and Outliers.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Data quality как контракт"
    },
    {
      "type": "content",
      "source_heading": "Типы пропусков"
    },
    {
      "type": "content",
      "source_heading": "Диагностика пропусков"
    },
    {
      "type": "interactive",
      "component": "missing-outlier-lab"
    },
    {
      "type": "content",
      "source_heading": "Imputation"
    },
    {
      "type": "content",
      "source_heading": "Outlier"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Методы обнаружения"
    },
    {
      "type": "content",
      "source_heading": "Что делать с outlier"
    },
    {
      "type": "content",
      "source_heading": "Drift качества"
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
