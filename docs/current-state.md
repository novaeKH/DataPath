# DataPath — текущее состояние (передача контекста)

> **Stable baseline:** `phase-6a-complete`
> Актуальный commit можно получить командой `git rev-parse HEAD`.

## Фаза и результат

- Фазы 1–6A выполнены. Фаза 6A: стабилизация парсинга сцен, смысловая
  группировка, метаданные сцен, content quality audit, управляемое расширение
  Obsidian-хранилища (черновики вне vault).
- Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → Atlas/Focus/Studio/Review`.

## Фаза 6A: модель сцен и парсинг

- Семантическая группировка сцен: короткие случайные сцены (1–10 слов)
  детерминированно сливаются; заголовки, списки, формулы, код и пояснения
  группируются корректно.
- Пояснения формул поглощаются без дублирования (текст не появляется дважды).
- Стабильные scene IDs и совместимость прогресса сохранены.
- Новые метаданные сцены: `word_count`, `source_content_id`, `source_heading`,
  `semantic_role`, `contains_formula`, `contains_code`, `contains_visual`,
  `display_title`, `heading_resolution`.
- `display_title` — детерминированный пользовательский заголовок сцены
  (H3/H4 → уникальный source_heading → метка формулы/caption → semantic_role →
  первое предложение → fallback); устраняет дубли заголовков в outline.

## source_heading: статусы разрешения

- `exact` — точное совпадение с H2 source-заметки;
- `normalized` — совпадение после нормализации (trim, регистр, markdown-эмфазис, числовые префиксы);
- `fallback` — заголовок не найден, используются все секции по порядку;
- `missing` — source-заметка недоступна/пуста.
- Fallback и missing видны как warnings в content quality CLI.

## Рендер Markdown/KaTeX (frontend)

- Inline- и block-математика рендерятся через KaTeX (remark-math + rehype-katex).
- Санитизация KaTeX сохраняет необходимые генерируемые positioning-стили
  (inline `style`/`ariaHidden` на `span`/`code`); `rehypeRaw` не включён —
  произвольный HTML и JavaScript остаются отключёнными.
- Gain formula: подстрочные `n_L` и `n_R` рендерятся корректно.
- Маркеры Markdown-списков восстановлены (Tailwind v4 preflight сбрасывает
  `list-style`); добавлены классы `list-disc`/`list-decimal`.
- Добавлена поддержка типов сцен `table` и `visual`.

## Content quality CLI

- Read-only CLI: `PYTHONPATH= uv run python -m app.cli.content quality`
  (поддерживает фильтр по course/lesson и JSON output).
- Проверки: errors (битый content_path, path traversal, пустой урок, parser crash),
  warnings (fallback/missing source_heading, пустые/слишком короткие/слишком
  большие сцены, урок без skills/checkpoint), suggestions (нет примера,
  визуализации, кода, pitfalls, comparison и т.д.).
- Ненулевой exit code только для errors; warnings и suggestions не ломают сборку.

## Показатели и статус Фазы 6A

- Backend tests: **208 passed**.
- Frontend tests: **97 passed** (7 файлов).
- Изолированный Docker smoke: **PASS**.
- Content quality для Classic ML: errors **0**, warnings **26**, suggestions **48**.
- Warnings — ожидаемые fallback `source_heading` («Коротко»/«Интуиция»), правка
  которых отложена до ручной коррекции vault.
- `content/vault` не изменялся приложением.

## Черновики контента

- 7 черновиков в `docs/content-drafts/` (вне vault): примеры, визуализации,
  интуиция bias/variance, шаги boosting, категории CatBoost без leakage,
  сравнение ансамблей, интервью-ответы.
- Перенос в `content/vault` — отдельный подтверждённый шаг (Phase 6A.1).

## Дорожная карта

- Phase 8 (подготовлена в `docs/roadmap.md`): Python content migration;
  Python Core and Big O; algorithmic patterns and visualizers; safe code runner
  и interview mode.
- Финальный объём продукта: full Machine Learning; Deep Learning; NumPy;
  pandas; scikit-learn; Python; algorithms.

## Ещё не реализовано

- **Embeddings, retrieval и AI-наставник** (локальный RAG, ChromaDB, Ollama) — Фаза 6B.
- Авторизация и облачная синхронизация (не планируются в ближайших фазах).

## Следующая работа

1. **Phase 6A.1** — вручную интегрировать одобренные MVP content drafts и
   исправить `source_heading` в `content/vault`.
2. **Phase 6B** — локальный RAG и AI-наставник после синхронизации и валидации
   канонического MVP-контента.

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
