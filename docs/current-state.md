# DataPath — текущее состояние (передача контекста)

> **Stable baseline:** `phase-6a1-complete`
> Актуальный commit можно получить командой `git rev-parse HEAD`.

## Фаза и результат

- Фазы 1–6A.1 выполнены. Фаза 6A стабилизировала парсинг сцен, метаданные,
  content quality audit и подготовила черновики контента. Phase 6A.1
  интегрировала одобренные content drafts в канонический `content/vault` и
  исправила source_heading маппинги.
- Пайплайн: `content/vault → Python parser → валидация → SQLite → REST API → Atlas/Focus/Studio/Review`.

## Phase 6A.1: интеграция контента MVP

- Канонический MVP-контент улучшен и синхронизирован в `content/vault`.
- Все 13 уроков Classic ML теперь разрешают `source_heading` через `exact` или
  `normalized` совпадения (fallback больше не требуется).
- source_heading fallback warnings:
  - before: **26**;
  - after: **0**.
- Интегрированы **7 content drafts**:
  - Decision Tree — численный пример Gain;
  - Bias/Variance и переобучение деревьев;
  - Random Forest — интуиция variance reduction;
  - Gradient Boosting — пример трёх шагов;
  - CatBoost — ordered target-statistics без leakage;
  - ensemble model comparison;
  - interview answers.
- Обновлены канонические темы: Decision Tree; Bias/Variance и переобучение
  деревьев; Random Forest; Gradient Boosting; CatBoost; сравнение ансамблей;
  ответы для собеседования.
- Новый канонический content ID: `concept.ml.ensemble-comparison`.
- Отдельный урок Model Comparison **не добавлялся**; существующий MVP-маршрут и
  кейс выбора модели (`case.classic-ml.tree-ensemble-choice`) не изменялись.

## Content quality (Classic ML)

- Errors: **0**.
- Warnings: **0**.
- Suggestions: **62** (неблокирующие; в основном про lesson-level пробелы
  покрытия — пример/визуализация/код/pitfalls/сравнение в выводе уроков).
- Catalog sync: **190 content items**, без дубликатов ID, errors 0, warnings 0.

## Готовность к RAG

- Канонический MVP-контент **готов к RAG-индексации** (Phase 6B).
- Известный некритичный долг (не блокирует 6A.1/6B):
  - больше визуализаций;
  - sklearn-примеры кода;
  - больше checkpoints;
  - смешение русского и английского в части старого материала source-заметок;
  - сжатая компоновка маршрута в Atlas;
  - plain-text code-блоки показывают языковую метку `text`.

## Ещё не реализовано

- **Embeddings, retrieval и AI-наставник** (локальный RAG, ChromaDB, Ollama) — Фаза 6B.
- Авторизация и облачная синхронизация (не планируются в ближайших фазах).

## Следующая работа

1. **Phase 6B** — локальный RAG и AI-наставник после синхронизации и валидации
   канонического MVP-контента.

## Дорожная карта

- Финальный объём продукта: full Machine Learning; Deep Learning; Python Core;
  Big O и algorithms; NumPy; pandas; scikit-learn.
- Phase 8A–8D для Python и algorithms (подготовлено в `docs/roadmap.md`).

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
