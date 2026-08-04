# DataPath — команды разработки (Фаза 2)
# Все команды реально работают и проверены. PYTHONPATH= защищает проектный
# venv от глобального PYTHONPATH окружения (см. README.md).

.PHONY: dev-backend dev-frontend sync-content validate-content test lint build check

BACKEND = cd backend && PYTHONPATH=
FRONTEND = cd frontend

## Backend: FastAPI dev server на :8000
dev-backend:
	$(BACKEND) uv run python -m uvicorn app.main:app --reload

## Frontend: Vite dev server на :5173 (проксирует /api в backend)
dev-frontend:
	$(FRONTEND) && npm run dev

## Синхронизация content/vault → SQLite каталог
sync-content:
	$(BACKEND) uv run python -m app.cli.content sync

## Валидация vault (без изменения БД)
validate-content:
	$(BACKEND) uv run python -m app.cli.content validate

## Все тесты (backend pytest + frontend vitest)
test:
	$(BACKEND) uv run pytest
	$(FRONTEND) && npm run test

## Линтеры и форматтеры
lint:
	$(BACKEND) uv run ruff check app tests alembic
	$(BACKEND) uv run ruff format --check app tests alembic
	$(FRONTEND) && npm run lint
	$(FRONTEND) && npx tsc -b
	$(FRONTEND) && npm run format:check

## Production build (backend deps check + frontend build)
build:
	$(BACKEND) uv sync --frozen
	$(FRONTEND) && npm run build

## Полная проверка: линт + тесты + build
check: lint test build
	@echo "Все проверки пройдены."
