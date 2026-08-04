---
type: meta
area: learning-system
status: complete
rag: exclude
updated: 2026-08-02
title: Learning System v1 — состояние
id: meta.learning-system.learning-system-v1-sostoianie
schema_version: 2
language: ru
app: exclude
---
# Learning System v1 — состояние

Эта заметка нужна для воспроизводимой разработки учебного слоя ML Vault Agent.
Она не индексируется агентом и не содержит пользовательскую учебную память.

## Контракт

- Vault остаётся read-only для приложения.
- Здесь хранятся теория, задания, диагностические вопросы и прозрачная карта
  навыков.
- Личные попытки, слабые места и расписание повторений хранятся локально в
  `data/learning.sqlite3` приложения, а не коммитятся в Git.
- Roadmap необязательный и содержит видимое происхождение внешних программ.
- SQL не входит в Learning System v1 и будет добавлен отдельным обновлением.

## Checkpoints

- [x] 0. Созданы ветки `learning-system-v1`, зафиксирован контракт.
- [x] 1. Каталог из 10 базовых ML-навыков и roadmap.
- [x] 2. Валидация каталога из приложения.
- [x] 3. Интеграция с памятью и интерфейсом.
- [x] 4. Финальная проверка ссылок, структуры и Git-состояния.

Исходные commits: приложение `f0cdb7c`, vault `53d2766`.

Проверка после checkpoint 1:

```bash
cd /path/to/ml-vault-agent
python -m app.learning_catalog --vault /path/to/My_brain_v2
```

Ожидаемый результат: `core-ml-v1 — 10 skills, 4 stages, 10 diagnostics`.

Финальная проверка выполнена 2026-08-02. Каталог прошёл validator, приложение —
47 тестов, desktop/mobile browser-check и GitHub Actions на macOS/Windows. Vault
опубликован в отдельном репозитории; личная evidence-memory остаётся только в
`data/learning.sqlite3` приложения.


## DataPath v2

- [x] Добавлен независимый слой `05 Курсы`.
- [x] Подготовлен MVP-курс по Classic ML с 13 lesson wrappers.
- [x] Добавлены мини-кейсы по связанным темам и смешанные кейсы.
- [x] Введены стабильные `id`, явные `rag`/`app` и machine-readable catalog.
- [x] Добавлены source registry, Hermes guide и validator.
- [x] Пользовательская память по-прежнему хранится только в локальной БД приложения.

Дата миграции: 2026-08-05.
