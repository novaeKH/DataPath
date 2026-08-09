# DataPath 1.0.0 release guide

DataPath — single-user local-first приложение. Web/PWA, macOS и iOS используют одну
React/TypeScript application/domain codebase; Tauri и Capacitor остаются тонкими platform shells.

## Local data and backup

Основное состояние хранится под ключом `datapath.local-state`, schema v2. На macOS Tauri WebKit
container находится в:

```text
~/Library/WebKit/local.datapath.learning/WebsiteData/
```

В iOS данные находятся в private WebKit container приложения. Не копируйте внутренние
SQLite-файлы вручную. Export в «Настройки → Backup учебного состояния» включает progress,
mastery, Review, practice/case history, notes, settings и resume state. Import проверяет format,
version и checksum до изменения текущего состояния; повреждённый или более новый state
отклоняется. Перед обновлением приложения рекомендуется создать export.

## Web / GitHub Pages

Локальная production-сборка:

```bash
make build-web
cd frontend && npm run preview
```

Результат — `frontend/dist`. Manifest, service worker, icons, hashed assets, release snapshot и
SQLite WASM входят в offline cache. PWA становится offline-capable после первой успешной загрузки.

Repository workflow `.github/workflows/pages.yml` строит приложение с repository base path,
публикует artifact и использует GitHub Pages Actions.

Публичная PWA:

`https://novaekh.github.io/DataPath/`

Pages настроен с **Source: GitHub Actions**. Каждый push в `main` запускает deployment; фактический
URL также публикуется environment `github-pages` job `deploy`.

Hash routing и base-aware manifest/service worker позволяют открывать вложенные экраны под путём
`/<repository>/` без server rewrite rules.

Проверка установки на iPhone:

1. Открыть deployment URL в Safari и выбрать **Поделиться → На экран «Домой»**.
2. Запустить DataPath с домашнего экрана и дождаться первой загрузки snapshot.
3. Открыть Today, один урок и SQL Studio, затем полностью закрыть приложение.
4. Включить авиарежим и повторно открыть те же экраны.
5. Изменить заметку или progress, перезапустить PWA и проверить сохранение состояния.

## macOS

```bash
make build-macos
```

Artifact:

```text
desktop/src-tauri/target/release/bundle/macos/DataPath.app
desktop/src-tauri/target/release/bundle/dmg/DataPath_1.0.0_aarch64.dmg
```

GitHub Release download:
`https://github.com/novaeKH/DataPath/releases/download/v1.0.0/DataPath_1.0.0_aarch64.dmg`.

Bundle unsigned и предназначен для личной установки. Его можно перенести в `/Applications` и
запускать без Terminal/FastAPI. При первом запуске нужно использовать **Control-click → Открыть →
Открыть**: это точечное подтверждение unsigned приложения, не требующее отключения Gatekeeper.
Размер и позиция окна сохраняются Tauri window-state plugin. Signing, notarization и публикация в
App Store не входят в 1.0.0.

## iOS / physical iPhone

```bash
make ios-open
```

Xcode project:

```text
frontend/ios/App/App.xcodeproj
```

Минимальные действия в Xcode:

1. Откройте target `App` → Signing & Capabilities и выберите Apple Development Team.
2. При конфликте замените bundle identifier `local.datapath.learning` на личный уникальный.
3. Подключите и разблокируйте iPhone, подтвердите Trust/Developer Mode и выберите его как target.
4. Нажмите Run. Для Personal Team iOS может попросить доверить developer profile.

Перед открытием Xcode команда заново генерирует snapshot, production bundle и синхронизирует его в
native target. Simulator/device build не является подтверждённым в среде без полного Xcode,
iOS runtime, signing и подключённого устройства.

## Verification

```bash
make sync-content
make validate-content
make lint
make test
make build-web
make build-macos
make ios-sync
```

Дополнительно release QA проверяет production/PWA без FastAPI, first-load → offline reload,
backup round-trip, критические interactive visualizers и сохранение state после перезапуска `.app`.

## Tag preparation

Тег создаётся только после успешной локальной матрицы и GitHub Actions:

```bash
git tag -a v1.0.0 -m "DataPath 1.0.0"
git push origin main --follow-tags
```

Команды приведены как release checklist; локальная подготовка не создаёт тег автоматически.

## Known limitations

- Нет App Store distribution, signing/notarization, cloud sync, accounts и AlgoPath integration.
- SQL исполняется локально; остальные code exercises проверяют структуру, но не запускают
  произвольный Python.
- iOS device/simulator verification требует внешнего Xcode/signing окружения.
- Focus lazy-loaded, но остаётся крупнейшим frontend chunk.
