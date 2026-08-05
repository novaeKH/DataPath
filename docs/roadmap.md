# DataPath — дорожная карта MVP

## Порядок выполнения (актуальный)

### Completed
- Phase 1 — project scaffold;
- Phase 2 — content catalog and Atlas;
- Phase 3 — interactive lessons and labs;
- Phase 4 — Knowledge Model, progress and cases;
- Phase 5 — spaced repetition;
- Phase 6A — content parsing and quality foundation;
- Phase 6A.1 — canonical MVP content integration.

### Next execution step
**Phase 7 — Product Redesign + Lesson V2 + Interactive Learning** — implementation
complete (2026-08-05), **pending manual visual acceptance**.
Scope delivered: visual system (semantic tokens, surface hierarchy, typography,
interaction states), course route redesign (vertical continuity, progress markers),
Lesson V2 (semantic scenes, reading rhythm, workspace layout), real checkpoints
(single-choice with keyboard, feedback, explanation), 3 interactive visual
demonstrations (train/val/test split, bias/variance, decision tree), code/data
scene support, laboratory animation stability fixes, Today/Focus/Review/Studio/
Atlas route alignment, mobile responsive coherence.

Документация: `docs/ui-system.md`, `docs/lesson-system.md`.

После принятия следующая фаза — Phase 6B.

### After Phase 7
**Phase 6B — Local RAG and AI Mentor.** Сохраняет свой номер и смысл, хотя
выполняется после Phase 7. Не требует полного финального курса; начинается с
верифицированного MVP-корпуса и расширяется инкрементальным реиндексированием.

### Then
**Phase 8 — Python and Algorithms** (8A–8D), затем **Phase 9 — Curriculum
Expansion** (9A–9F).

---
## Фаза 0: Подготовка (текущая)

**Цель:** спроектировать архитектуру, договориться о стеке и составе MVP.

**Выполнено:**
- [x] Изучение `IDEA.md` — полная продуктовая концепция
- [x] Изучение `content/vault` — структура, типы заметок, catalog
- [x] Проектирование архитектуры (`docs/architecture.md`)
- [x] Проектирование контентной системы (`docs/content-system.md`)
- [x] Проектирование модели знаний (`docs/knowledge-model.md`)
- [x] Проектирование RAG (`docs/rag-design.md`)
- [x] Фиксация решений (`docs/decisions.md`)
- [x] Создание `.hermes.md` с правилами работы

**Ожидает подтверждения:**
- Согласование технологического стека
- Согласование состава MVP
- Решение открытых вопросов из `decisions.md`

---

## Фаза 1: Инфраструктура и каркас (~3–5 дней)

**Цель:** запустить оба сервера, настроить инструменты, подготовить данные.

**Итог:** каркас создан и проверен — FastAPI backend, React frontend,
SQLite + Alembic, Docker Compose (backend + frontend), тесты и линтеры.
Скоуп выполнялся по уточнённому заданию Фазы 1: части исходного списка
(парсер, React Router, темы, Makefile) намеренно отложены и помечены как
нереализованные.

### Выполнено в Фазе 1

Backend:
- Инициализация проекта: `uv init`, `pyproject.toml`, uv-окружение (Python 3.12)
- Зависимости: FastAPI, SQLAlchemy, Alembic, pydantic-settings, pytest, ruff
  (ChromaDB, python-frontmatter, markdown-it-py — позже, не входят в скоуп Фазы 1)
- Конфигурация через pydantic-settings (`app/core/config.py`), переменные с префиксом `DATAPATH_`
- FastAPI entry point (`app/main.py`), CORS, базовое логирование
- SQLAlchemy Base + Alembic init + первая (пустая) миграция; предметные модели — Фаза 2
- API-роутеры: `GET /api/health`, `GET /api/system/status`

Frontend:
- Scaffold `npm create vite@latest` с React + TypeScript (React 18, Vite)
- Tailwind CSS v4 настроен; переключение тем light/dark — Фаза 2
- Навигация по разделам через Zustand-стор; React Router — Фаза 2
- Zustand store (UI-состояние), API-клиент (fetch; SSE-helper понадобится с RAG, Фаза 6)
- Базовый layout: боковая панель + контент

Инфраструктура:
- README.md с инструкцией по запуску
- `.gitignore`: исключить venv, node_modules, data/, chroma/, локальное состояние Obsidian
- Dockerfile для backend и frontend, `compose.yaml` (backend + frontend)

### Отложено из исходного плана Фазы 1 (реализовывать в Фазе 2)

