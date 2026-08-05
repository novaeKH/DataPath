# DataPath — учебная платформа Data Science

Локальная платформа для структурированного изучения Data Science: интерактивные
уроки, атлас знаний, интервальное повторение и AI-наставник на базе RAG.

**Статус: Фаза 4 — модель знаний, прогресс пользователя, Today и кейсы.**

> Решения по архитектуре и стеку зафиксированы в [`docs/decisions.md`](docs/decisions.md)
> и [`docs/architecture.md`](docs/architecture.md). Правила работы агента — в [`.hermes.md`](.hermes.md).

---

## Назначение

DataPath объединяет **Obsidian-хранилище** (`content/vault`) как единственный
источник учебных материалов, **Python backend** (весь контент, прогресс, проверка
заданий, RAG) и **React frontend** (только интерфейс и визуализация).

Жёсткое правило: **вся бизнес-логика — в backend**, frontend не дублирует
парсинг Markdown, вычисление prerequisites, построение маршрутов и т.д.

## Структура проекта

```text
ds-learning-rag/
├── content/vault/        # Канонический Obsidian vault (только чтение приложением)
├── docs/                 # Архитектура, решения, roadmap, контентная система
├── backend/              # FastAPI + SQLAlchemy + Alembic (Python 3.12, uv)
│   ├── app/
│   │   ├── api/          #   API-роутеры (health, system, content, atlas, progress, today, cases)
│   │   ├── cli/          #   CLI: python -m app.cli.content {sync|validate|status}
│   │   ├── core/         #   Конфигурация (pydantic-settings), логирование
│   │   ├── db/           #   engine/session, Base, модели каталога и прогресса
│   │   ├── services/     #   parser, validator, sync, catalog, atlas, knowledge_model, progress, cases
│   │   └── main.py       #   FastAPI entry point
│   ├── tests/            # pytest (126 тестов)
│   ├── alembic/          # Миграции (content catalog — Фаза 2)
│   └── pyproject.toml    # Зависимости и инструменты (uv)
├── frontend/             # React 18 + TypeScript + Vite + Tailwind v4 + React Router
│   └── src/
│       ├── views/        # Today/Atlas/Focus/Studio/SystemStatus
│       ├── components/   # Sidebar и др.
│       ├── stores/       # Zustand (тема)
│       ├── lib/          # API-клиент
│       └── test/         # Vitest setup
├── Makefile              # dev-backend, dev-frontend, sync-content, validate-content, test, lint, build, check
├── compose.yaml          # Docker Compose (backend + frontend)
└── .env.example          # Пример переменных окружения
```

## Требования

