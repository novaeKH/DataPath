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

> [!summary] Результат урока
> - связать PCA с covariance и eigenvectors
> - объяснить explained variance
> - понимать влияние scaling и интерпретируемости

## Основной материал

Canonical source: [[Principal Component Analysis]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Principal Component Analysis.md",
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
      "component": "pca-projection-lab"
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
