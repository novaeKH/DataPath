# DataPath — release architecture

Дата: 2026-08-10. Версия: 1.0.0.

## Runtime boundary

```text
content/vault
    │  sync + validation (authoring time, Python)
    ▼
release-snapshot.json ─────────────────────────────┐
                                                  ▼
React application → shared learning/domain logic → platform services
                                                  │
                         ┌────────────────────────┼──────────────────────┐
                         ▼                        ▼                      ▼
                    Web / PWA               Tauri macOS           Capacitor iOS
                    local store             WKWebView store       WKWebView store
                    SQLite WASM              SQLite WASM           SQLite WASM
```

В установленном приложении FastAPI не является runtime dependency. `localApi` обслуживает тот же
frontend contract из bundled snapshot, а `releaseStore` сохраняет один versioned local state.
Platform detection сосредоточен в `frontend/src/platform`; React views не знают, запущены ли они в
PWA, Tauri или Capacitor.

## Local state

Schema v2 хранит lesson progress/resume, mastery, Review queue/history, practice history,
case attempts, notes, settings, current roadmap position и Today state. Миграции additive и
сохраняют v1 progress; state из более новой неизвестной версии отклоняется. Import проверяет
format, version и checksum до замены данных.

Самооценка пишет semantic outcome (`self_confident`, `self_review`, `self_uncertain`), обновляет
слабое mastery evidence и назначает Review через 4 дня, 1 день или 6 часов. Factual quiz использует
`correct`/`incorrect`; неверный ответ не начисляет положительное evidence.

## Authoring backend

FastAPI/SQLAlchemy остаются для `make dev`, синхронизации vault, content validation, генерации
snapshot и тестирования canonical services. Release snapshot экспортирует только опубликованный
scope и приватные runtime keys для локальной проверки practice/cases. Он не содержит secrets и
не предоставляет filesystem access native wrapper.

## Content and scope

`content/vault` остаётся каноническим источником. Visualizer ID обязан проходить backend allowlist
и существовать во frontend registry. Algorithms данные сохранены, но release providers фильтруют
course/area/practice track; будущий внешний AlgoPath подключается adapter-контрактом.

## Offline and security

PWA service worker вычисляет URLs из registration scope и pre-caches index, hashed JS/CSS,
snapshot и `sql-wasm.wasm`; navigation получает app-shell fallback и работает под GitHub Pages
repository subpath. Tauri CSP разрешает только bundled resources/WASM и IPC origin. Markdown
проходит `rehype-sanitize`; SQL runner принимает только один read-only `SELECT`/`WITH`; backup
валидируется checksum. Регистрации, auth, network secrets и unrestricted native filesystem API нет.
