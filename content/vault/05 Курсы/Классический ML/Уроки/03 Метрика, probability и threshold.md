---
title: Метрика, probability и threshold
id: lesson.classic-ml.framing.metrics
schema_version: 2
type: lesson
area: ml
status: active
language: ru
rag: exclude
app: include
course_id: course.classic-ml
module_id: module.classic-ml.framing
module_order: 1
lesson_order: 3
content_path: 10 Знания/ML/05 Metrics and Validation/ML Metrics and Threshold Selection.md
skill_ids:
- ml.metrics_threshold
estimated_minutes: 45
difficulty: core
interactive_component: threshold-cost-explorer
source_ids:
- sklearn-user-guide
- google-mlcc
tags:
- course/classical-ml
- datapath/lesson
cssclasses:
- course-lesson
---

# Метрика, probability и threshold

> [!summary] Результат урока
> - разделить качество ranking и выбранный threshold
> - выбрать метрику под цену ошибок
> - объяснить Precision, Recall, ROC-AUC и PR-AUC

## Основной материал

Canonical source: [[ML Metrics and Threshold Selection]]. Приложение загружает содержание по `content_path`, поэтому здесь теория не копируется.

## Сценарий урока

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/05 Metrics and Validation/ML Metrics and Threshold Selection.md",
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
      "component": "threshold-cost-explorer"
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
- Модуль: [[01 Постановка задачи и оценка]]
- Источники: [[DataPath — проверенные источники]]