- Content parser CLI: обход `content/vault`, парсинг frontmatter, заполнение `content_catalog`
- Проверка целостности: валидация id, путей, типов
- React Router: базовые маршруты (Today, Atlas, Focus, Studio)
- Tailwind темы light/dark
- Makefile: `make dev`, `make reindex`, `make lint`, `make check`

**Актуальный результат Фазы 1:** локальный и Docker-запуск работают (см. README.md);
backend отдаёт `/api/health` и `/api/system/status`; frontend показывает техническую
страницу статуса с навигацией по будущим разделам. Парсер контента, каталог, темы
и Makefile отсутствуют; `make dev` не используется.

---

## Фаза 2: Контент и навигация (~3–4 дня)

**Цель:** отобразить курс, уроки и атлас.

**Статус:** выполнена основная часть — контентный каталог (parser → валидация →
SQLite), REST API, базовый Atlas, роутинг, темы light/dark. Заглушки Today/Focus/Studio
сохранены; уроки со сценами — Фаза 3.

### 2.1 Content API

- [x] `GET /api/content/status` — счётчики каталога (vault, published, по типам, ошибки/предупреждения)
- [x] `GET /api/content/courses` — список курсов с metadata
- [x] `GET /api/content/items/{content_id}` — metadata материала + связи + issues
- [x] `GET /api/atlas` (и `/api/content/atlas`) — узлы, рёбра, области, маршруты, prerequisites, детерминированная раскладка
- [x] `GET /api/content/courses/{id}` — курс с модулями и уроками (Фаза 3)
- [x] `GET /api/content/lessons/{id}` — урок со сценами и лабораториями (Фаза 3)

### 2.2 Экран Today

- [x] Карточка «Главная задача» (продолжить урок / следующий урок маршрута) — Фаза 4
- [ ] Карточка «Повторение сегодня» — Фаза 5
- [x] Карточка «Нужно усилить» (слабые темы, только при достаточном evidence) — Фаза 4

### 2.3 Atlas (MVP-версия)

- [x] SVG рендеринг узлов и связей (данные с backend, без D3-force)
- [x] Узлы: название темы, тип, статус backend (реальные состояния с Фазы 4), маршрут курса выделен
- [x] Связи: направленные стрелки prerequisites, link/applied_in
- [x] Zoom/pan (детерминированная раскладка, позиции стабильны между перезагрузками)
- [x] Клик по узлу → панель с информацией + детали с `/api/content/items/{id}`
- [x] Состояния loading/empty/error
- [x] Переход Atlas → Focus: кнопка «Открыть урок» для lesson-узлов,
  связанные уроки для concept (Фаза 3); анимация «узел увеличивается» — полировка
- [x] Режимы: «Весь атлас», «Мой маршрут» (Фаза 2), «Слабые темы» (Фаза 4)

### 2.4 Визуальный стиль

- [x] Светлая и тёмная темы (Tailwind v4 `dark:` variant + CSS variables)
- [x] Аккуратный layout, читаемый SVG Atlas, легенда
- [x] Умеренный переход между маршрутами (Framer Motion)
- [ ] Полная типографика и микровзаимодействия — Фаза 7

**Результат фазы 2 (реальный vault, 2026-08-05):**
- validate: 0 ошибок, 0 предупреждений; sync: 189 материалов, идемпотентно
- Курс «Классический ML» виден в приложении; Atlas: 100 узлов, 304 связи, 8 областей
- Можно кликнуть узел → панель с metadata; Today/Focus/Studio — заглушки

---

## Фаза 3: Интерактивные уроки (~4–5 дней) — ✅ выполнено

**Цель:** реализовать интерактивные уроки и лаборатории.

### 3.1 Урок (Focus) — ✅

- [x] Lesson API: `GET /api/content/lessons/{id}`, `GET /api/content/courses/{id}`
- [x] Сцены урока: `markdown, formula, code, callout, checkpoint, interactive_lab`
      (парсер `LessonContentService`; детали — `docs/lesson-system.md`)
- [x] Focus: `/focus` (выбор урока) и `/focus/:lessonId` (урок со сценами)
- [x] Рендер Markdown с формулами (KaTeX) и кодом; безопасный HTML (rehype-sanitize)
- [x] Навигация по сценам (Назад/Далее) и по урокам (Пред./След.)
- [x] Atlas → Focus: кнопка «Открыть урок», связанные уроки для concept

Отложено (Фазы 4–6): сцены `retrieval/application/interview/reflection`,
прогресс-бар урока с сохранением, анимации переходов.

### 3.2 Интерактивные лабы (реализовано 3) — ✅

