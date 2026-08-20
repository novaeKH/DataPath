# Интеграция AlgoPath

AlgoPath подключён к DataPath как отдельный практический runtime, а не как набор Markdown-уроков.
Canonical YAML и Python runner остаются в соседнем source-проекте; DataPath хранит только
нормализованный, проверяемый snapshot для web/PWA release.

## Реализованный контракт

- `scripts/integrate_practice_projects.py` читает 71 YAML problem и исходный runner без изменения
  source-проекта.
- `frontend/public/practice-data/algopath.json` содержит стабильные slugs, темы, условия,
  starter/canonical code, public/hidden tests и runner config.
- `algoWorker.ts` поднимает self-hosted Pyodide; `algoRunner.ts` управляет worker, таймаутом и
  повторным созданием после зависшего решения.
- Исходный AlgoPath runner поддерживает function/class mode, in-place задачи и структуры
  ListNode, TreeNode и GraphNode. В браузер не передаётся backend API и пользовательский код не
  выполняется в main UI thread.
- Local store сохраняет черновик, статус, число попыток, подсказки, раскрытие решения и последний
  verdict по stable problem slug.

## Пользовательский маршрут

`Практика → AlgoPath → тема/поиск → задача → публичные тесты → все тесты → следующая задача`.

Каталог адаптивный: desktop использует боковой список, mobile — компактный selector. Решение и
объяснение скрыты до явного действия пользователя. Hidden tests показывают verdict и номер, но не
раскрывают входные данные.

## Обновление snapshot

```bash
make sync-practice-projects
```

Команда нужна только при изменении соседнего AlgoPath. CI и обычная PWA-сборка используют уже
зафиксированный snapshot и поэтому не зависят от наличия source-проекта рядом.