| Компонент | Версия |
|---|---|
| Python | 3.12 (управляется через `uv`) |
| [uv](https://docs.astral.sh/uv/) | 0.5+ |
| Node.js | 20+ (разработка проверена на Node 22/26) |
| npm | 10+ |
| Docker | 24+ (опционально, для Compose) |
| macOS / Linux | любая современная |

Проверка установки: `uv --version && node --version && npm --version`.

## Расположение учебных материалов

Канонический источник контента — **`content/vault`** (Obsidian-хранилище).
Приложение читает его **только на чтение** и не создаёт второй копии.
Путь задаётся в конфигурации backend как относительный:

```env
DATAPATH_VAULT_PATH=content/vault
```

В Docker Compose vault монтируется в контейнер read-only
(`./content/vault:/app/content/vault:ro`).

## Контентный каталог (Фаза 2)

Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → Atlas`.

### CLI

```bash
cd backend
PYTHONPATH= uv run python -m app.cli.content sync      # vault → SQLite каталог
PYTHONPATH= uv run python -m app.cli.content validate  # валидация без изменения БД
PYTHONPATH= uv run python -m app.cli.content status    # состояние каталога
```

`sync` показывает: `scanned / created / updated / unchanged / removed / errors / warnings`.
Синхронизация идемпотентна: повторный запуск без изменений не создаёт дубликатов.

Правила включения файлов и схема таблиц — в [`docs/content-system.md`](docs/content-system.md).

### REST API

| Endpoint | Описание |
|---|---|
| `GET /api/health` | Проверка работоспособности |
| `GET /api/system/status` | Технический статус backend/SQLite/vault |
| `GET /api/content/status` | Счётчики каталога: файлы vault, published, по типам, ошибки/предупреждения, время синка |
| `GET /api/content/courses` | Опубликованные курсы с metadata и количеством модулей/уроков/кейсов |
| `GET /api/content/courses/{id}` | Курс: модули по порядку, уроки, кейсы, первый/последний урок (Фаза 3) |
| `GET /api/content/lessons/{id}` | Урок: metadata, сцены, prev/next, лаборатории, материалы (Фаза 3) |
| `GET /api/content/items/{content_id}` | Metadata одного материала + связи + issues |
| `GET /api/labs/{lab_id}` | Метаданные лаборатории: параметры, диапазоны, дефолты, initial result (Фаза 3) |
| `POST /api/labs/{lab_id}/run` | Расчёт лаборатории по валидированным параметрам (Фаза 3) |
| `GET /api/atlas` (и `GET /api/content/atlas`) | Готовые данные Atlas: nodes, edges, areas, routes, prerequisites, детерминированная раскладка, состояния узлов (Фаза 4) |
| `GET /api/progress/summary` | Сводка: начатые/завершённые уроки, лабы, кейсы, распределение навыков, последние события, рекомендация (Фаза 4) |
| `GET /api/progress/skills` | Оценки навыков по осям, состояния, причины (Фаза 4) |
| `GET /api/progress/skills/{skill_id}` | Детали навыка: оси, confidence, типичные ошибки, последние события (Фаза 4) |
| `GET /api/progress/lessons/{lesson_id}` | Прогресс урока: текущая сцена, завершённые сцены (Фаза 4) |
| `POST /api/progress/lessons/{lesson_id}/scenes/{scene_id}/complete` | Сохранение прохождения сцены и позиции (Фаза 4) |
| `POST /api/progress/lessons/{lesson_id}/complete` | Завершение урока, слабое evidence по теории (Фаза 4) |
| `POST /api/progress/labs/{lab_id}/record` | Идемпотентное сохранение результата лаборатории + evidence (Фаза 4) |
| `GET /api/today` | Экран Today: продолжить урок, следующий урок, слабые темы, активность, рекомендуемый кейс (Фаза 4) |
| `GET /api/cases` | Список кейсов (Фаза 4) |
| `GET /api/cases/{case_id}` | Спецификация кейса по режиму (guided/standard/interview) (Фаза 4) |
| `POST /api/cases/{case_id}/submit` | Проверка ответов, результат с разбором, evidence (Фаза 4) |
| `GET /api/cases/{case_id}/attempts` | История попыток кейса (Фаза 4) |

Ответы не содержат абсолютных путей файловой системы. Полный Markdown-текст
через Atlas endpoint не отдаётся.

## Уроки и лаборатории (Фаза 3)

- Модель сцен: `markdown, formula, code, callout, checkpoint, interactive_lab`;
  парсер — `LessonContentService` (детали — [`docs/lesson-system.md`](docs/lesson-system.md)).
- Frontend: `/focus` (выбор урока) и `/focus/:lessonId` (урок со сценами),
  безопасный рендер Markdown (react-markdown + KaTeX + sanitize).
- Лаборатории: `decision-tree-split-lab`, `tree-depth-overfitting-lab`,
  `ensemble-comparison-lab` (scikit-learn; CatBoost — при наличии CPU-пакета).
- Atlas → Focus: кнопка «Открыть урок» для lesson-узлов, связанные уроки для concept.

## Прогресс и модель знаний (Фаза 4)

- **Модель знаний**: байесовская оценка навыков по 7 осям (`theory, reproduce,
  apply, code, interpret, explain, interview`), консервативная при малом
  evidence; состояния `not_started / exploring / developing / strong /
  needs_attention`; слабые темы — только при достаточном evidence.
  Детали — [`docs/progress-system.md`](docs/progress-system.md).
- **Прогресс**: сохранение текущей сцены урока, завершение урока, идемпотентное
  сохранение результатов лабораторий (повторная отправка не начисляет evidence
  повторно).
- **Today**: главная карточка действия (продолжить урок → следующий урок маршрута),
  слабые темы, недавняя активность, рекомендуемый кейс, прогресс маршрута.
- **Кейсы (Studio)**: мини-кейс «Выбор ансамбля для оттока» и итоговый кейс
  «Churn end-to-end»; структурированные ответы (single/multiple/numeric/select/order),
  режимы Guided/Standard/Interview, детерминированная оценка и разбор.
  Детали — [`docs/case-system.md`](docs/case-system.md).
- **Atlas**: состояния узлов вычисляются backend из skill assessments и прогресса
  уроков; визуальные состояния и режим «Слабые темы».

## Локальный запуск

### 1. Backend (FastAPI, порт 8000)

```bash
cd backend
uv sync                 # установка зависимостей в .venv (Python 3.12)
uv run python -m alembic upgrade head   # применить миграции (создаёт data/datapath.db)
uv run python -m app.cli.content sync   # синхронизировать каталог из content/vault
uv run python -m uvicorn app.main:app --reload
```

Проверка:

```bash
curl http://localhost:8000/api/health          # {"status":"ok",...}
curl http://localhost:8000/api/content/status  # счётчики каталога
curl http://localhost:8000/api/atlas           # данные Atlas
```

> `PYTHONPATH` окружения может «перекрывать» проектный venv (например, в терминале
> Hermes). При проблемах запускайте с префиксом: `PYTHONPATH= uv run ...`

### 2. Frontend (Vite dev server, порт 5173)

```bash
cd frontend
npm install
npm run dev
```

Откройте <http://localhost:5173>. Vite проксирует `/api/*` в backend
(`http://localhost:8000`), поэтому frontend ходит только по относительным путям.
Маршруты: `/today`, `/atlas`, `/focus`, `/studio`, `/system`; `/` ведёт на `/today`.

### 3. Makefile

```bash
make dev-backend        # uvicorn :8000
make dev-frontend       # vite :5173
make sync-content       # python -m app.cli.content sync
make validate-content   # python -m app.cli.content validate
make test               # pytest + vitest
make lint               # ruff + eslint + tsc + prettier
make build              # uv sync --frozen + frontend build
make check              # lint + test + build
```

## Запуск через Docker Compose

```bash
docker compose build     # сборка образов backend + frontend
docker compose up -d     # запуск: backend на :8000, frontend на :8080
docker compose exec backend python -m alembic upgrade head   # миграция
docker compose exec backend python -m app.cli.content sync  # синхронизация контента
```

Проверка:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8080/api/atlas   # через nginx frontend → backend
```

Остановка:

```bash
docker compose down
```

Compose запускает **только** backend и frontend. Ollama, ChromaDB и RAG
намеренно не включены (Фаза 6).

## Тесты и линтеры

### Backend

```bash
cd backend
uv run ruff format .          # форматирование
uv run ruff check .           # линт (Ruff)
uv run pytest                 # тесты (126 шт.)
```

### Frontend

```bash
cd frontend
npm run lint                  # ESLint
npx tsc -b                    # TypeScript check
npm run format:check          # Prettier check
npm run test                  # Vitest (53 шт.)
npm run build                 # production build (tsc -b && vite build)
```

## Результаты валидации реального vault (2026-08-05)

```
Валидация: 0 ошибок, 0 предупреждений
Синхронизация: scanned 264, created 189, unchanged 189, errors 0, warnings 0
```

Каталог по типам: `course 1`, `module 5`, `lesson 13`, `practice 78`,
`concept 67`, `interview 18`, `project 7`. Опубликовано (`app: include`): 26
(курс + 5 модулей + 13 уроков + 7 кейсов). Atlas содержит 100 узлов,
296 связей и 8 областей знаний.

## Текущие ограничения (Фаза 4)

- **RAG не реализован**: нет embeddings, ChromaDB, Ollama, чанкинга, retrieval.
- **Интервальное повторение не реализовано**: нет review_queue и алгоритма
  SM-2 — Фаза 5.
- **AI-оценка свободного текста не реализована**: кейсы используют только
  структурированные правила; сцены retrieval/application/interview/reflection —
  Фаза 6.
- **Один локальный пользователь**: без авторизации и облачной синхронизации.
- **Prerequisites** в vault не заданы полем frontmatter (VAULT_SPEC):
  явное поле поддерживается и валидируется, для уроков порядок внутри модуля
  даёт неявные рёбра `prerequisite` (детали — в docs/content-system.md).
- В backend нет глобальной обработки ошибок с кастомными JSON-ответами —
  используется стандартное поведение FastAPI.

## Технический долг (известный)

- Starlette выдаёт deprecation warning про `httpx` → `httpx2` в TestClient;
  не влияет на работу, обновится вместе со стеком.
- `/api/atlas` и `/api/content/atlas` — два пути к одному обработчику
  (задание Фазы 2 требует `/api/atlas`, ранние документы — `/content/atlas`).
- Frontend bundle ~800 kB (KaTeX + markdown-пайплайн) — код-сплит в Фазе 7.
- `content/vault` монтируется в контейнер как есть (включая служебные `.obsidian/`,
  `_meta/`); фильтрация выполняется парсером контента.
