---
title: "Chunking, BM25, dense, hybrid, RRF и reranking"
id: lesson.llm-rag.retrieval
schema_version: 2
type: lesson
area: llm-rag
status: active
language: ru
app: include
rag: exclude
course_id: course.llm-rag
module_id: module.llm-rag.retrieval
module_order: 2
lesson_order: 1
content_path: 10 Знания/ML/06 LLM и RAG/Retrieval BM25 Dense Hybrid Reranking.md
skill_ids:
- llm-rag.retrieval
prerequisites:
- lesson.llm-rag.inference
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/llm-rag]
---

# Chunking, BM25, dense, hybrid, RRF и reranking

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/06 LLM и RAG/Retrieval BM25 Dense Hybrid Reranking.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
    {"type": "interactive", "component": "retrieval-ranking-lab"},
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
