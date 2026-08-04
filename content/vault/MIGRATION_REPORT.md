---
title: Migration Report — DataPath vault
id: meta.vault.datapath-migration-report
schema_version: 2
type: meta
area: vault
status: active
language: ru
rag: exclude
app: exclude
---

# MIGRATION REPORT — My_brain_v2 → DataPath content vault

Дата: 2026-08-05

## Что сделано

- Исходный архив не изменён.
- Создана чистая копия `My_brain_v2_DataPath` без `.git`, `.trash`, `.DS_Store` и локального workspace Obsidian.
- Все пути и Markdown нормализованы в Unicode NFC для стабильной работы на macOS, Linux и внутри Docker.
- Во все Markdown notes добавлены стабильный `id`, `schema_version: 2`, `language`, явные `rag` и `app`.
- Добавлен слой `05 Курсы`, который не дублирует canonical knowledge.
- Подготовлен MVP-курс Classic ML: 5 модулей, 13 уроков, 4 мини-кейса и один итоговый кейс.
- Добавлены два смешанных кейса: скоринг и локальный RAG.
- Созданы Canvas-карты курса и каталога.
- Расширено спокойное оформление Obsidian: hero, course-card, path и case callouts.
- Добавлены шаблоны для курса, модуля, урока, кейса и retrieval-card.
- Добавлены source registry и правила проверки новых знаний.
- Добавлены `.hermes.md`, руководство агента, RAG policy, validator и builder каталогов.

## Что сохранено

Все активные знания, практика, interview notes, проекты, MOC и настройки Obsidian сохранены. Теория не была автоматически переписана или сокращена, чтобы не повредить уже сильные canonical notes.

## Почему не выполнена массовая перепись теории

В vault 249 активных Markdown notes. Автоматически «улучшать» фактическое содержание всех notes небезопасно: можно внести незаметные ошибки и разрушить canonical ownership. Вместо этого создана инфраструктура, в которой агент обновляет notes по одной теме, фиксирует источник и прогоняет validator.

## Рекомендуемый следующий этап

1. Подключить `_meta/generated/app_catalog.json` к приложению.
2. Реализовать один вертикальный срез: урок Decision Tree → интерактив → mini-case → запись evidence в SQLite.
3. После UX-проверки расширять курс и только затем добавлять новые направления.
