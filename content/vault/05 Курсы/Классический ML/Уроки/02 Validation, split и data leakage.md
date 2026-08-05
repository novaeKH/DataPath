---
title: Validation, split и data leakage
id: lesson.classic-ml.framing.validation
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.framing
module_order: 1
lesson_order: 2
content_path: 10 Знания/ML/05 Metrics and Validation/Validation Splits and Data Leakage.md
skill_ids:
- ml.validation_split
- ml.data_leakage
estimated_minutes: 40
difficulty: core
interactive_component: validation-split-lab
source_ids:
- sklearn-user-guide
- google-mlcc
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Validation, split и data leakage

## Результат урока

- объяснить роли train, validation и test
- выбрать random, group или time split
- найти target, time, group и preprocessing leakage

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/05 Metrics and Validation/Validation Splits and Data Leakage.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "content",
      "source_heading": "Идея за 30 секунд"
    },
    {
      "type": "content",
      "source_heading": "Сначала определить prediction contract"
    },
    {
      "type": "content",
      "source_heading": "Роли train, validation и test"
    },
    {
      "type": "interactive",
      "component": "validation-split-lab"
    },
    {
      "type": "content",
      "source_heading": "Random split"
    },
    {
      "type": "content",
      "source_heading": "Group split и GroupKFold"
    },
    {
      "type": "content",
      "source_heading": "Визуализация"
    },
    {
      "type": "content",
      "source_heading": "Частые ошибки"
    },
    {
      "type": "content",
      "source_heading": "Сравнение стратегий split"
    },
    {
      "type": "content",
      "source_heading": "Простой пример"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему случайный split опасен, если у одного пользователя много транзакций?"
    },
    {
      "type": "content",
      "source_heading": "Time split"
    },
    {
      "type": "content",
      "source_heading": "Cross-validation"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Для таблицы событий пользователей выбери split и перечисли три операции, которые нужно fit только внутри train fold."
    },
    {
      "type": "content",
      "source_heading": "Preprocessing внутри folds"
    },
    {
      "type": "content",
      "source_heading": "Виды leakage"
    },
    {
      "type": "content",
      "source_heading": "Early stopping, calibration и threshold"
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Как понять, какой split использовать, и что считается data leakage?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Почему случайный split опасен, если у одного пользователя много транзакций?
2. Для таблицы событий пользователей выбери split и перечисли три операции, которые нужно fit только внутри train fold.
3. Как понять, какой split использовать, и что считается data leakage?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
