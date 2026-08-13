---
title: "RAG architecture, evaluation и hallucinations"
id: lesson.llm-rag.rag
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
lesson_order: 2
content_path: 10 Знания/ML/06 LLM и RAG/RAG Architecture Evaluation and Hallucinations.md
skill_ids:
- llm-rag.rag
prerequisites:
- lesson.llm-rag.retrieval
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/llm-rag]
---

# RAG architecture, evaluation и hallucinations

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/06 LLM и RAG/RAG Architecture Evaluation and Hallucinations.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
    {"type": "interactive", "component": "rag-pipeline-evaluation-lab"},
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
