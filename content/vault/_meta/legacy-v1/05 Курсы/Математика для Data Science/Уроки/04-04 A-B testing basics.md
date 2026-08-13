---
title: "A/B testing basics"
id: lesson.math-ds.ab-testing
schema_version: 2
type: lesson
area: math
status: active
language: ru
app: include
rag: exclude
course_id: course.math-ds
module_id: module.math-ds.statistics
module_order: 4
lesson_order: 4
content_path: 10 Знания/ML/05 Metrics and Validation/A-B Testing.md
skill_ids:
- math.ab-testing
prerequisites:
- lesson.math-ds.likelihood
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/math]
---

# A/B testing basics

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/05 Metrics and Validation/A-B Testing.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
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
