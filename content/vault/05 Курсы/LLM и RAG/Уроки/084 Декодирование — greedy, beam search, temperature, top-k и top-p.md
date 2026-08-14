---
title: "Декодирование — greedy, beam search, temperature, top-k и top-p"
id: lesson.llm-rag.decoding
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.llm-rag
module_id: module.llm-rag.mechanics
module_order: 1
lesson_order: 2
canonical_number: 84
content_path: 10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-084 Декодирование — greedy, beam search, temperature, top-k и top-p.md
estimated_minutes: 70
difficulty: core
skill_ids:
- datapath.v2.084
prerequisites:
- lesson.llm-rag.autoregressive
previous: lesson.llm-rag.autoregressive
next: lesson.llm-rag.inference
tags:
- datapath/v2
- canonical/lesson
---
# Декодирование — greedy, beam search, temperature, top-k и top-p

## Результат урока

Разобрать каноническую главу №84, воспроизвести её ключевой механизм и оценить готовность объяснить тему.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "scenes": [
    {
      "type": "hook",
      "title": "Цель главы"
    },
    {
      "type": "visual_demo",
      "component": "decoding-strategy-flow",
      "title": "Интерактивная схема темы"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «Декодирование — greedy, beam search, temperature, top-k и top-p» без подсказки?"
    }
  ]
}
```
