---
title: "Bag of Words, n-граммы и TF-IDF — сильный sparse representation текста"
id: lesson.nlp.classical
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
lesson_order: 2
canonical_number: 76
content_path: 10 Знания/DataPath v2/13_NLP_DataPath_v2/source-076 Bag of Words, n-граммы и TF-IDF — сильный sparse representation текста.md
estimated_minutes: 30
difficulty: core
skill_ids:
- nlp.classical
prerequisites:
- lesson.nlp.preprocessing
previous: lesson.nlp.preprocessing
next: lesson.nlp.classical-models
tags:
- datapath/v2
- canonical/lesson
---
# Bag of Words, n-граммы и TF-IDF — сильный sparse representation текста

## Результат урока

После урока вы сможете:

- Вычислять частоты, DF и TF-IDF на небольшом корпусе.
- Выбирать n-граммы и сохранять обучающий словарь неизменным на проверке.

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
      "component": "tfidf-weight-lab"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Bag of Words, n-граммы и TF-IDF — сильный sparse representation текста» без подсказки?"
    }
  ]
}
```
