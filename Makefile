# DataPath 1.0.0 — development, validation and native release commands.

.PHONY: dev dev-backend dev-frontend migrate sync-content validate-content release-snapshot test lint build build-web build-macos ios-sync ios-open check prod

BACKEND = cd backend && PYTHONPATH=
FRONTEND = cd frontend

## Полный локальный DataPath (Ctrl+C останавливает оба процесса)
dev:
	$(MAKE) -j2 dev-backend dev-frontend

## Backend: FastAPI dev server на :8000
dev-backend:
	$(BACKEND) uv run python -m uvicorn app.main:app --reload

## Frontend: Vite dev server на :5173 (проксирует /api в backend)
dev-frontend:
	$(FRONTEND) && npm run dev

## Подготовить локальную SQLite schema (безопасно повторяется на существующей базе).
migrate:
	$(BACKEND) uv run alembic upgrade head

## Синхронизация content/vault → SQLite каталог
sync-content: migrate
	$(BACKEND) uv run python -m app.cli.content sync

## Валидация vault (без изменения БД)
validate-content:
	$(BACKEND) uv run python -m app.cli.content validate
	$(BACKEND) uv run python -m app.cli.content quality

## Канонический offline snapshot для PWA, macOS и iOS.
release-snapshot: sync-content
	$(BACKEND) .venv/bin/python -m app.cli.release_snapshot

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

## Production web/PWA bundle со всеми уроками и local-first runtime.
build-web: release-snapshot
	$(FRONTEND) && npm run build

## Native unsigned macOS application bundle.
build-macos: release-snapshot
	cd desktop && PATH=/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin ../frontend/node_modules/.bin/tauri build --bundles app --no-sign

## Обновить native iOS project production assets.
ios-sync: release-snapshot
	$(FRONTEND) && npm run ios:sync

## Синхронизировать и открыть Xcode project (требует полный Xcode).
ios-open: ios-sync
	$(FRONTEND) && npm run ios:open

## Полная проверка: линт + тесты + build
check: lint test build
	@echo "Все проверки пройдены."

## Production-like локальный запуск: migrations + content sync выполняет backend entrypoint.
prod:
	docker compose up --build
