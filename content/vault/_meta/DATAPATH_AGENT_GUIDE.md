---
title: DataPath Agent Guide
id: meta.learning-system.datapath-agent-guide
type: meta
area: learning-system
status: active
schema_version: 2
language: ru
rag: exclude
app: exclude
updated: 2026-08-05
---

# DataPath Agent Guide

## Рабочий порядок агента

1. Прочитать `.hermes.md`, `_meta/VAULT_SPEC.md` и `_meta/DATAPATH_CONTENT_SPEC.md`.
2. Найти canonical owner понятия до создания новой заметки.
3. Для нового фактического материала выбрать источник из `_meta/SOURCE_REGISTRY.yml`; при отсутствии добавить проверенный официальный источник.
4. Не копировать теорию в lesson wrapper, case или interview note.
5. После изменения запустить `python tools/validate_vault.py` и `python tools/build_catalog.py`.
6. Показать изменённые файлы и результаты проверки до коммита.

## Запрещено без подтверждения

- массово переименовывать notes;
- менять стабильные `id`;
- удалять canonical content;
- добавлять непроверенные ссылки как источник истины;
- индексировать answer keys вместе с вопросами;
- выполнять `git push`, `sudo` или менять файлы вне vault.
