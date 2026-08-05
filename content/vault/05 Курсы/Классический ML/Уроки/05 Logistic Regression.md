---
title: Logistic Regression и вероятности
id: lesson.classic-ml.linear.logistic
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
lesson_order: 2
content_path: 10 Знания/ML/01 Classical ML/Logistic Regression.md
skill_ids:
- ml.linear_logistic_models
- ml.metrics_threshold
estimated_minutes: 45
difficulty: core
interactive_component: logit-boundary-lab
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

# Logistic Regression и вероятности

## Результат урока

- понять logit, sigmoid и probability
- связать LogLoss с likelihood
- выбрать threshold и проверить calibration

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Logistic Regression.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "content",
      "source_heading": "Что предсказывает модель"
    },
    {
      "type": "content",
      "source_heading": "Odds и log-odds"
    },
    {
      "type": "content",
      "source_heading": "Пример"
    },
    {
      "type": "interactive",
      "component": "logistic-boundary-threshold-lab"
    },
    {
      "type": "content",
      "source_heading": "Обучение и LogLoss"
    },
    {
      "type": "content",
      "source_heading": "Decision boundary"
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
      "source_heading": "Сравнение с другими моделями"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Чем logit отличается от probability и почему не нужен sigmoid перед BCEWithLogitsLoss?"
    },
    {
      "type": "content",
      "source_heading": "Probability и threshold"
    },
    {
      "type": "content",
      "source_heading": "Regularization"
    },
    {
      "type": "content",
      "source_heading": "Class imbalance"
    },
    {
      "type": "content",
      "source_heading": "Calibration"
    },
    {
      "type": "content",
      "source_heading": "Multiclass"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Предложи metric, class-weight policy и threshold для редкого positive class."
    },
    {
      "type": "content",
      "source_heading": "Preprocessing"
    },
    {
      "type": "content",
      "source_heading": "Интерпретация"
    },
    {
      "type": "content",
      "source_heading": "sklearn пример"
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Как работает Logistic Regression и как интерпретировать коэффициенты и probability?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Чем logit отличается от probability и почему не нужен sigmoid перед BCEWithLogitsLoss?
2. Предложи metric, class-weight policy и threshold для редкого positive class.
3. Как работает Logistic Regression и как интерпретировать коэффициенты и probability?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
