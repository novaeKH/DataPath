# DataPath — текущее состояние (передача контекста)

> **Stable baseline:** `phase-3-complete`
> Актуальный commit можно получить командой `git rev-parse HEAD`.

## Фаза и результат

- Фаза 3 выполнена и принята: интерактивные уроки, сцены, Focus,
  3 интерактивные лаборатории, переход Atlas → Focus.
- Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → Atlas/Focus`.

## Фактически реализованный стек

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, pydantic-settings,
  `python-frontmatter`, `markdown-it-py`, pytest, ruff (uv).
- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS v4, React Router v7,
  Zustand, Framer Motion, Vitest + Testing Library. Без force-directed и тяжёлых библиотек.
- **Инфраструктура:** Docker Compose (backend + frontend/nginx), Makefile.
- Ollama, ChromaDB, RAG **не** устанавливались.

## Архитектурная граница

- **Python backend** — вся логика контента: обход vault, чтение Markdown, frontmatter,
  определение типов, построение связей и prerequisites, валидация, sync SQLite,
  формирование данных Atlas.
- **React frontend** — только отображение готовых данных через API (render, zoom/pan,
  режимы Atlas, темы). Без парсинга Markdown, вычисления prerequisites/маршрутов во frontend.

## Backend-сервисы и API

Сервисы (`backend/app/services/`):
- `content_parser.py` — VaultScanner, MarkdownParser (frontmatter, wiki/markdown-ссылки, hash).
- `content_validator.py` — ContentValidator, FileIndex (ошибки/предупреждения, циклы, slug).
- `content_sync.py` — ContentSyncService (идемпотентный sync vault → SQLite, отчёт).
- `content_catalog.py` — ContentCatalogService (чтение каталога для API).
- `lesson_content.py` — LessonContentService (сцены урока, безопасное чтение vault).
- `labs/` — LabRegistry и 3 лаборатории (decision-tree-split, tree-overfitting, ensemble-comparison).
- `atlas.py` — AtlasBuilder + детерминированная раскладка.
- CLI: `python -m app.cli.content {sync|validate|status}`.

API (все под `/api`, абсолютных путей в ответах нет):
- `GET /api/health`, `GET /api/system/status`
- `GET /api/content/status` — счётчики каталога
- `GET /api/content/courses` — опубликованные курсы
- `GET /api/content/courses/{id}` — курс с модулями, уроками, кейсами (Фаза 3)
- `GET /api/content/lessons/{id}` — урок со сценами и лабораториями (Фаза 3)
- `GET /api/content/items/{content_id}` — metadata материала + связи + issues
- `GET /api/labs/{lab_id}` и `POST /api/labs/{lab_id}/run` — лаборатории (Фаза 3)
- `GET /api/atlas` и `GET /api/content/atlas` — nodes, edges, areas, routes, prerequisites, layout

## Контентный каталог (SQLite, миграция `a1b2c3d4e5f6`)

Таблицы: `content_items`, `content_links`, `content_issues`, `sync_runs`.

Включение файлов: исключаются служебные каталоги (`.obsidian`, `_meta`, `00/01/02`,
`90 Шаблоны`, `99 Вложения`), dot-файлы, типы `moc/meta/router/template/solution/source`,
`app: exclude`, `status: deprecated`, битый/отсутствующий frontmatter. `publish = (app == "include")`.
Типы каталога: `course, module, lesson, practice, concept, interview, project, deep-dive`.

Связи: wiki/markdown-ссылки (`link`), `applied_in` (lesson → concept через `content_path`),
`prerequisite` (явное поле или неявный порядок уроков в модуле). Полная схема — в
`docs/content-system.md`.

## Реальная синхронизация vault (2026-08-05)

- `content/vault` **не изменялся** (приложение читает только на чтение).
- Каталог содержит **189 материалов**; опубликовано **26**.
- По типам: course 1, module 5, lesson 13, practice 78, concept 67, interview 18, project 7.
- validate: 0 ошибок, 0 предупреждений. sync идемпотентен (повторный запуск — 189 unchanged).

## Frontend и Atlas

- Маршруты: `/`, `/today`, `/atlas`, `/focus`, `/focus/:lessonId`, `/studio`, `/system`. Темы light/dark.
- **Focus** реализован (Фаза 3): уроки со сценами и лабораториями.
- **Today/Studio** — заглушки (реализация — Фазы 4+).
- Atlas (SVG): **100 узлов, 304 связи**, 8 областей, детерминированная раскладка,
  режимы «Маршрут»/«Весь атлас», fit-to-content, информационная панель узла.

## Фаза 3: интерактивные уроки и лаборатории

Реализовано:

- Lesson pipeline: `GET /api/content/courses/{id}`, `GET /api/content/lessons/{id}`.
- Сцены: `markdown, formula, code, callout, checkpoint, interactive_lab`
  (парсер — `LessonContentService`; полная модель — `docs/lesson-system.md`).
- Focus: маршруты `/focus` и `/focus/:lessonId`, рендер Markdown
  (react-markdown + KaTeX + sanitize), навигация по сценам и урокам.
- Интерактивные лаборатории: `decision-tree-split-lab`,
  `tree-depth-overfitting-lab`, `ensemble-comparison-lab`
  (API: `GET /api/labs/{id}`, `POST /api/labs/{id}/run`; scikit-learn + CatBoost).
- Atlas → Focus: кнопка «Открыть урок» для lesson, связанные уроки для concept.

Показатели:

- backend: **75 тестов** (pytest) — course/lesson API, сцены, безопасность, лабы;
- frontend: **40 тестов** (Vitest) — Focus, сцены, навигация, лаборатории, Atlas→Focus;
- лабораторий: **3**; уроков в курсе: 13 (MVP-маршрут: 07→06→08→09→10).

## Технический долг и что не реализовано

Известный долг:
- Starlette deprecation warning (`httpx → httpx2`) в TestClient.
- `/api/atlas` и `/api/content/atlas` — два пути к одному обработчику (требование + старые доки).
- Нет кастомной глобальной обработки ошибок FastAPI.
- В vault нет поля `prerequisites` (VAULT_SPEC): порядок задаётся структурой уроков.
- Frontend bundle ~800 kB (KaTeX + markdown-пайплайн) — код-сплит в Фазе 7.

Ещё не реализовано (Фазы 4–6):
- Модель знаний, пользовательский прогресс (все узлы Atlas — `not_started`),
  skill assessment, spaced repetition, AI-наставник, RAG.
- Today с планом, режимы Atlas «Мой маршрут»/«Слабые темы».
- Сцены retrieval/application/interview/reflection (AI-оценка, прогресс).

## Следующая фаза (4)

Модель знаний и прогресс: сохранение результатов пользователя, обновление
состояния узлов Atlas, мини-кейсы. Подробнее — `docs/roadmap.md`.

## Команды

```bash
cd backend && PYTHONPATH= uv run python -m alembic upgrade head
PYTHONPATH= uv run python -m app.cli.content sync
PYTHONPATH= uv run python -m uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
# Makefile: dev-backend | dev-frontend | sync-content | test | lint | build | check
# Docker: docker compose build && docker compose up -d
```