- [x] `decision-tree-split-lab` — разбиение пространства, Gini/Entropy, gain
- [x] `tree-depth-overfitting-lab` — глубина/переобучение, train/val, boundary
- [x] `ensemble-comparison-lab` — DT vs RF vs GB (+CatBoost), время, boundary
- [x] API: `GET /api/labs/{id}`, `POST /api/labs/{id}/run`, Pydantic-валидация

### 3.3 Контент: 5 уроков MVP-маршрута — ✅

- [x] Урок 07: Decision Tree (с лабом split-lab)
- [x] Урок 06 (повтор): Bias, variance и regularization (с лабом overfitting)
- [x] Урок 08: Random Forest (с лабом ensemble-comparison)
- [x] Урок 09: Gradient Boosting (с лабом ensemble-comparison)
- [x] Урок 10: CatBoost (теория; в сравнении участвует при наличии CPU-пакета)

**Результат фазы 3:**
- Можно пройти 5 уроков MVP-маршрута со сценами и 3 интерактивными лабораториями
- Лабы реагируют на изменение параметров (детерминированные расчёты backend)
- Оценка free-recall и сохранение прогресса — Фаза 4+ (не реализовано)

---

## Фаза 4: Модель знаний и прогресс — ✅ выполнено

**Цель:** сохранение результатов пользователя и обновление карты.

### 4.1 Модель знаний — ✅

- [x] Таблицы `learning_events`, `skill_assessments`, `lesson_progress`,
      `lab_attempts`, `case_attempts` (миграция `f4a1b2c3d4e5`)
- [x] Байесовское обновление alpha/beta по 7 осям (KnowledgeModelService)
- [x] Фиксация ошибок (error_code в learning_events, типичные ошибки в API)
- [x] API: `GET /api/progress/summary`, `GET /api/progress/skills`,
      `GET /api/progress/skills/{id}`
- [x] Состояния навыков и слабые темы только при достаточном evidence

### 4.2 Отображение прогресса — ✅

- [x] Обновление состояния узлов в Atlas после урока (backend агрегирует
      assessments + lesson progress)
- [x] Карточка темы: уровни по осям, типичные ошибки
- [x] «Нужно усилить» на Today: реальные слабые темы
- [x] Режим Atlas «Слабые темы» (честный empty-state)

### 4.3 Кейсы (1 мини + 1 итоговый) — ✅

- [x] Мини-кейс «Выбор ансамбля для оттока» (после уроков деревьев/ансамблей)
- [x] Итоговый кейс «Churn end-to-end» (весь модуль)
- [x] Режимы: Guided, Standard, Interview
- [x] Структурированные ответы: single/multiple/numeric/select/order
- [x] Оценка по правилам (не AI), evidence по навыкам кейса

**Результат фазы 4:**
- Прогресс сохраняется между сессиями (SQLite, один локальный пользователь)
- Atlas обновляется после каждого урока/лаборатории/кейса
- Можно пройти мини-кейс и итоговый кейс
- Профиль знаний отражает реальные оценки
- Подробности: `docs/progress-system.md`, `docs/case-system.md`

---

## Фаза 5: Повторение (~2–3 дня) — ✅ выполнено

**Цель:** очередь повторения и простой алгоритм.

### 5.1 Алгоритм

- [x] Простой SM-2-like алгоритм: interval, ease_factor, lapses
- [x] Приоритет: overdue + needs_attention → overdue → due today →
      более низкая confidence → более ранний due_at
- [x] Обновление после каждого evidence (review_answer → KnowledgeModelService)

### 5.2 Очередь

- [x] `GET /api/reviews/summary` — сводка (due/overdue/completed_today/next_due)
- [x] `GET /api/reviews/queue` — очередь с приоритетом и дневным лимитом 1–30
- [x] `POST /api/reviews/{id}/submit` — проверка ответа + оценка
      (Again/Hard/Good/Easy) + интервал
- [x] Карточки разных форматов: single_choice, multiple_choice, ordering,
      numeric, parameter_selection, error_diagnosis, reveal_and_rate

### 5.3 Интеграция с Today

- [x] Карточка «Повторение сегодня» с реальной очередью
- [x] Сессия повторения (экран `/review`) с фиксированным числом элементов
      (дневной лимит) вместо таймера 5/15/30 минут
- [x] Ссылка «Повторить тему» в Focus, due-индикатор в Atlas

**Результат фазы 5:**
- Today показывает реальную очередь повторения
- Можно пройти review-сессию и получить разбор с новым интервалом
- Алгоритм адаптирует интервалы (SM-2-like, ease 1.3–2.8, cap 365 дней)
- Реализация отличается от исходного плана: сессии по числу элементов
  (а не по времени), API — `/api/reviews/*` (а не `/api/review/*`);
  детали — `docs/review-system.md`

