# DataPath — текущее состояние (передача контекста)

> **Stable baseline:** `phase-2-complete`
> Актуальный commit можно получить командой `git rev-parse HEAD`.

## Фаза и результат

- Фаза 2 выполнена и принята. Контентный каталог, навигация и базовый Atlas работают.
- Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → SVG Atlas`.

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
- `atlas.py` — AtlasBuilder + детерминированная раскладка.
- CLI: `python -m app.cli.content {sync|validate|status}`.

API (все под `/api`, абсолютных путей в ответах нет):
- `GET /api/health`, `GET /api/system/status`
- `GET /api/content/status` — счётчики каталога
- `GET /api/content/courses` — опубликованные курсы
- `GET /api/content/items/{content_id}` — metadata материала + связи + issues
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

- Маршруты: `/`, `/today`, `/atlas`, `/focus`, `/studio`, `/system`. Темы light/dark.
- Экран Today/Focus/Studio — заглушки (реализация — следующие фазы).
- Atlas (SVG): **100 узлов, 304 связи**, 8 областей, детерминированная раскладка.
- Режим **«Маршрут»** — по умолчанию: только MVP-маршрут и непосредственно связанные
  материалы, подписи читаемы без zoom.
- Режим **«Весь атлас»** — для обзора и zoom; подписи появляются при приближении.
- fit-to-content при открытии и по кнопке «Сбросить вид»; выбор узла не сбрасывает zoom/pan;
  информационная панель узла справа.

## Технический долг и что не реализовано

Известный долг:
- Starlette deprecation warning (`httpx → httpx2`) в TestClient.
- `/api/atlas` и `/api/content/atlas` — два пути к одному обработчику (требование + старые доки).
- Нет кастомной глобальной обработки ошибок FastAPI.
- В vault нет поля `prerequisites` (VAULT_SPEC): порядок задаётся структурой уроков.

Ещё не реализовано (Фазы 3–6):
- Модель знаний, прогресс (все узлы Atlas — `not_started`), повторение, RAG.
- Интерактивные уроки и сцены, Today с планом, режимы Atlas «Мой маршрут»/«Слабые темы».

## Цель Фазы 3

Интерактивные уроки: сценарий урока из `datapath`-JSON, сцены hook/content/interactive/
retrieval/reflection, рендер Markdown, первые интерактивные лабы, переход Atlas → Focus.

## Файлы, относящиеся к Фазе 3

- `frontend/src/views/FocusView.tsx` — экран урока (заглушка).
- `frontend/src/components/lesson/`, `interactive/` — папки для сцен и лабов.
- `backend/app/api/content.py` — добавить `GET /api/content/lessons/{id}` и сценарий урока.
- `backend/app/services/` — разбор `datapath`-блоков и source-контента.
- `docs/roadmap.md` — раздел «Фаза 3».

## Команды запуска и проверок

```bash
# Backend (порт 8000)
cd backend && PYTHONPATH= uv run python -m alembic upgrade head
PYTHONPATH= uv run python -m app.cli.content sync        # vault → SQLite
PYTHONPATH= uv run python -m uvicorn app.main:app --reload

# Frontend (порт 5173)
cd frontend && npm install && npm run dev

# Makefile
make dev-backend | dev-frontend | sync-content | validate-content
make test | lint | build | check

# Docker
docker compose build && docker compose up -d
docker compose exec backend uv run python -m app.cli.content sync
```
