# DataPath — учебная платформа Data Science

Локальная платформа для структурированного изучения Data Science: интерактивные
уроки, атлас знаний, интервальное повторение и AI-наставник на базе RAG.

**Статус: Фаза 1 — инфраструктура и минимальный рабочий каркас.**

> Решения по архитектуре и стеку зафиксированы в [`docs/decisions.md`](docs/decisions.md)
> и [`docs/architecture.md`](docs/architecture.md). Правила работы агента — в [`.hermes.md`](.hermes.md).

---

## Назначение

DataPath объединяет **Obsidian-хранилище** (`content/vault`) как единственный
источник учебных материалов, **Python backend** (весь контент, прогресс, проверка
заданий, RAG) и **React frontend** (только интерфейс и визуализация).

Жёсткое правило: **вся бизнес-логика — в backend**, frontend не дублирует расчёты
прогресса, очередь повторения, оценку ответов и т.д.

## Структура проекта

```text
ds-learning-rag/
├── content/vault/        # Канонический Obsidian vault (только чтение приложением)
├── docs/                 # Архитектура, решения, roadmap, контентная система
├── backend/              # FastAPI + SQLAlchemy + Alembic (Python 3.12, uv)
│   ├── app/
│   │   ├── api/          #   API-роутеры (health, system/status)
│   │   ├── core/         #   Конфигурация (pydantic-settings), логирование
│   │   ├── db/           #   SQLAlchemy engine/session, Base
│   │   ├── services/     #   Бизнес-логика (системный статус и далее)
│   │   └── main.py       #   FastAPI entry point
│   ├── tests/            # pytest
│   ├── alembic/          # Миграции
│   └── pyproject.toml    # Зависимости и инструменты (uv)
├── frontend/             # React 18 + TypeScript + Vite + Tailwind v4
│   └── src/
│       ├── views/        # System status + заглушки Today/Atlas/Focus/Studio
│       ├── stores/       # Zustand (UI-состояние)
│       ├── lib/          # API-клиент
│       └── components/   # Общие компоненты
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

## Локальный запуск

### 1. Backend (FastAPI, порт 8000)

```bash
cd backend
uv sync                 # установка зависимостей в .venv (Python 3.12)
uv run python -m alembic upgrade head   # применить миграции (создаёт data/datapath.db)
uv run python -m uvicorn app.main:app --reload
```

Проверка:

```bash
curl http://localhost:8000/api/health          # {"status":"ok",...}
curl http://localhost:8000/api/system/status   # статус SQLite/vault/Ollama/ChromaDB
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

## Запуск через Docker Compose

```bash
docker compose build     # сборка образов backend + frontend
docker compose up -d     # запуск: backend на :8000, frontend на :8080
```

Проверка:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8080/api/system/status   # через nginx frontend → backend
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
uv run pytest                 # тесты (12 шт.)
```

### Frontend

```bash
cd frontend
npm run lint                  # ESLint
npx tsc -b                    # TypeScript check
npm run format:check          # Prettier check
npm run build                 # production build (tsc -b && vite build)
```

## Текущие ограничения (Фаза 1)

- **RAG не реализован**: нет embeddings, ChromaDB, Ollama, чанкинга, retrieval.
- **Ollama / ChromaDB**: в `/api/system/status` возвращают `not_configured`.
- **Предметной схемы БД нет**: Alembic настроен, применена пустая baseline-миграция.
- **Frontend**: реализована техническая страница статуса; разделы Today/Atlas/Focus/Studio —
  только заглушки (Фаза 2). Роутер (React Router) будет добавлен в Фазе 2;
  сейчас навигация — на Zustand.
- **Темы light/dark**: базовая тёмная тема; переключение тем — позже.
- **Content parser / каталог**: не реализованы (Фаза 2).
- В backend нет глобальной обработки ошибок с кастомными JSON-ответами —
  используется стандартное поведение FastAPI (подробнее в техническом долге ниже).

## Технический долг (известный)

- Starlette выдаёт deprecation warning про `httpx` → `httpx2` в TestClient;
  не влияет на работу, обновится вместе со стеком.
- Визуальная проверка UI в браузере не выполнялась автоматически (на машине нет
  Chrome); HTTP-пути frontend ↔ backend проверены curl.
- `content/vault` монтируется в контейнер как есть (включая служебные `.obsidian/`,
  `_meta/`); фильтрация служебных файлов будет в парсере контента (Фаза 2).