---

## Фаза 6B: Local RAG and AI Mentor (выполняется после Phase 7)

**Предварительные фазы (выполнены):**
- ✅ **Phase 6A:** стабилизация парсинга сцен, content quality audit, черновики контента
- ✅ **Phase 6A.1 (2026-08-05):** исправлены 26 source_heading fallback-предупреждений (→0), интегрированы 7 content drafts, interview answers, concept-заметка Ensemble Comparison. MVP-контент готов к RAG-индексации.

**Порядок:** Phase 6B намеренно выполняется **после Phase 7** и сохраняет свой
номер и смысл. RAG начинается с верифицированного MVP-корпуса и расширяется
инкрементальным реиндексированием; ждать полный финальный курс не требуется.

**Цель:** работающий RAG-наставник с цитатами.

### 6B.1 RAG-индексация

- [ ] Индексировать только валидированный контент с `rag: include`
- [ ] Старт с верифицированного MVP-корпуса
- [ ] Семантический детерминированный чанкинг (H2/H3)
- [ ] Стабильные chunk IDs
- [ ] Инкрементальная индексация (по хешу), а не пересборка архитектуры
- [ ] Локальные embeddings (Ollama, nomic-embed-text)
- [ ] Локальное векторное хранилище (ChromaDB)
- [ ] CLI: `make reindex`

### 6B.2 Retrieval

- [ ] Semantic search (ChromaDB)
- [ ] Lexical search (SQLite FTS5)
- [ ] Hybrid fusion (RRF)
- [ ] Фильтрация по content, skill и lesson
- [ ] Ограничение: max 2 чанка от файла, приоритет коллекций

### 6B.3 AI-наставник

- [ ] Контекстное окно: выделение текста → «Объяснить проще»
- [ ] Чат: поле ввода → запрос RAG → генерация → стриминг
- [ ] Режимы: explain, socratic, debug
- [ ] Grounded answers с source citations (`[N]` + кликабельные ссылки)
- [ ] История диалогов
- [ ] Статус локальной модели и graceful degradation
- [ ] Интеграция с Focus (контекст урока/кейса влияет на retrieval)

**Результат Phase 6B:**
- AI-наставник отвечает на вопросы, опираясь на vault, с цитатами
- Стриминг работает; контекст урока/кейса влияет на retrieval
- При недоступной локальной модели приложение деградирует без отказа

---

## Phase 7: Non-AI MVP Completion and Visual Polish

**Статус: implementation complete — pending manual visual acceptance.**

Довести приложение до сильного самостоятельного обучающего продукта **без
зависимости от AI-агента**. AI остаётся enhancement, а не dependency.

### 7.1 Visual system и UI

- [ ] Унифицированная визуальная система
- [ ] Типографика и композиция уроков
- [ ] Onboarding
- [ ] Onboarding / empty / loading / error states
- [ ] Responsive layout
- [ ] Light и dark темы
- [ ] Accessibility
- [ ] Keyboard behavior
- [ ] Удаление мелких визуальных несоответствий
- [ ] Исправление языковой метки `text` на plain-text code-блоках

### 7.2 Экраны

- [ ] Today
- [ ] Focus
- [ ] Review
- [ ] Studio
- [ ] Atlas (включая улучшение раскладки Atlas)
- [ ] Навигация

### 7.3 Frontend performance

- [ ] Frontend performance
- [ ] Route-level code splitting
- [ ] Уменьшение bundle-size

### 7.4 Завершение продукта

- [ ] Финальный non-AI UX flow
- [ ] Production build и Docker readiness

**Phase 7 не реализует:** embeddings, vector databases, retrieval, LLM calls,
AI mentor, RAG chat.

**Результат Phase 7:**
- Приложение — завершённый standalone продукт без AI-зависимости
- Полный non-AI цикл обучения работает и выглядит целостно
- Production build и Docker готовы

---

## Phase 8: Python-трек (выполняется после Phase 6B; подготовлен)

### 8A — Python content audit and migration

- audit `Python_Interview_Preparation.zip`;
- remove duplication;
- create canonical notes;
- normalize metadata;
- connect skills, tasks, hints and solutions.

### 8B — Python Core and Big O

- Python objects and mutability;
- containers and hashing;
- functions, iterators, generators;
- decorators, OOP, exceptions;
- memory, GC and GIL;
- typing and testing;
- time and space complexity;
- complexity of Python operations;
- interactive Big O exercises.

### 8C — Algorithmic patterns and visualizers

