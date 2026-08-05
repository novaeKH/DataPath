---
title: K-Means и смысл кластера
id: lesson.classic-ml.unsupervised.kmeans
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
lesson_order: 1
content_path: 10 Знания/ML/01 Classical ML/K-Means.md
skill_ids:
- ml.unsupervised.kmeans
estimated_minutes: 40
difficulty: core
interactive_component: kmeans-canvas
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

# K-Means и смысл кластера

## Результат урока

- понять objective и Lloyd algorithm
- объяснить scaling и geometry assumptions
- оценивать K и stability без target

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/K-Means.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и какой результат получим"
    },
    {
      "type": "content",
      "source_heading": "Что решает K-Means"
    },
    {
      "type": "content",
      "source_heading": "Objective"
    },
    {
      "type": "content",
      "source_heading": "Lloyd algorithm"
    },
    {
      "type": "interactive",
      "component": "kmeans-canvas"
    },
    {
      "type": "content",
      "source_heading": "Числовой пример"
    },
    {
      "type": "content",
      "source_heading": "Initialization"
    },
    {
      "type": "content",
      "source_heading": "Сравнение с DBSCAN и hierarchical"
    },
    {
      "type": "retrieval",
      "mode": "single-choice-or-free-recall",
      "prompt": "Почему centroid является mean и почему inertia всегда уменьшается при росте K?"
    },
    {
      "type": "content",
      "source_heading": "Scaling и representation"
    },
    {
      "type": "content",
      "source_heading": "Geometry assumptions"
    },
    {
      "type": "content",
      "source_heading": "Как выбрать K"
    },
    {
      "type": "content",
      "source_heading": "Оценка без labels"
    },
    {
      "type": "content",
      "source_heading": "Prediction новых points"
    },
    {
      "type": "application",
      "mode": "micro-task",
      "prompt": "Для customer segmentation выбери features, scaling и критерии полезности clusters."
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
      "prompt": "Как работает K-Means, как выбрать K и когда метод неприменим?"
    },
    {
      "type": "reflection",
      "action": "update-skill-evidence"
    }
  ]
}
```

## Проверка понимания

1. Почему centroid является mean и почему inertia всегда уменьшается при росте K?
2. Для customer segmentation выбери features, scaling и критерии полезности clusters.
3. Как работает K-Means, как выбрать K и когда метод неприменим?

## Связи

- Курс: [[00 Курс — Классический ML]]
- Модуль: определяется по `module_id` во frontmatter.
- Теория: `content_path` во frontmatter является каноническим источником.
