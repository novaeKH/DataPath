# DataPath — текущее состояние (передача контекста)

> **Stable baseline:** `phase-6a1-complete`
> Актуальный commit можно получить командой `git rev-parse HEAD`.

## Фаза и результат

- Фазы 1–6A.1 выполнены. Фаза 6A стабилизировала парсинг сцен, метаданные,
  content quality audit и подготовила черновики контента. Phase 6A.1
  интегрировала одобренные content drafts в канонический `content/vault` и
  исправила source_heading маппинги.
- Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → Atlas/Focus/Studio/Review`.

## Выполненные фазы (история)

- Phase 1 — project scaffold;
- Phase 2 — content catalog and Atlas;
- Phase 3 — interactive lessons and labs;
- Phase 4 — Knowledge Model, progress and cases;
- Phase 5 — spaced repetition;
- Phase 6A — content parsing and quality foundation;
- Phase 6A.1 — canonical MVP content integration.

## Phase 6A.1: интеграция контента MVP

- Канонический MVP-контент улучшен, синхронизирован и **готов к RAG-индексации**.
- Все 13 уроков Classic ML разрешают `source_heading` через `exact`/`normalized`.
- source_heading fallback warnings: before **26** → after **0**.
- Интегрированы **7 content drafts**: Decision Tree (пример Gain); Bias/Variance
  и переобучение деревьев; Random Forest (variance reduction); Gradient Boosting
  (пример трёх шагов); CatBoost (ordered target-statistics без leakage); ensemble
  model comparison; interview answers.
- Новый канонический content ID: `concept.ml.ensemble-comparison`.
- Отдельный урок Model Comparison **не добавлялся**; существующий MVP-маршрут и
  кейс `case.classic-ml.tree-ensemble-choice` не изменялись.

## Content quality (Classic ML)

- Errors: **0**; Warnings: **0**; Suggestions: **62** (неблокирующие).
- Catalog sync: **190 content items**, без дубликатов ID, errors 0, warnings 0.

## Следующая фаза: Phase 7 — Non-AI MVP Completion and Visual Polish

Довести приложение до сильного самостоятельного обучающего продукта **без
зависимости от AI-агента**. Scope: унифицированная визуальная система;
типографика и композиция уроков; Today; Focus; Review; Studio; Atlas; навигация;
onboarding; empty/loading/error states; responsive layout; light/dark темы;
accessibility; keyboard behavior; frontend performance; route-level code
splitting; уменьшение bundle; улучшение раскладки Atlas; удаление мелких
визуальных несоответствий; issue языковой метки `text` на plain-text code-блоках;
финальный non-AI UX flow; production build и Docker readiness.

Phase 7 **не реализует**: embeddings; vector databases; retrieval; LLM calls;
AI mentor; RAG chat.

## После Phase 7: Phase 6B — Local RAG and AI Mentor

Phase 6B намеренно выполняется **после Phase 7** и сохраняет свой номер и смысл.

Начальный RAG scope: индексация только валидированного контента с
`rag: include`; старт с верифицированного MVP-корпуса; семантический
детерминированный чанкинг; стабильные chunk IDs; инкрементальная индексация;
локальные embeddings; локальное векторное хранилище; retrieval-фильтры по
content/skill/lesson; grounded answers; source citations; история диалогов;
интеграция с Focus; статус локальной модели и graceful degradation.

Новые курсы/заметки добавляются через инкрементальный реиндексинг, а не
пересборку RAG-архитектуры.

## Phase 8 — Python and Algorithms

- 8A — audit и миграция `Python_Interview_Preparation.zip`;
- 8B — Python Core and Big O;
- 8C — algorithmic patterns и интерактивные визуализаторы;
- 8D — code editor, safe runner, tests и interview mode.

## Phase 9 — Curriculum Expansion

Финальный объём — отдельные связанные обучающие треки: полный Machine Learning;
полный Deep Learning; NumPy; pandas; scikit-learn; Python Core; Big O; algorithms;
позднее прикладные треки (NLP, recommender systems, LLMs, MLOps).

Структура: 9A — complete Classic ML; 9B — NumPy; 9C — pandas; 9D — scikit-learn;
9E — Deep Learning; 9F — applied ML/NLP/recsys/LLM/MLOps.

## Продуктовая стратегия

1. DataPath должен хорошо работать без AI.
2. AI — усиление, а не зависимость (для lessons, progress, review, labs, cases,
   Today, Atlas).
3. Не ждать полный финальный курс перед реализацией RAG.
4. RAG начинается с верифицированного MVP-корпуса и расширяется инкрементальным
   реиндексированием.
5. Канонический источник контента — `content/vault`.
6. Product/business логика — в Python backend.
7. React/TypeScript — только UI, рендер, интеракции, визуализация, навигация,
   API-коммуникация.
8. Не дублировать learning/progress/recommendation/review/content логику в frontend.

## Политика эффективности (token/verification)

- Одна новая сессия на крупную фазу.
- `docs/current-state.md` — основной handoff.
- Не перечитывать IDEA.md, весь репозиторий, всю документацию или полный vault,
  если это явно не требуется.
- Читать только изменённые и прямо релевантные файлы.
- Оставаться в той же сессии внутри фазы, пока не достигнут лимит итераций.
- При достижении лимита — компактный handoff.
- Focused-тесты в процессе разработки; один полный набор верификации в конце фазы.
- Не повторять зелёный полный прогон без последующих изменений кода.
- Docker — только когда требуется интеграция/деплой.
- Browser-проверки — только для затронутых UI-флоу.
- Скриншоты — максимум четыре релевантных уникальных изображения.
- Не реагировать на стейл-уведомления от остановленных процессов.
- Не проводить аудиты только для подтверждения уже проверенных фактов.
- Останавливаться перед commit/tag для ручного принятия.
- `docs/current-state.md` обновлять только после принятия.

## Ещё не реализовано

- **Embeddings, retrieval и AI-наставник** (локальный RAG, ChromaDB, Ollama) — Phase 6B (после Phase 7).
- Авторизация и облачная синхронизация (не планируются в ближайших фазах).

## Команды

```bash
cd backend && PYTHONPATH= uv run python -m alembic upgrade head
PYTHONPATH= uv run python -m app.cli.content sync
PYTHONPATH= uv run python -m app.cli.content quality
PYTHONPATH= uv run python -m uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
# Makefile: dev-backend | dev-frontend | sync-content | test | lint | build | check
# Docker: docker compose build && docker compose up -d
```
