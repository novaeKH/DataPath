---
title: DataPath RAG Policy
id: meta.learning-system.datapath-rag-policy
type: meta
area: learning-system
status: active
schema_version: 2
language: ru
rag: exclude
app: exclude
updated: 2026-08-05
---

# DataPath RAG Policy

## Коллекции

1. `knowledge` — canonical concept и deep-dive.
2. `practice` — примеры, упражнения и кейсы без скрытых решений.
3. `interview` — короткие ответы и follow-up.
4. `projects` — контекст реальных проектов пользователя.

Lesson wrappers, MOC, шаблоны, source registry и JSON-манифесты не индексируются: они создают дубли и технический шум.

## Chunking

- основной chunk — содержательный H2/H3;
- в metadata chunk добавляются `id`, title, aliases, area, breadcrumb и source path;
- целевой размер 180–700 слов;
- код, формула и их объяснение остаются вместе;
- chunk без ясного субъекта не допускается;
- `details` с готовым ответом помечается как answer и не выдаётся в режиме «не давай ответ».

## Retrieval

- hybrid retrieval: lexical + embeddings;
- максимум два chunk из одного файла до reranking;
- при конфликте приоритет: knowledge → deep-dive → practice → interview;
- фильтрация по `skill_ids`, текущему уроку и режиму наставника;
- ответ содержит текст, формулы и код, а ссылки на заметки идут после объяснения.

## Обновление

Индекс строится инкрементально по content hash. Изменение только app-wrapper не должно переиндексировать canonical knowledge. Удалённые и deprecated notes удаляются из индекса после сверки manifest.
