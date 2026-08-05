---
title: Bagging и Random Forest
id: lesson.classic-ml.trees.forest
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
lesson_order: 2
content_path: 10 Знания/ML/01 Classical ML/Bagging and Random Forest.md
skill_ids:
- ml.tree_ensembles
- ml.bias_variance_regularization
estimated_minutes: 45
difficulty: core
interactive_component: bootstrap-forest-lab
source_ids:
- sklearn-user-guide
- islr
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Bagging и Random Forest

> [!summary] Результат урока
> - объяснить bootstrap и feature subsampling
> - связать усреднение со снижением variance
> - использовать OOB как дополнительную оценку

## Основной материал

Canonical source: [[Bagging and Random Forest]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Bagging and Random Forest.md",
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
      "source_heading": "Bootstrap"
    },
    {
      "type": "interactive",
      "component": "bootstrap-forest-lab"
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
- Модуль: [[03 Деревья и ансамбли]]
- Источники: [[DataPath — проверенные источники]]
