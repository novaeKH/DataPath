---
title: "RAG — как соединить LLM с внешними знаниями"
id: lesson.llm-rag.rag
schema_version: 2
type: lesson
area: datapath-v2
status: active
language: ru
rag: exclude
app: include
course_id: course.llm-rag
module_id: module.llm-rag.systems
module_order: 3
lesson_order: 1
canonical_number: 89
content_path: 10 Знания/DataPath v2/14_LLM_and_RAG_DataPath_v2/source-089 RAG — как соединить LLM с внешними знаниями.md
estimated_minutes: 95
difficulty: advanced-core
skill_ids:
- llm-rag.rag
prerequisites:
- lesson.llm-rag.reranking
previous: lesson.llm-rag.reranking
next: lesson.llm-rag.evaluation
tags:
- datapath/v2
- canonical/lesson
---
# RAG — как соединить LLM с внешними знаниями

## Результат урока

Разобрать каноническую главу №89, воспроизвести её ключевой механизм и оценить готовность объяснить тему.

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
      "component": "rag-pipeline-evaluation-lab"
    },
    {
      "type": "retrieval",
      "assessment_type": "self_assessment",
      "prompt": "Насколько уверенно вы можете объяснить ключевой механизм главы «RAG — как соединить LLM с внешними знаниями» без подсказки?"
    }
  ]
}
```
