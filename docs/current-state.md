# DataPath — текущее состояние (передача контекста)

> **Stable baseline:** `phase-4-complete`
> Актуальный commit можно получить командой `git rev-parse HEAD`.

## Фаза и результат

- Фазы 1–4 выполнены и приняты. Фаза 4: модель знаний (7 осей), прогресс
  пользователя, экран Today, кейсы и Studio.
- Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → Atlas/Focus/Studio`.

## Фактически реализованный стек

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, pydantic-settings,
  `python-frontmatter`, `markdown-it-py`, pytest, ruff (uv).
- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS v4, React Router v7,
  Zustand, Framer Motion, Vitest + Testing Library.
- **Инфраструктура:** Docker Compose (backend + frontend/nginx), Makefile.
- Ollama, ChromaDB, RAG **не** установлены (Фаза 6).

## Архитектурная граница

- **Python backend** — вся логика: парсинг vault, контент, знания, прогресс,
  кейсы, проверка ответов, состояния Atlas, Today.
- **React frontend** — только отображение готовых данных API: рендер, навигация,
  формы кейсов, отправка событий. Никаких расчётов знаний/прогресса во frontend.

## Backend-сервисы и API

Сервисы (`backend/app/services/`):
- `content_parser.py`, `content_validator.py`, `content_sync.py`,
  `content_catalog.py` — контентный каталог (Фаза 2).
- `lesson_content.py` — сцены уроков (Фаза 3).
- `labs/` — LabRegistry и 3 лаборатории (Фаза 3).
- `knowledge_model.py` — KnowledgeModelService: байесовская модель по 7 осям,
  состояния навыков, слабые темы, веса evidence (Фаза 4).
- `progress.py` — ProgressService: уроки, лаборатории, сводка, Today (Фаза 4).
- `cases/` — CaseRegistry + 2 кейса, CaseService (Фаза 4).
- `atlas.py` — AtlasBuilder + состояния узлов из прогресса/навыков (Фаза 4).
- CLI: `python -m app.cli.content {sync|validate|status}`.

API (все под `/api`, абсолютных путей в ответах нет):
- `GET /api/health`, `GET /api/system/status`, `GET /api/content/status`
- `GET /api/content/courses`, `/courses/{id}`, `/lessons/{id}`, `/items/{id}`
- `GET /api/labs/{lab_id}`, `POST /api/labs/{lab_id}/run`
- `GET /api/atlas` и `GET /api/content/atlas`
- `GET /api/progress/summary`, `/skills`, `/skills/{id}`, `/lessons/{id}`
- `POST /api/progress/lessons/{id}/scenes/{scene_id}/complete`,
  `/lessons/{id}/complete`, `/labs/{lab_id}/record`
- `GET /api/today`
- `GET /api/cases`, `/cases/{id}`, `/cases/{id}/attempts`,
  `POST /api/cases/{id}/submit`

## Модель знаний и прогресс (Фаза 4)

- **Модель знаний** — байесовская оценка навыков по 7 осям
  (`theory, reproduce, apply, code, interpret, explain, interview`),
  консервативная при малом evidence. Состояния:
  `not_started / exploring / developing / strong / needs_attention`.
  Слабые темы — только при достаточном evidence (без фиктивной аналитики).
- **Learning events** — журнал фактов обучения (`learning_events`,
  append-only) с `dedup_key`; повторная отправка одного результата не начисляет
  evidence повторно.
- **Прогресс** — `lesson_progress` (текущая сцена, завершённые сцены,
  завершение урока), `lab_attempts` (идемпотентное сохранение результатов
  лабораторий), `case_attempts` (попытки кейсов).
- **Today** — рабочий экран: главная карточка (продолжить урок / следующий урок
  маршрута), слабые темы, недавняя активность, рекомендуемый кейс, прогресс.
- **Atlas** — реальные состояния узлов (backend агрегирует assessments и
  прогресс уроков); визуальные состояния и режим «Слабые темы».
- **Studio** — два структурированных кейса: мини-кейс «Выбор ансамбля для
  оттока» и итоговый кейс «Churn end-to-end». Типы ответов:
  single/multiple/numeric/select/order. Режимы Guided / Standard / Interview.
  Оценка детерминированная (без AI); evidence по навыкам кейса.

Подробности — `docs/progress-system.md` и `docs/case-system.md`.

## Контентный каталог

- `content/vault` **не изменяется** приложением (только чтение).
- Каталог: 189 материалов; опубликовано 26.
- validate: 0 ошибок, 0 предупреждений; sync идемпотентен.
- Схема и правила — `docs/content-system.md`.

## Показатели

- backend: **126 тестов** (pytest);
- frontend: **53 теста** (Vitest);
- лабораторий: 3; кейсов: 2; уроков в курсе: 13 (MVP-маршрут: 07→06→08→09→10);
- Atlas: 100 узлов, 296 связей, 8 областей.

## Технический долг и что не реализовано

Известный долг:
- Starlette deprecation warning (`httpx → httpx2`) в TestClient.
- `/api/atlas` и `/api/content/atlas` — два пути к одному обработчику.
- Frontend bundle ~800 kB (KaTeX) — код-сплит в Фазе 7.
- Нет кастомной глобальной обработки ошибок FastAPI.
- В vault нет поля `prerequisites` (VAULT_SPEC): порядок задаётся структурой.

Ещё не реализовано:
- **Интервальное повторение** (review_queue, SM-2) — следующая фаза (5).
- **RAG** (embeddings, ChromaDB, Ollama) — Фаза 6.
- **AI-оценка свободного текста** и сцены
  retrieval/application/interview/reflection — Фаза 6.
- Авторизация и облачная синхронизация (не планируются в ближайших фазах).

## Следующая фаза (5)

Spaced repetition: очередь повторения и простой алгоритм (SM-2-like).
Подробнее — `docs/roadmap.md`.

## Команды

```bash
cd backend && PYTHONPATH= uv run python -m alembic upgrade head
PYTHONPATH= uv run python -m app.cli.content sync
PYTHONPATH= uv run python -m uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
# Makefile: dev-backend | dev-frontend | sync-content | test | lint | build | check
# Docker: docker compose build && docker compose up -d
```
