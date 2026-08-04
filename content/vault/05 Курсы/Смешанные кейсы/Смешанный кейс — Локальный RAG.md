---
title: Смешанный кейс — Локальный RAG
id: case.mixed.local-rag
schema_version: 2
type: practice
practice_kind: mixed-case
area: ml
status: active
language: ru
rag: include
rag_collection: practice
app: include
skill_ids:
- nlp.chunking
- retrieval.hybrid
- retrieval.reranking
- llm.evaluation
- systems.local-runtime
estimated_minutes: 210
difficulty: real-world
modes:
- guided
- standard
- interview
- real-world
source_ids:
- rag-paper
- huggingface-llm-course
- full-stack-dl
tags:
- practice/mixed-case
- datapath/case
cssclasses:
- course-case
---

# Смешанный кейс — Локальный RAG

> [!case] Задача
> Спроектировать локального наставника для Markdown-vault: определить chunking, hybrid retrieval, ограничение chunk на файл, reranking, provenance, evaluation set и инкрементальное обновление.

## Этапы

1. Зафиксировать ограничения и критерий успеха.
2. Построить минимальный проверяемый baseline.
3. Найти риски данных и оценки.
4. Реализовать решение небольшими воспроизводимыми шагами.
5. Провести error analysis и защитить trade-offs.

## Что оценивает система

- постановку задачи;
- качество данных и кода;
- честность оценки;
- интерпретацию;
- объяснение решения;
- способность увидеть ограничения.

## Источники

[[DataPath — проверенные источники]]
