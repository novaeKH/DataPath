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

## Результат урока

- различать underfit и overfit
- объяснить L1, L2 и structural regularization
- выбирать strength только по validation

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Regularization.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "interactive",
      "component": "regularization-path-lab"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Какая картина train/validation errors указывает на high bias, а какая — на high variance?"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Для linear model с correlated features выбери Ridge, Lasso или Elastic Net и объясни trade-off."
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Что такое bias–variance trade-off и какие виды regularization вы используете?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Какая картина train/validation errors указывает на high bias, а какая — на high variance?
2. Для linear model с correlated features выбери Ridge, Lasso или Elastic Net и объясни trade-off.
3. Что такое bias–variance trade-off и какие виды regularization вы используете?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
