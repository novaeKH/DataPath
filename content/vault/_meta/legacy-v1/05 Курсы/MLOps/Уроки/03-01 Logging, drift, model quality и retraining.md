---
title: "Logging, drift, model quality и retraining"
id: lesson.mlops.monitoring
schema_version: 2
type: lesson
area: mlops
status: active
language: ru
app: include
rag: exclude
course_id: course.mlops
module_id: module.mlops.monitoring
module_order: 3
lesson_order: 1
content_path: 10 Знания/MLOps/Monitoring Drift Logging and Retraining.md
skill_ids:
- mlops.monitoring
prerequisites:
- lesson.mlops.serving
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/mlops]
---

# Logging, drift, model quality и retraining

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/MLOps/Monitoring Drift Logging and Retraining.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
    {"type": "interactive", "component": "monitoring-drift-quality-lab"},
    {"type": "retrieval", "prompt": "Объясни ключевой механизм темы без неопределённых терминов."},
    {"type": "application", "prompt": "Реши небольшой практический пример и объясни каждый шаг."},
    {"type": "interview", "prompt": "Дай ответ для собеседования: идея, механизм, ограничения и применение."}
  ]
}
```

## Проверка понимания

1. Объясни ключевой механизм темы без неопределённых терминов.
2. Реши небольшой практический пример и объясни каждый шаг.
3. Дай ответ для собеседования: идея, механизм, ограничения и применение.

## Связи

- До: prerequisite указан во frontmatter.
- После: следующий урок маршрута и связанные узлы Atlas.
