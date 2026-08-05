# DataPath — текущее состояние (передача контекста)

> **Stable baseline:** `phase-5-complete`
> Актуальный commit можно получить командой `git rev-parse HEAD`.

## Фаза и результат

- Фазы 1–5 выполнены и приняты. Фаза 5: интервальное повторение, Review и
  расписание (SM-2-like).
- Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → Atlas/Focus/Studio/Review`.

## Фактически реализованный стек

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, pydantic-settings,
  `python-frontmatter`, `markdown-it-py`, pytest, ruff (uv).
- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS v4, React Router v7,
  Zustand, Framer Motion, Vitest + Testing Library.
- **Инфраструктура:** Docker Compose (backend + frontend/nginx), Makefile.
- Ollama, ChromaDB, RAG **не** установлены (Фаза 6).

## Архитектурная граница

- **Python backend** — вся логика: парсинг vault, контент, знания, прогресс,
  кейсы, повторения, проверка ответов, состояния Atlas, Today.
- **React frontend** — только отображение готовых данных API: рендер, навигация,
  формы, отправка ответов и оценок. Никаких расчётов знаний/прогресса/
  расписания во frontend.

## Backend-сервисы и API

Сервисы (`backend/app/services/`):
- `content_parser.py`, `content_validator.py`, `content_sync.py`,
  `content_catalog.py` — контентный каталог (Фаза 2).
- `lesson_content.py` — сцены уроков (Фаза 3).
- `labs/` — LabRegistry и 3 лаборатории (Фаза 3).
- `knowledge_model.py` — KnowledgeModelService: байесовская модель по 7 осям,
  состояния навыков, слабые темы (Фаза 4).
- `progress.py` — ProgressService: уроки, лаборатории, сводка, Today (Фаза 4).
- `cases/` — CaseRegistry + 2 кейса, CaseService (Фаза 4).
- `atlas.py` — AtlasBuilder + состояния узлов (Фаза 4, due-индикатор — Фаза 5).
- `reviews/` — ReviewTemplateRegistry (15 шаблонов), clock, scheduler, queue,
  answer (Фаза 5).
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
- `GET /api/reviews/summary`, `/queue`, `/{id}`, `/history`,
  `POST /api/reviews/{id}/submit`, `/skip`

## Модель знаний и прогресс (Фаза 4)

- **Модель знаний** — байесовская оценка навыков по 7 осям
  (`theory, reproduce, apply, code, interpret, explain, interview`),
  консервативная при малом evidence. Состояния:
  `not_started / exploring / developing / strong / needs_attention`.
- **Learning events** — журнал фактов обучения (`learning_events`, append-only)
  с `dedup_key`; повторная отправка не начисляет evidence повторно.
- **Прогресс** — `lesson_progress`, `lab_attempts`, `case_attempts`.
- **Today** — главная карточка, повторения, слабые темы, активность, кейс.
- **Atlas** — реальные состояния узлов + режим «Слабые темы».

Подробности — `docs/progress-system.md`, `docs/case-system.md`.

## Интервальное повторение (Фаза 5)

- Таблицы `review_items` (текущее состояние элемента, `template_id` уникален)
  и `review_attempts` (неизменяемая история ответов) — миграция `f5a1b2c3d4e5`.
- **ReviewTemplateRegistry** — расширяемый реестр; **15 шаблонов** MVP-маршрута
  (Decision Tree → Bias/Variance → Random Forest → Gradient Boosting → CatBoost →
  сравнение). Все ID (skills/content/lessons/labs/cases) реальные.
- Типы вопросов: `single_choice, multiple_choice, ordering, numeric,
  parameter_selection, error_diagnosis, reveal_and_rate` (последний — слабое
  evidence, свободный текст не оценивается).
- **Bootstrap очереди** — ленивый и идемпотентный: из завершённых уроков,
  успешных лаб (score ≥ 0.6) и кейсов; дубликатов не создаёт.
- **Scheduler** — прозрачный SM-2-like: Again → ~10 мин (relearning),
  Hard → 1 дн, Good → 3 дн, Easy → 7 дн; ease 1.3–2.8, cap 365 дней.
- **Оценки** — Again / Hard / Good / Easy; неправильный ответ → effective Again,
  частичный → не выше Hard, правильный → пользовательская оценка.
- **Deduplication** — `dedup_key` уникален; повторная отправка не создаёт
  вторую попытку и не начисляет evidence повторно.
- **Knowledge Model** — ответ создаёт learning event (`review_answer`) и
  обновляет 7 осей через существующий KnowledgeModelService.
- **Экран `/review`** — сессия: вопрос, проверка, объяснение, оценки, итог.
- **Today / Focus / Atlas** — карточка повторений и приоритет review-сессии
  (Today), ссылка «Повторить тему» (Focus), due-индикатор на уроках (Atlas).

Подробности — `docs/review-system.md`.

## Контентный каталог

- `content/vault` **не изменяется** приложением (только чтение).
- Каталог: 189 материалов; опубликовано 26. validate: 0 ошибок, 0 предупреждений.

## Показатели

- backend: **162 теста** (pytest);
- frontend: **74 теста** (Vitest);
- integration check (реальный каталог, Фаза 5): **12/12 PASS**;
- Docker smoke (build → up → migrate → sync → review flow → nginx → down): **PASS**;
- лабораторий: 3; кейсов: 2; уроков в курсе: 13 (MVP-маршрут: 07→06→08→09→10);
- Atlas: 100 узлов, 296 связей, 8 областей.

## Технический долг и что не реализовано

Известный долг:
- Starlette deprecation warning (`httpx → httpx2`) в TestClient.
- `/api/atlas` и `/api/content/atlas` — два пути к одному обработчику.
- Frontend bundle ~800 kB (KaTeX) — код-сплит в Фазе 7.
- Нет кастомной глобальной обработки ошибок FastAPI.

Ещё не реализовано:
- **AI-наставник, embeddings и локальный RAG** (ChromaDB, Ollama) — Фаза 6.
- **AI-оценка свободного текста** и сцены
  retrieval/application/interview/reflection — Фаза 6.
- Авторизация и облачная синхронизация (не планируются в ближайших фазах).

## Следующая фаза (6)

AI-наставник и локальный RAG: индексация vault (чанкинг → embeddings →
ChromaDB), retrieval (гибрид), генерация с цитатами, стриминг.
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
