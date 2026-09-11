---
title: "Transformer — от self-attention до полного блока"
id: lesson.deep-learning.08
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
lesson_order: 7
canonical_number: 72
content_path: 10 Знания/DataPath v2/12_DL_Architectures_DataPath_v2/source-072 Transformer — от self-attention до полного блока.md
estimated_minutes: 35
difficulty: advanced-core
skill_ids:
- dl.foundations
prerequisites:
- lesson.deep-learning.regularization
- lesson.deep-learning.attention
previous: lesson.deep-learning.attention
next: lesson.deep-learning.09
tags:
- datapath/v2
- canonical/lesson
---
# Transformer — от self-attention до полного блока

## Результат урока

После урока вы сможете:

- Проследить тензор через attention, остаточную связь, нормировку и FFN.
- Различать encoder, авторегрессионный decoder и роли масок.

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
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Transformer — от self-attention до полного блока» без подсказки?"
    }
  ]
}
```
