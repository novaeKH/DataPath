---
title: PCA как проекция с сохранением variance
id: lesson.classic-ml.unsupervised.pca
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.unsupervised
module_order: 4
lesson_order: 2
content_path: 10 Знания/ML/01 Classical ML/Principal Component Analysis.md
skill_ids:
- ml.unsupervised.pca
estimated_minutes: 50
difficulty: core
interactive_component: pca-projection-lab
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

# PCA как проекция с сохранением variance

## Результат урока

- понять components как directions variance
- связать covariance, eigenvectors и SVD
- применять PCA без leakage

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Principal Component Analysis.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "content",
      "source_heading": "Интуиция"
    },
    {
      "type": "content",
      "source_heading": "Подготовка"
    },
    {
      "type": "content",
      "source_heading": "Covariance view"
    },
    {
      "type": "interactive",
      "component": "pca-projection-lab"
    },
    {
      "type": "content",
      "source_heading": "SVD view"
    },
    {
      "type": "content",
      "source_heading": "Projection"
    },
    {
      "type": "content",
      "source_heading": "Сравнение с другими методами снижения размерности"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему PCA нужно fit только на train и как scaling меняет найденные directions?"
    },
    {
      "type": "content",
      "source_heading": "Explained variance"
    },
    {
      "type": "content",
      "source_heading": "Пример"
    },
    {
      "type": "content",
      "source_heading": "Scaling меняет задачу"
    },
    {
      "type": "content",
      "source_heading": "Leakage"
    },
    {
      "type": "content",
      "source_heading": "Интерпретация"
    },
    {
      "type": "content",
      "source_heading": "Sparse data"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Выбери число components для KNN pipeline и объясни, почему нельзя опираться только на 95% variance."
    },
    {
      "type": "content",
      "source_heading": "Визуализация"
    },
    {
      "type": "content",
      "source_heading": "sklearn пример"
    },
    {
      "type": "content",
      "source_heading": "Частые ошибки"
    },
    {
      "type": "interview",
      "mode": "follow-up",
      "prompt": "Как PCA работает математически и какие у неё ограничения?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Почему PCA нужно fit только на train и как scaling меняет найденные directions?
2. Выбери число components для KNN pipeline и объясни, почему нельзя опираться только на 95% variance.
3. Как PCA работает математически и какие у неё ограничения?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
