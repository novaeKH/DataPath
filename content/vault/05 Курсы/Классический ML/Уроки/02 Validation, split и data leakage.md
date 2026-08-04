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

> [!summary] Результат урока
> - выбрать random, group или time split
> - обнаружить leakage до обучения
> - объяснить роль train, validation и test

## Основной материал

Canonical source: [[Validation Splits and Data Leakage]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/05 Metrics and Validation/Validation Splits and Data Leakage.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно в реальной задаче"
    },
    {
      "type": "content",
      "source_heading": "Коротко"
    },
    {
      "type": "content",
      "source_heading": "Интуиция"
    },
    {
      "type": "interactive",
      "component": "validation-split-lab"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни главную идею своими словами без подсказки."
    },
    {
      "type": "application",
      "mode": "micro-task"
    },
    {
      "type": "interview",
      "mode": "follow-up"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Сформулируй главную идею одним абзацем без терминов, которые не можешь объяснить.
2. Назови один случай, когда метод или правило даст неверный вывод.
3. Приведи небольшой пример из табличной ML-задачи.

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: [[01 Постановка задачи и оценка]]
- Источники: [[DataPath — проверенные источники]]
