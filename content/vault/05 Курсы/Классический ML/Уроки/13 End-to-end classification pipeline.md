---
title: End-to-end classification pipeline
id: lesson.classic-ml.end-to-end.pipeline
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.end-to-end
module_order: 5
lesson_order: 1
content_path: 15 Практика/sklearn/sklearn End-to-End Classification — Practice.md
skill_ids:
- ml.problem_framing
- ml.validation_split
- ml.data_leakage
- ml.metrics_threshold
- ml.error_analysis
estimated_minutes: 60
difficulty: core
interactive_component: pipeline-builder
source_ids:
- sklearn-user-guide
- made-with-ml
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# End-to-end classification pipeline

> [!summary] Результат урока
> - собрать preprocessing и model в Pipeline
> - сравнить baseline и кандидатов честно
> - закончить итерацию error analysis

## Основной материал

Canonical source: [[sklearn End-to-End Classification — Practice]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "15 Практика/sklearn/sklearn End-to-End Classification — Practice.md",
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
      "component": "pipeline-builder"
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
- Модуль: [[05 End-to-end]]
- Источники: [[DataPath — проверенные источники]]
