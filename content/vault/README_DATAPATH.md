---
title: README — DataPath vault
id: meta.vault.datapath-readme
schema_version: 2
type: meta
area: vault
status: active
language: ru
rag: exclude
app: exclude
---

# README — DataPath vault

## Быстрый старт

1. Открой папку `My_brain_v2_DataPath` как отдельный vault в Obsidian.
2. Проверь, что включён CSS snippet `knowledge-system` в **Settings → Appearance → CSS snippets**.
3. Открой [[00 Каталог курсов]] или [[DataPath — карта курсов.canvas]].
4. Для проверки структуры запусти:

```bash
python tools/build_catalog.py
python tools/validate_vault.py
```

## Подключение к приложению

Основные machine-readable файлы:

- `_meta/generated/app_catalog.json` — курсы, модули, уроки и кейсы;
- `_meta/generated/content_manifest.json` — все доступные content objects;
- `_meta/SOURCE_REGISTRY.yml` — проверенные источники;
- `_meta/DATAPATH_CONTENT_SPEC.md` — контракт контента;
- `_meta/DATAPATH_RAG_POLICY.md` — правила индексации.

Для первого вертикального среза используй урок [[07 Decision Tree]], его canonical note [[Decision Trees]] и кейс [[03 Мини-кейс — Выбор ансамбля для оттока]].

## Важное ограничение

Vault хранит учебный контент, но не личный прогресс. Попытки, сильные и слабые темы, расписание повторения и история подсказок должны храниться в локальной базе приложения.
