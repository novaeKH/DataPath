---
title: Bias, variance и regularization
id: lesson.classic-ml.linear.regularization
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.linear
module_order: 2
lesson_order: 3
content_path: 10 Знания/ML/01 Classical ML/Regularization.md
skill_ids:
- ml.bias_variance_regularization
estimated_minutes: 40
difficulty: core
interactive_component: regularization-path
source_ids:
- sklearn-user-guide
- stanford-cs229
- islr
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Bias, variance и regularization

> [!summary] Результат урока
> - объяснить bias-variance trade-off
> - сравнить L1 и L2
> - подобрать сложность только внутри validation

## Основной материал

Canonical source: [[Regularization]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Regularization.md",
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
      "component": "regularization-path"
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
- Модуль: [[02 Линейные модели]]
- Источники: [[DataPath — проверенные источники]]