- arrays and strings;
- hash map;
- two pointers;
- sliding window;
- prefix sum;
- binary search;
- stack, queue and deque;
- heap and Top K;
- linked lists;
- recursion and backtracking;
- trees, graphs, BFS and DFS;
- greedy and dynamic programming;
- interactive step-by-step state visualizers.

### 8D — Code runner and interview mode

- Python editor;
- starter code;
- tests;
- progressive hints;
- solution verification;
- complexity analysis;
- attempt history;
- safe isolated runner;
- interview mode.

---

## Phase 9: Curriculum Expansion (после Phase 8)

Финальный объём продукта — отдельные связанные обучающие треки:

- полный Machine Learning;
- полный Deep Learning;
- NumPy;
- pandas;
- scikit-learn;
- Python Core;
- Big O;
- algorithms;
- позднее прикладные треки (NLP, recommender systems, LLMs, MLOps).

Структура:

- **9A** — complete Classic ML curriculum;
- **9B** — NumPy;
- **9C** — pandas;
- **9D** — scikit-learn;
- **9E** — Deep Learning;
- **9F** — applied ML, NLP, recommender systems, LLM и MLOps tracks.

Расширение контента (новые курсы/заметки) добавляется через инкрементальный
реиндексинг RAG, а не пересборку RAG-архитектуры.

---

## Продуктовая стратегия

1. DataPath должен хорошо работать без AI.
2. AI — enhancement, а не dependency (для lessons, progress, review, labs,
   cases, Today, Atlas).
3. Не ждать полный финальный курс перед реализацией RAG.
4. RAG начинается с верифицированного MVP-корпуса и расширяется инкрементальным
   реиндексированием.
5. Канонический источник контента — `content/vault`.
6. Product/business логика — в Python backend.
7. React/TypeScript — только UI, рендер, интеракции, визуализация, навигация,
   API-коммуникация.
8. Не дублировать learning/progress/recommendation/review/content логику в frontend.

---

## Общий timeline MVP (актуальный порядок)

| Фаза | Содержание | Статус / порядок |
|---|---|---|
| 0 | Подготовка (документация) | ✓ сделано |
| 1 | Инфраструктура и каркас | ✓ сделано |
| 2 | Контент и навигация | ✓ сделано |
| 3 | Интерактивные уроки | ✓ сделано |
| 4 | Модель знаний и прогресс | ✓ сделано |
| 5 | Повторение | ✓ сделано |
| 6A | Парсинг сцен и аудит контента | ✓ сделано |
| 6A.1 | Канонический MVP-контент | ✓ сделано |
| 7 | Non-AI MVP Completion и Visual Polish | ✅ реализован, ждёт ручного принятия |
| 6B | Local RAG and AI Mentor | после Phase 7 |
| 8 | Python-трек (8A–8D) | после Phase 6B |
| 9 | Curriculum Expansion (9A–9F) | после Phase 8 |

## За пределами MVP (v1.1+)

После успешного MVP:

- [ ] Поддержка нескольких курсов (Deep Learning, NLP)
- [ ] Режим Interview в кейсах (AI играет роль интервьюера)
- [ ] Режим Real-world (неполные требования, скрытые проблемы)
- [ ] Reranker в RAG pipeline
- [ ] Замена LLM на более крупную (7B) при достаточной памяти
- [ ] Полноценные проекты (Studio → Project mode)
- [ ] Карьерный трек: сравнение профиля с целевой ролью
- [ ] Экспорт прогресса
- [ ] Мобильная версия (React Native / PWA)
- [ ] SQL-курс и банк вопросов
- [ ] Canvas-визуализации Obsidian в Atlas

---

## Состав MVP (финально)

| Компонент | Что входит |
|---|---|
| **Today** | Главная задача, повторение, слабые темы |
| **Atlas** | Интерактивная карта с MVP-маршрутом, zoom/pan, состояния |
| **Focus** | Уроки со сценами (hook, content, interactive, retrieval, reflection) |
| **Studio** | Мини-кейс (1), итоговый кейс (1) |
| **Интерактивные лабы** | 3 из 5: split-lab, forest-lab, boosting-lab |
| **Модель знаний** | 7 осей, байесовские оценки, коды ошибок |
| **Повторение** | SM-2-like очередь, сессии 5/15/30 мин |
| **AI-наставник** | RAG с цитатами, 3 режима, стриминг, контекст урока |
| **Курс** | «Классический ML» — 5 полноценных уроков |
| **Маршрут MVP** | Decision Tree → Bias/Variance → Random Forest → Gradient Boosting → CatBoost |
