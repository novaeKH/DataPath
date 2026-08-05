---
title: Gradient Boosting как последовательное исправление ошибок
id: lesson.classic-ml.trees.boosting
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.trees
module_order: 3
lesson_order: 3
content_path: 10 Знания/ML/01 Classical ML/Gradient Boosting.md
skill_ids:
- ml.tree_ensembles
- ml.error_analysis
estimated_minutes: 50
difficulty: core
interactive_component: boosting-residuals-lab
source_ids:
- sklearn-user-guide
- stanford-cs229
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Gradient Boosting как последовательное исправление ошибок

## Результат урока

- понять additive model и pseudo-residuals
- проследить несколько boosting steps
- объяснить learning rate, depth и early stopping

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Gradient Boosting.md",
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
      "source_heading": "Additive model"
    },
    {
      "type": "content",
      "source_heading": "От loss к pseudo-residuals"
    },
    {
      "type": "interactive",
      "component": "boosting-residuals-lab"
    },
    {
      "type": "content",
      "source_heading": "Squared error"
    },
    {
      "type": "content",
      "source_heading": "Пример: 3 шага boosting"
    },
    {
      "type": "content",
      "source_heading": "Визуализация"
    },
    {
      "type": "content",
      "source_heading": "Сравнение с Random Forest"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему boosting learners нельзя обучить полностью независимо и что такое pseudo-residual?"
    },
    {
      "type": "content",
      "source_heading": "Binary LogLoss"
    },
    {
      "type": "content",
      "source_heading": "Почему обучение последовательное"
    },
    {
      "type": "content",
      "source_heading": "Tree complexity и interactions"
    },
    {
      "type": "content",
      "source_heading": "Learning rate и iterations"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "По train/validation curves выбери learning rate, iteration limit и early stopping."
    },
    {
      "type": "content",
      "source_heading": "Row/feature subsampling"
    },
    {
      "type": "content",
      "source_heading": "Failure modes"
    },
    {
      "type": "content",
      "source_heading": "Ответ для собеседования"
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Объясните Gradient Boosting через negative gradient и главные гиперпараметры."
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Почему boosting learners нельзя обучить полностью независимо и что такое pseudo-residual?
2. По train/validation curves выбери learning rate, iteration limit и early stopping.
3. Объясните Gradient Boosting через negative gradient и главные гиперпараметры.

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
