---
title: "Derivative, partial derivative, gradient и chain rule"
id: lesson.math-ds.gradients
schema_version: 2
type: lesson
area: math
status: active
language: ru
app: include
rag: exclude
course_id: course.math-ds
module_id: module.math-ds.calculus
module_order: 2
lesson_order: 1
content_path: 10 Знания/Математика/04 Оптимизация/Gradients Chain Rule and Optimization.md
skill_ids:
- math.gradients
prerequisites:
- lesson.math-ds.svd
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/math]
---

# Derivative, partial derivative, gradient и chain rule

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Математика/04 Оптимизация/Gradients Chain Rule and Optimization.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
    {"type": "interactive", "component": "gradient-descent-landscape"},
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
