---
title: "LSTM и GRU — как сеть учится сохранять и забывать информацию"
id: lesson.deep-learning.lstm-gru
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.deep-learning
module_id: module.deep-learning.architectures
module_order: 2
lesson_order: 4
canonical_number: 69
content_path: 10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-069 LSTM и GRU — как сеть учится сохранять и забывать информацию.md
estimated_minutes: 30
difficulty: core
skill_ids:
- datapath.v2.069
prerequisites:
- lesson.deep-learning.06
previous: lesson.deep-learning.06
next: lesson.deep-learning.07
tags:
- datapath/v2
- canonical/lesson
---
# LSTM и GRU — как сеть учится сохранять и забывать информацию

## Результат урока

После урока вы сможете:

- Вычислить обновление памяти LSTM через ворота.
- Различать LSTM и GRU и обрабатывать настоящие длины последовательностей.

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
      "component": "rnn-state-gates-lab"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «LSTM и GRU — как сеть учится сохранять и забывать информацию» без подсказки?"
    }
  ]
}
```
