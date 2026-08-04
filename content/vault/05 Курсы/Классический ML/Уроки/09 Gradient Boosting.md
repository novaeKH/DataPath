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

> [!summary] Результат урока
> - объяснить функциональный gradient descent интуитивно
> - связать learning rate и число деревьев
> - распознать переобучение и недообучение

## Основной материал

Canonical source: [[Gradient Boosting]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Gradient Boosting.md",
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
      "component": "boosting-residuals-lab"
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
