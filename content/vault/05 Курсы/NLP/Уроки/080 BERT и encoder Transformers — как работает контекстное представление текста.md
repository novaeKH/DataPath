---
title: "BERT и encoder Transformers — как работает контекстное представление текста"
id: lesson.nlp.bert-evaluation
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.nlp
module_id: module.nlp.neural
module_order: 2
lesson_order: 2
canonical_number: 80
content_path: 10 Знания/DataPath v2/13_NLP_DataPath_v2/source-080 BERT и encoder Transformers — как работает контекстное представление текста.md
estimated_minutes: 35
difficulty: advanced-core
skill_ids:
- nlp.attention
- nlp.bert-evaluation
prerequisites:
- lesson.deep-learning.08
- lesson.nlp.subword-tokenization
previous: lesson.nlp.rnn
next: lesson.nlp.evaluation
tags:
- datapath/v2
- canonical/lesson
---
# BERT и encoder Transformers — как работает контекстное представление текста

## Результат урока

После урока вы сможете:

- Объяснить предобучение BERT и роль контекстного представления.
- Проверить входы и голову encoder, не принимая случайные веса за готовую модель.

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
      "component": "transformer-block-lab"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «BERT и encoder Transformers — как работает контекстное представление текста» без подсказки?"
    }
  ]
}
```
