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
- Собран unsigned macOS bundle 11 МБ:
  `desktop/src-tauri/target/release/bundle/macos/DataPath.app`.
- Capacitor iOS target синхронизирован: `frontend/ios/App/App.xcodeproj`, iOS 15+.
- Добавлены README, MIT license для software, отдельное content notice, changelog, release notes,
  privacy/backup и source attribution documentation.

## Финальная матрица

- Content sync: 441 файлов, 365 catalogued items, 0 ошибок, 0 предупреждений.
- Content quality: 103 урока, 0 ошибок, 0 предупреждений, 62 необязательные рекомендации.
- Backend: 219/219 tests; одно upstream deprecation warning Starlette TestClient.
- Frontend: 109/109 tests.
- Ruff check/format, ESLint, TypeScript, Prettier, root production build и GitHub Pages base-path
  build проходят.
- `npm audit --omit=dev`: 0 vulnerabilities. Workflow YAML и `git diff --check` проходят.
- Browser production smoke: Today, Learn, Roadmap, Studio, Review, Atlas, Settings, Focus и
  критические visualizers открываются без FastAPI.
- Packaged macOS smoke: Today → Focus → note → close → reopen → note restored. Тестовая заметка
  удалена после проверки.

## Release blockers / optional / post-release

### Блокирует публичный tag/publish

- В checkout нет Git remote, поэтому Pages deployment, его реальный URL и GitHub-hosted Actions ещё
  не запущены. URL не выдуман, tag `v1.0.0` не создан.
- In-app browser Codex не подтвердил настоящий Service Worker offline runtime: build-time precache
  manifest и все его URL проверены, но после отключения preview lazy routes не обслуживались в этом
  browser sandbox. Перед публичным tag нужен один install → DevTools Offline → reload smoke в
  обычном Chrome/Safari на опубликованном Pages URL.

### Не блокирует локальный 1.0.0

- macOS bundle unsigned и не notarized.
- В среде установлен только Command Line Tools; iOS simulator/device build и signing не выполнены.
- Non-SQL code practice проверяет структуру решения, но не исполняет arbitrary Python.
- Focus chunk остаётся крупнейшим: около 469 kB до gzip / 140 kB gzip, но загружается лениво.

### После 1.0

- Cloud sync/accounts, AI tutor, App Store distribution и AlgoPath integration.

Сборка, публикация и tag checklist: `docs/release.md`.
