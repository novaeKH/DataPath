---
title: "Transformers, BERT-style models и NLP evaluation"
id: lesson.nlp.bert-evaluation
schema_version: 2
type: lesson
area: nlp
status: active
language: ru
app: include
rag: exclude
course_id: course.nlp
module_id: module.nlp.transformers
module_order: 3
lesson_order: 1
content_path: 10 Знания/ML/04 NLP/Transformers BERT and NLP Evaluation.md
skill_ids:
- nlp.bert-evaluation
prerequisites:
- lesson.nlp.attention
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/nlp]
---

# Transformers, BERT-style models и NLP evaluation

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/04 NLP/Transformers BERT and NLP Evaluation.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
    {"type": "interactive", "component": "transformer-block-lab"},
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
