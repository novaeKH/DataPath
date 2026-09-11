---
title: "Агрегации: GROUP BY, HAVING и логика вычисления запроса"
id: lesson.sql.group-by
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.data-tools
module_id: module.data-tools.sql-basics
module_order: 1
lesson_order: 2
canonical_number: 17
content_path: 10 Знания/DataPath v2/03_SQL_DataPath_v2/source-017 Агрегации GROUP BY, HAVING и логика вычисления запроса.md
estimated_minutes: 25
difficulty: core
skill_ids:
- datapath.v2.017
prerequisites:
- lesson.sql.select-where
previous: lesson.sql.select-where
next: lesson.sql.joins
tags:
- datapath/v2
- canonical/lesson
---
# Агрегации: GROUP BY, HAVING и логика вычисления запроса

## Результат урока

После урока вы сможете:

- Выбрать уровень агрегирования и верный знаменатель.
- Различать WHERE, HAVING и условное агрегирование.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_revision": "theory-2026-09",
  "scenes": [
    {
      "type": "hook",
      "title": "Цель главы"
    },
    {
      "type": "visual_demo",
      "component": "sql-aggregation-grain-flow",
      "title": "Интерактивная схема темы"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Агрегации: GROUP BY, HAVING и логика вычисления запроса» без подсказки?"
    }
  ]
}
```
