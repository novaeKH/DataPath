---
title: "Agents, tool use, memory и local LLM"
id: lesson.llm-rag.agents
schema_version: 2
type: lesson
area: llm-rag
status: active
language: ru
app: include
rag: exclude
course_id: course.llm-rag
module_id: module.llm-rag.agents
module_order: 3
lesson_order: 1
content_path: 10 Знания/ML/06 LLM и RAG/Agents Tools Memory and Local LLM.md
skill_ids:
- llm-rag.agents
prerequisites:
- lesson.llm-rag.rag
estimated_minutes: 35
difficulty: core
tags: [datapath/lesson, course/llm-rag]
---

# Agents, tool use, memory и local LLM

## Результат урока

- объяснить идею и механизм своими словами;
- разобрать ключевую математику или алгоритм на примере;
- применить тему в небольшой задаче и распознать типичные ошибки.

## Сценарий урока

```datapath
{
  "schema_version": 2,
  "layout": "focus",
  "content_path": "10 Знания/ML/06 LLM и RAG/Agents Tools Memory and Local LLM.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно и какой результат получим"},
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
