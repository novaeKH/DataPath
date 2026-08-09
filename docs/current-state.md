# DataPath — текущее состояние

> Обновлено 2026-08-10. Версия 1.0.0, single-user/local-first.

## Release scope

- В canonical vault — 103 source-backed урока. В основной Roadmap опубликованы 86 уроков по
  Python, NumPy/pandas, математике и статистике, SQL/scikit-learn, Classic ML, Deep Learning, NLP,
  LLM/RAG и MLOps.
- Algorithms исключён из release navigation, Roadmap, Atlas и Studio. Исходные материалы не
  удалены; сохранена только adapter boundary для отдельного AlgoPath.
- Roadmap использует три прохода: orientation, understanding, application.
- В registry — 57 валидируемых интерактивных visual demos; опубликованные demo ID имеют реальные
  frontend renderers. Сохранены три отдельные ML-лаборатории.
- Studio содержит 15 упражнений, включая 6 исполняемых локальных SQLite-задач, и 9 mini-cases.

## Рабочий учебный цикл

- Today формирует компактную сессию lesson + practice + Review.
- Focus рендерит source-backed sections, KaTeX, code, checkpoint, visual demo и lab; сохраняет
  resume position, completion, notes и assessment outcomes.
- Review различает factual quiz, conceptual/free response, code/error diagnosis и reveal/rate;
  расписание и mastery обновляются из результата, а не из открытия страницы.
- Atlas — block map по course/module/lesson с реальным mastery, due count и связями.
- Versioned local store schema v2 хранит progress, mastery, Review, practice/cases, notes, settings,
  current roadmap position и Today state. Backup import проверяет format/version/checksum до записи.

## Distribution

- Версия 1.0.0 синхронизирована в frontend, backend, release snapshot, Tauri и iOS target.
- GitHub Actions CI проверяет content/backend и frontend независимо.
- GitHub Pages workflow собирает repository-subpath-safe PWA с hash routing. Vite генерирует
  manifest 74 hashed assets; service worker pre-caches их вместе со snapshot и SQLite WASM.
- Исходники опубликованы в `https://github.com/novaeKH/DataPath`; CI и Pages deployment проходят.
- Публичная PWA: `https://novaekh.github.io/DataPath/`.
- Собран и проверен unsigned Apple Silicon DMG 4.2 МБ:
  `desktop/src-tauri/target/release/bundle/dmg/DataPath_1.0.0_aarch64.dmg`.
- Capacitor iOS target синхронизирован: `frontend/ios/App/App.xcodeproj`, iOS 15+.
- Добавлены README, MIT license для software, отдельное content notice, changelog, release notes,
  privacy/backup и source attribution documentation.

## Финальная матрица

- Content sync: 441 файлов, 365 catalogued items, 0 ошибок, 0 предупреждений.
- Content quality: 103 урока, 0 ошибок, 0 предупреждений, 62 необязательные рекомендации.
- Backend: 219/219 tests; одно upstream deprecation warning Starlette TestClient.
- Frontend: 110/110 tests.
- Ruff check/format, ESLint, TypeScript, Prettier, root production build и GitHub Pages base-path
  build проходят.
- `npm audit --omit=dev`: 0 vulnerabilities. Workflow YAML и `git diff --check` проходят.
- Public Pages browser smoke: Today → Focus, regression visualizer, Studio SQLite execution,
  Review и Atlas открываются без FastAPI и console errors.
- Packaged macOS smoke: Today → Focus → note → close → reopen → note restored. Тестовая заметка
  удалена после проверки.

## Release blockers / optional / post-release

### Публичная проверка

- Source push, GitHub-hosted CI, Pages deployment и публичный representative browser flow прошли.
- Service worker использует versioned cache `v10`, pre-cache manifest и network-first navigation;
  install → авиарежим → reload на физическом iPhone остаётся пользовательской acceptance-проверкой.

### Не блокирует локальный 1.0.0

- macOS bundle unsigned и не notarized.
- В среде установлен только Command Line Tools; iOS simulator/device build и signing не выполнены.
- Non-SQL code practice проверяет структуру решения, но не исполняет arbitrary Python.
- Focus chunk остаётся крупнейшим: около 469 kB до gzip / 140 kB gzip, но загружается лениво.

### После 1.0

- Cloud sync/accounts, AI tutor, App Store distribution и AlgoPath integration.

Сборка, публикация и tag checklist: `docs/release.md`.
