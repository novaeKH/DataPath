---
title: "Современная токенизация — subword, BPE, WordPiece, SentencePiece и attention mask"
id: lesson.nlp.subword-tokenization
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.nlp
module_id: module.nlp.foundations
module_order: 1
lesson_order: 4
canonical_number: 78
content_path: 10 Знания/DataPath v2/13_NLP_DataPath_v2/source-078 Современная токенизация — subword, BPE, WordPiece, SentencePiece и attention mask.md
estimated_minutes: 25
difficulty: core
skill_ids:
- datapath.v2.078
prerequisites:
- lesson.nlp.preprocessing
previous: lesson.nlp.classical-models
next: lesson.nlp.rnn
tags:
- datapath/v2
- canonical/lesson
---
# Современная токенизация — subword, BPE, WordPiece, SentencePiece и attention mask

## Результат урока

После урока вы сможете:

- Объяснять subword-токенизацию и договор между ID и весами.
- Проверять padding, truncation и значение маски конкретного API.

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
      "component": "subword-tokenization-flow",
      "title": "Интерактивная схема темы"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Современная токенизация — subword, BPE, WordPiece, SentencePiece и attention mask» без подсказки?"
    }
  ]
}
```
