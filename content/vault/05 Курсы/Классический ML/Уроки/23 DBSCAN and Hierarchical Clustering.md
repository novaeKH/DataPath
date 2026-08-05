---
title: 23 DBSCAN and Hierarchical Clustering
id: lesson.classic-ml.expansion.23
schema_version: 2
type: lesson
area: classic-ml
status: draft
language: ru
rag: exclude
app: exclude
course_id: course.classic-ml
module_id: module.classic-ml.unsupervised-advanced
module_order: 8
lesson_order: 23
content_path: 10 Знания/ML/01 Classical ML/DBSCAN and Hierarchical Clustering.md
skill_ids:
- ml.classic.expansion
estimated_minutes: 45
difficulty: beginner-core
tags:
- datapath/draft-lesson
---

# 23 DBSCAN and Hierarchical Clustering

## Результат урока

Понять тему с нуля, воспроизвести механизм, решить маленький пример и объяснить основные ограничения.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/DBSCAN and Hierarchical Clustering.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно и что станет понятно"
    },
    {
      "type": "content",
      "source_heading": "Зачем альтернативы K-Means"
    },
    {
      "type": "content",
      "source_heading": "DBSCAN"
    },
    {
      "type": "content",
      "source_heading": "Hierarchical clustering"
    },
    {
      "type": "interactive",
      "component": "density-hierarchy-clustering-lab"
    },
    {
      "type": "content",
      "source_heading": "Scaling и distance"
    },
    {
      "type": "content",
      "source_heading": "Оценка"
    },
    {
      "type": "content",
      "source_heading": "Частые ошибки"
    },
    {
      "type": "retrieval",
      "mode": "free-recall",
      "prompt": "Объясни ключевой механизм без терминов, которые не можешь определить."
    },
    {
      "type": "content",
      "source_heading": "Визуализация"
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
