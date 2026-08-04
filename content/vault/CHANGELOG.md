---
title: Changelog — DataPath vault
id: meta.vault.datapath-changelog
schema_version: 2
type: meta
area: vault
status: active
language: ru
rag: exclude
app: exclude
---

# CHANGELOG

## 2026-08-05 — DataPath course-ready vault

### Added
- `05 Курсы` с каталогом, Canvas-картами и MVP-курсом Classic ML.
- 13 lesson wrappers и 7 связанных/смешанных кейсов.
- DataPath content spec, RAG policy, agent guide и source registry.
- Machine-readable `app_catalog.json` и `content_manifest.json`.
- Hermes project instructions and validation tools.
- Course templates and calm visual styles.

### Changed
- Frontmatter schema upgraded to version 2.
- Explicit stable IDs and `rag`/`app` routing added to active Markdown content.
- Main dashboard links to DataPath courses.
- Unicode paths normalized to NFC.

### Removed from distribution
- Git history, Obsidian workspace state, `.trash` and OS metadata. The original ZIP remains unchanged.
