# DataPath — архитектура MVP

## Обзор компонентов

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + TypeScript + Vite                                   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐│
│  │  Today   │  │  Atlas   │  │  Focus   │  │    Studio     ││
│  │ (план)   │  │(карта    │  │(уроки,   │  │(кейсы,       ││
│  │          │  │ знаний)  │  │повторение│  │ проекты)     ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘│
│                                                              │
│  Zustand stores:                                             │
│  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────────┐│
│  │Content │ │ Progress │ │ Review │ │     UI / Theme       ││
│  │ Store  │ │  Store   │ │ Store  │ │       Store          ││
│  └────────┘ └──────────┘ └────────┘ └──────────────────────┘│
└──────────────────────┬──────────────────────────────────────┘
                       │  REST + SSE (localhost:8000)
┌──────────────────────┴──────────────────────────────────────┐
│                       BACKEND                                │
│  FastAPI (Python 3.12+)                                      │
│                                                              │
│  ┌────────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐│
│  │Content API │  │Progress   │  │Review API │  │RAG API   ││
│  │/courses/*  │  │API        │  │/review/*  │  │/ai/*     ││
│  │/lessons/*  │  │/progress/*│  │           │  │(SSE)     ││
│  └─────┬──────┘  └─────┬─────┘  └─────┬─────┘  └────┬─────┘│
│        │               │              │             │       │
│  ┌─────┴───────────────┴──────────────┴─────────────┴─────┐ │
│  │                     Services                            │ │
│  │  ContentService  ProgressService  ReviewService  RAG    │ │
│  │  (каталог)       (оценки)         (очередь)     Service│ │
│  └─────────────────────────┬──────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────┘
                             │
              ┌──────────────┼───────────────┐
              │              │               │
     ┌────────┴──────┐ ┌─────┴──────┐ ┌──────┴──────────┐
     │    SQLite     │ │  ChromaDB  │ │    Ollama API   │
     │ (WAL mode)    │ │(embeddings)│ │  (localhost:    │
     │               │ │            │ │   11434)        │
     │ • content     │ │ • chunks   │ │                 │
     │ • progress    │ │ • metadata │ │ • LLM (generate)│
     │ • review      │ │ • vectors  │ │ • Embeddings    │
     │ • user state  │ │            │ │                 │
     │ • ai dialogs  │ │            │ │                 │
     └───────────────┘ └────────────┘ └─────────────────┘
```

## Архитектурная граница: Backend ↔ Frontend

**Жёсткое правило:** вся бизнес-логика — на backend; frontend только для отображения и взаимодействия.

| Слой | Отвечает за | Не отвечает за |
|---|---|---|
| **Python Backend** | Парсинг vault, модель знаний (байесовские оценки), очередь повторения (SM-2), проверка рубрик, RAG (чанкинг → retrieval → генерация), валидация целостности | Рендеринг UI, анимации, визуализацию графов |
| **React Frontend** | Навигацию, рендеринг контента, Atlas (SVG), интерактивные лабы (D3), анимации (Framer Motion), графики (Recharts), стриминг-клиент SSE, состояние UI (тема, zoom) | Бизнес-вычисления, оценку ответов пользователя, принятие решений о повторении |

**Запрещено:**
- Дублировать бизнес-логику (оценки, приоритизацию, правила повторения) во frontend
- Вычислять skill_assessment или next-review на клиенте
- Реализовывать чанкинг или retrieval на клиенте
- Принимать содержательные решения о следующем шаге обучения во frontend

## Поток данных: контент → приложение

```
content/vault/
    │
    ▼
┌─────────────────────────────────────┐
│ Content Parser (CLI / startup hook)  │
│                                     │
│ 1. Обход файловой системы           │
│    ├─ Фильтрация по расширению (.md)│
│    ├─ Пропуск исключённых папок     │
│    │  (.obsidian/, _meta/, шаблоны) │
│    └─ Обнаружение изменений по mtime│
│                                     │
│ 2. Парсинг frontmatter (YAML)      │
│    └─ Извлечение: id, type, area,   │
│       status, rag, app, skill_ids…  │
│                                     │
│ 3. Классификация                    │
│    ├─ app: include → в каталог      │
│    ├─ app: source → только ссылка   │
│    └─ app: exclude → пропустить     │
│                                     │
│ 4. Сохранение в SQLite              │
│    └─ Таблица content_catalog:      │
│       id, path, type, area,         │
│       frontmatter (JSON),           │
│       content_hash, updated_at      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ RAG Indexer (CLI / startup hook)    │
│                                     │
│ 1. Выборка: type IN concept,        │
│    deep-dive, practice (rag:include)│
│    + rag_collection = knowledge     │
│                                     │
│ 2. Чанкинг (по H2/H3 заголовкам)   │
│    └─ metadata: id, title, aliases, │
│       breadcrumb, source_path       │
│                                     │
│ 3. Embedding (Ollama API)           │
│    └─ Модель: bge-m3 / nomic-embed  │
│                                     │
│ 4. Сохранение в ChromaDB            │
│    └─ Коллекции: knowledge,         │
│       practice, interview           │
└─────────────────────────────────────┘
```

## Поток данных: RAG-запрос

```
Пользовательский запрос
    │
    ▼
┌──────────────────────────────────────┐
│ 1. Контекст запроса                  │
│    ├─ Текущий урок (skill_ids)       │
│    ├─ Профиль знаний пользователя    │
│    │  (слабые темы → приоритет)      │
│    ├─ Режим наставника               │
│    │  (объяснение/сократический/     │
│    │   разбор ошибки/интервью)       │
│    └─ История диалога (последние 5)  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 2. Retrieval                         │
│    ├─ Hybrid: lexical (FTS5) +       │
│    │  semantic (embeddings)          │
│    ├─ Фильтр: skill_ids, коллекция   │
│    ├─ Лимит: максимум 2 чанка от     │
│    │  одного файла                   │
│    └─ Приоритет: knowledge →         │
│       deep-dive → practice           │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 3. Reranking (опционально, этап 2)   │
│    ├─ bge-reranker-v2-m3             │
│    └─ Топ-5 после rerank             │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 4. Prompt assembly                   │
│    ├─ Системный промпт (роль,        │
│    │  ограничения, формат цитат)     │
│    ├─ Контекст (чанки + metadata)    │
│    ├─ Профиль знаний                 │
│    ├─ Текущий урок (если есть)       │
│    └─ Запрос пользователя            │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 5. Generation (Ollama, SSE stream)   │
│    ├─ Модель: llama3.2:3b / qwen2.5  │
│    ├─ temperature: 0.4               │
│    └─ Стриминг токенов → SSE → FE    │
└──────────────────┬───────────────────┘
                   ▼
           Ответ с цитатами
```

## Структура базы данных (SQLite)

Реализация Фазы 2 (миграция `a1b2c3d4e5f6`) — полная схема в docs/content-system.md.
Кратко:

```sql
-- Контент-каталог: зеркало структуры vault (реализовано в Фазе 2)
CREATE TABLE content_items (
    id          TEXT PRIMARY KEY,          -- стабильный ID из frontmatter
    path        TEXT NOT NULL UNIQUE,      -- относительный путь в content/vault
    type        TEXT NOT NULL,             -- course, module, lesson, practice, concept...
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL,
    area        TEXT, status TEXT, language TEXT,
    app         TEXT NOT NULL,             -- include | source
    rag         TEXT, rag_collection TEXT,
    publish     BOOLEAN NOT NULL,          -- app == 'include'
    course_id   TEXT REFERENCES content_items(id),
    module_id   TEXT REFERENCES content_items(id),
    module_order INTEGER, lesson_order INTEGER,
    content_path TEXT, practice_kind TEXT,
    skill_ids JSON, aliases JSON, tags JSON,
    difficulty TEXT, estimated_minutes INT, estimated_hours REAL,
    frontmatter JSON NOT NULL,             -- полный YAML как JSON
    prerequisites JSON,                    -- явные prerequisites (если есть)
    content_hash TEXT NOT NULL,            -- SHA-256 для инкрементального обновления
    file_mtime TEXT, synced_at TEXT, created_at TEXT, updated_at TEXT,
    validation_status TEXT NOT NULL
);

-- Связи между материалами (wiki/markdown, prerequisites, applied_in)
CREATE TABLE content_links (
    id INTEGER PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    relation TEXT NOT NULL,                -- link | prerequisite | applied_in
    kind TEXT NOT NULL,                    -- wiki | markdown | content_path | explicit | implied
    UNIQUE (source_id, target_id, relation, kind)
);

-- Ошибки/предупреждения последней валидации
CREATE TABLE content_issues (
    id INTEGER PRIMARY KEY,
    item_id TEXT REFERENCES content_items(id),
    path TEXT NOT NULL, severity TEXT, code TEXT, message TEXT, synced_at TEXT
);

-- История запусков синхронизации
CREATE TABLE sync_runs (
    id INTEGER PRIMARY KEY,
    started_at TEXT, finished_at TEXT,
    scanned INT, created INT, updated INT, unchanged INT, removed INT,
    errors INT, warnings INT
);
```

Таблицы прогресса (`skill_assessment`), повторения (`review_queue`), AI-диалогов
(`ai_conversation`, `ai_message`) и взаимодействий (`interaction_log`) — Фазы 4–6.
Целевые схемы (реализация — в соответствующих фазах):

```sql
-- Пользовательский прогресс (один пользователь)
CREATE TABLE skill_assessment (
    skill_id      TEXT NOT NULL,          -- из learning catalog (ml.tree_ensembles)
    axis          TEXT NOT NULL,          -- theory, reproduce, apply, code, explain, interview
    score         REAL NOT NULL DEFAULT 0,-- 0..1, байесовское среднее
    evidence_count INTEGER NOT NULL DEFAULT 0,
    last_updated  TEXT NOT NULL
);

CREATE TABLE review_queue (
    id            INTEGER PRIMARY KEY,
    skill_id      TEXT NOT NULL,
    axis          TEXT NOT NULL,
    due_date      TEXT NOT NULL,          -- когда повторить
    interval      INTEGER NOT NULL,       -- дней до следующего повтора
    ease_factor   REAL NOT NULL DEFAULT 2.5,
    lapses        INTEGER NOT NULL DEFAULT 0,
    last_reviewed TEXT
);

-- История взаимодействий (для аналитики, не для RAG)
CREATE TABLE interaction_log (
    id            INTEGER PRIMARY KEY,
    timestamp     TEXT NOT NULL,
    event_type    TEXT NOT NULL,           -- lesson_view, exercise_attempt, ai_query...
    payload       JSON
);

-- AI-диалоги
CREATE TABLE ai_conversation (
    id            INTEGER PRIMARY KEY,
    created_at    TEXT NOT NULL,
    context_type  TEXT,                    -- lesson_id, case_id, free...
    context_id    TEXT
);

CREATE TABLE ai_message (
    id            INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES ai_conversation(id),
    role          TEXT NOT NULL,           -- user, assistant, system
    content       TEXT NOT NULL,
    citations     JSON,                    -- [{chunk_id, source_path, heading}]
    created_at    TEXT NOT NULL
);
```

## Проектная структура MVP

```text
ds-learning-rag/
├── .hermes.md                  # Правила работы агента
├── IDEA.md                     # Продуктовая концепция
├── content/
│   └── vault/                  # Канонический Obsidian vault
├── docs/
│   ├── architecture.md         # Этот документ
│   ├── roadmap.md
│   ├── content-system.md
│   ├── knowledge-model.md
│   ├── rag-design.md
│   └── decisions.md
├── backend/
│   ├── pyproject.toml         # uv, зависимости (python-frontmatter, markdown-it-py), ruff, pytest
│   ├── uv.lock
│   ├── alembic/               # Миграции БД
│   │   └── versions/          #   647b2d093cad baseline + a1b2c3d4e5f6 content catalog (Фаза 2)
│   ├── alembic.ini
│   ├── app/                   # код пакета backend (в проекте нет src/)
│   │   ├── main.py            # FastAPI entry point
│   │   ├── api/
│   │   │   ├── health.py      # /health
│   │   │   ├── system.py      # /system/status
│   │   │   ├── content.py     # /content/status, /courses, /courses/{id}, /lessons/{id}, /items/{id}, /atlas
│   │   │   ├── labs.py        # /labs/{id}, /labs/{id}/run (Фаза 3)
│   │   │   # progress.py, review.py — Фазы 4–5; ai.py (SSE) — Фаза 6
│   │   ├── cli/
│   │   │   └── content.py     # python -m app.cli.content {sync|validate|status} (Фаза 2)
│   │   ├── services/
│   │   │   ├── system.py      # SystemStatusService (Фаза 1)
│   │   │   ├── content_parser.py    # VaultScanner, MarkdownParser (Фаза 2)
│   │   │   ├── content_validator.py # ContentValidator, FileIndex (Фаза 2)
│   │   │   ├── content_sync.py      # ContentSyncService (Фаза 2)
│   │   │   ├── content_catalog.py   # ContentCatalogService — чтение каталога (Фаза 2)
│   │   │   ├── atlas.py             # AtlasBuilder + детерминированная раскладка (Фаза 2)
│   │   │   ├── lesson_content.py    # LessonContentService — сцены урока (Фаза 3)
│   │   │   └── labs/                # LabRegistry + 3 лаборатории (Фаза 3)
│   │   │   # progress.py, review.py — Фазы 4–5; rag.py — Фаза 6
│   │   ├── db/
│   │   │   ├── session.py     # engine + session management
│   │   │   ├── base.py        # DeclarativeBase
│   │   │   └── models.py      # ContentItem, ContentLink, ContentIssue, SyncRun (Фаза 2)
│   │   ├── core/
│   │   │   ├── config.py      # Settings (paths, model names)
│   │   │   └── logging.py     # базовое логирование
│   │   └── __init__.py
│   └── tests/
│       ├── conftest.py
│       ├── fixture_vault.py   # сборка временного vault для тестов
│       ├── test_parser.py / test_validator.py / test_sync.py / test_api.py
│       ├── test_lesson_api.py / test_labs.py          # Фаза 3
│       ├── test_health.py
│       ├── test_system_status.py
│       └── test_config.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── nginx.conf            # static build + прокси /api (Docker)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx             # layout + переключение разделов
│   │   ├── stores/             # Zustand stores
│   │   │   └── ui.ts           #   UI-состояние (активный раздел)
│   │   │   # content/progress/review-сторы — Фаза 2
│   │   ├── views/
│   │   │   ├── SystemStatusView.tsx  # техническая страница статуса (Фаза 1)
│   │   │   ├── Today.tsx             # Экран «Сегодня» (заглушка, Фаза 2)
│   │   │   ├── Atlas.tsx             # Атлас знаний (Фаза 2)
│   │   │   ├── Focus.tsx             # Уроки: /focus, /focus/:lessonId (Фаза 3)
│   │   │   ├── Studio.tsx            # Кейсы и проекты (заглушка, Фаза 2)
│   │   │   └── PlaceholderView.tsx   # общий placeholder
│   │   ├── components/
│   │   │   ├── Sidebar.tsx     # боковая панель навигации
│   │   │   ├── atlas/          # Компоненты атласа (Фаза 2)
│   │   │   ├── lesson/         # Сцены урока: MarkdownContent, SceneView, LessonOutline (Фаза 3)
│   │   │   ├── interactive/    # Лабы: LabHost, LabFrame, SVG-графики (Фаза 3)
│   │   │   ├── ai/             # AI-наставник (чат, SSE; Фаза 6)
│   │   │   └── ui/             # Общие UI-компоненты
│   │   ├── hooks/              # (Фаза 2)
│   │   ├── lib/
│   │   │   └── api.ts          # HTTP-клиент; SSE-helper — с RAG, Фаза 6
│   │   └── styles/
│   │       └── index.css       # Tailwind v4 + темы (light/dark — Фаза 2)
│   └── tests/                  # Vitest — Фаза 2
├── scripts/
│   └── seed.py                 # Первоначальная индексация vault (Фаза 2)
└── README.md
```

## Взаимодействие компонентов (последовательность)

### Запуск приложения

```text
1. Локально: backend — `uv run python -m uvicorn app.main:app --reload` (порт 8000),
   frontend — `npm run dev` (Vite, порт 5173). Либо `docker compose up` (backend: 8000,
   frontend: 8080). Makefile отсутствует в Фазе 1 (README.md — актуальная инструкция).
2. Backend стартует:
   a. Проверяет content/vault на изменения (сравнение хешей)
   b. При необходимости: перепарсивает изменившиеся файлы → SQLite
   c. При необходимости: обновляет ChromaDB (только изменившиеся чанки)
   d. Поднимает FastAPI на localhost:8000
3. Frontend стартует (Vite dev server на localhost:5173)
   a. GET /api/content/catalog → список курсов + уроков
   b. GET /api/progress/skills → состояние знаний
   c. GET /api/review/today → очередь повторения
   d. Рендерит экран «Сегодня»
```

### Интерактивный урок (Фаза 3 — реализовано)

```text
1. Пользователь выбирает урок в Atlas → кнопка «Открыть урок» → /focus/{lessonId}
2. GET /api/content/lessons/{id} → урок: metadata, сцены, prev/next, лаборатории
3. Сцены рендерятся во frontend:
   - markdown/formula/code/callout — безопасный Markdown (react-markdown + KaTeX + sanitize)
   - checkpoint — самопроверка (локально, без сохранения)
   - interactive_lab — LabHost → GET /api/labs/{lab_id} (metadata + initial result)
4. Пользователь меняет параметры → POST /api/labs/{lab_id}/run → результат и объяснение
5. Навигация: сцены (Назад/Далее) и уроки (Пред./След. по порядку курса)
```

Сцены `retrieval/application/interview/reflection` (AI-оценка и прогресс)
отложены на Фазы 4–6. Схема сцен — [`docs/lesson-system.md`](lesson-system.md).

```text
# Фаза 4+ (целевой поток, не реализовано)
1. Сцена retrieval (free-recall):
   a. Пользователь пишет объяснение
   b. POST /api/ai/assess → AI оценивает
   c. PATCH /api/progress/skills/{skill_id} → обновление оценки
2. Финальная сцена reflection:
   a. Обновление skill_assessment по всем evidence сцены
   b. Добавление в review_queue
   c. Обновление состояния узла в Atlas (заполнение, цвет кольца)
```

### AI-наставник (RAG)

```
1. Пользователь выделяет текст/формулу или задаёт вопрос в чате
2. POST /api/ai/ask:
   {
     "message": "Почему Random Forest снижает variance?",
     "context": {
       "lesson_id": "lesson.classic-ml.trees.forest",
       "mode": "explain",
       "skill_ids": ["ml.tree_ensembles"],
       "selected_text": null
     }
   }
3. Backend:
   a. Формирует контекст: текущий урок + слабые навыки
   b. Retrieval: гибридный поиск по ChromaDB
   c. Reranking (опционально)
   d. Сборка промпта: система + контекст + запрос
   e. Ollama generate (stream=True)
   f. SSE-стрим токенов → Frontend
4. Frontend:
   a. Показывает потоковый ответ в чате
   b. После завершения: цитаты в виде ссылок на заметки
   c. Сохраняет диалог в ai_conversation
```

## Ограничения памяти

При работе на MacBook Air M4 (16 ГБ):

| Компонент | Оценка RAM |
|---|---|
| ОС + браузер + IDE | ~4 ГБ |
| Frontend dev server | ~0.3 ГБ |
| Backend (FastAPI) | ~0.2 ГБ |
| SQLite (WAL, кэш) | ~0.1 ГБ |
| ChromaDB | ~0.3 ГБ |
| Ollama (LLM 3B, q4) | ~2.5 ГБ |
| Ollama (embedding) | ~1.5 ГБ |
| **Итого** | **~8.9 ГБ** |

С запасом помещается. Но LLM + embedding одновременно занимают ~4 ГБ. Если памяти не хватает, можно:
- Использовать одну модель для embeddings и генерации (неоптимально, но экономит ~1.5 ГБ)
- Выгружать embedding-модель после индексации (индексация офлайн, генерация онлайн)
