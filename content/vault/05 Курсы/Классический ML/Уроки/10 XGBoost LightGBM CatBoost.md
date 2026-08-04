---
title: XGBoost, LightGBM и CatBoost
id: lesson.classic-ml.trees.libraries
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
lesson_order: 4
content_path: 10 Знания/ML/01 Classical ML/XGBoost LightGBM and CatBoost.md
skill_ids:
- ml.tree_ensembles
estimated_minutes: 55
difficulty: core
interactive_component: categorical-encoding-lab
source_ids:
- xgboost-paper
- lightgbm-paper
- catboost-paper
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# XGBoost, LightGBM и CatBoost

> [!summary] Результат урока
> - различить алгоритм boosting и конкретную библиотеку
> - объяснить histogram, GOSS/EFB и ordered statistics на нужном уровне
> - выбрать библиотеку под структуру данных и ограничения

## Основной материал

Canonical source: [[XGBoost LightGBM and CatBoost]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/XGBoost LightGBM and CatBoost.md",
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
      "component": "categorical-encoding-lab"
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
