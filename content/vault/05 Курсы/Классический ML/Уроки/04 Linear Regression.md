---
title: Linear Regression как модель и baseline
id: lesson.classic-ml.linear.regression
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
lesson_order: 1
content_path: 10 Знания/ML/01 Classical ML/Linear Regression.md
skill_ids:
- ml.linear_logistic_models
estimated_minutes: 40
difficulty: core
interactive_component: linear-fit-lab
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

# Linear Regression как модель и baseline

## Результат урока

- понять линейную формулу и коэффициенты
- связать MSE с least squares
- диагностировать residual pattern и multicollinearity

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Linear Regression.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "content",
      "source_heading": "Задача с нуля"
    },
    {
      "type": "content",
      "source_heading": "Простой пример"
    },
    {
      "type": "content",
      "source_heading": "Как обучается"
    },
    {
      "type": "interactive",
      "component": "linear-fit-residual-lab"
    },
    {
      "type": "content",
      "source_heading": "Почему MSE"
    },
    {
      "type": "content",
      "source_heading": "Категориальные признаки"
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
      "prompt": "Что означает коэффициент при признаке и почему его нельзя автоматически читать причинно?"
    },
    {
      "type": "content",
      "source_heading": "Scaling"
    },
    {
      "type": "content",
      "source_heading": "Multicollinearity"
    },
    {
      "type": "content",
      "source_heading": "Нелинейность"
    },
    {
      "type": "content",
      "source_heading": "Residual analysis"
    },
    {
      "type": "content",
      "source_heading": "Metrics"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "По residual plot опиши, какой pattern модель не выучила и какой следующий шаг проверишь."
    },
    {
      "type": "content",
      "source_heading": "Regularization"
    },
    {
      "type": "content",
      "source_heading": "Предположения и интерпретация"
    },
    {
      "type": "content",
      "source_heading": "sklearn пример"
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Как обучается Linear Regression, зачем regularization и какие основные ограничения модели?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Что означает коэффициент при признаке и почему его нельзя автоматически читать причинно?
2. По residual plot опиши, какой pattern модель не выучила и какой следующий шаг проверишь.
3. Как обучается Linear Regression, зачем regularization и какие основные ограничения модели?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
