---
title: "Conditional probability и Bayes theorem"
id: lesson.math-ds.bayes
schema_version: 2
type: lesson
area: math
status: active
language: ru
app: include
rag: exclude
course_id: course.math-ds
module_id: module.math-ds.probability
module_order: 3
lesson_order: 3
content_path: 10 Знания/Математика/01 Вероятность/Conditional Probability and Bayes Theorem.md
skill_ids:
- math.bayes
prerequisites:
- lesson.math-ds.expectation
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/math]
---

# Conditional probability и Bayes theorem

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/Математика/01 Вероятность/Conditional Probability and Bayes Theorem.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
    {"type": "interactive", "component": "naive-bayes-evidence-lab"},
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
