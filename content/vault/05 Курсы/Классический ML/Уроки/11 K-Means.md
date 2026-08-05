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

> [!summary] Результат урока
> - объяснить objective K-Means
> - понять влияние scaling и initialization
> - не путать кластеры с истинными классами

## Основной материал

Canonical source: [[K-Means]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/K-Means.md",
  "scenes": [
    {
      "type": "hook",
      "title": "Зачем это нужно в реальной задаче"
    },
    {
      "type": "content",
      "source_heading": "Идея за 30 секунд"
    },
    {
      "type": "content",
      "source_heading": "Objective"
    },
    {
      "type": "interactive",
      "component": "kmeans-canvas"
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
- Модуль: [[04 Unsupervised ML]]
- Источники: [[DataPath — проверенные источники]]
