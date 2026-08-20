# Встроенные проекты практики

Practice в DataPath намеренно содержит только два больших тренажёра. Прежние короткие exercises и
case library больше не участвуют в пользовательской навигации, но их старые local-state записи не
удаляются: это позволяет обновить установленную PWA без потери пользовательских данных.

## SQL Praktikum

- Source: соседний `sql_praktikum_v3_1` (read-only).
- Snapshot: 76 задач, 9 разделов, условия, проверки, помощь и reference SQL.
- Runtime: SQLite WASM в отдельном Worker.
- Dataset: согласованная детерминированная выборка Olist. Заказы выбираются по стабильному hash,
  затем переносятся все связанные order items, payments, reviews, customers, products, sellers и
  category translation. Неиспользуемая geolocation table не включается.
- Проверка сравнивает полный табличный результат с эталоном, включая порядок строк и значения.

## AlgoPath

- Source: соседний `AlgoPath` (read-only).
- Snapshot: 71 задача, 14 тем, русские условия, examples, constraints, starter code,
  public/hidden tests, solution и explanation.
- Runtime: self-hosted Pyodide и исходный AlgoPath runner в отдельном Worker.
- Ограничение выполнения защищает интерфейс от бесконечного цикла; после timeout worker создаётся
  заново. Весь код исполняется локально, без отправки на сервер.

## Сборка и offline

```bash
make sync-practice-projects
```

Generator обновляет `frontend/public/practice-data` и manifest с контрольными суммами. Команда не
входит в обычный build: GitHub Actions не обязан иметь два соседних source-repository. В PWA
небольшие каталоги и runner входят в shell cache, а Olist DB и Pyodide core кэшируются отдельными
отказоустойчивыми запросами. Даже если устройство не сможет сразу сохранить крупные assets, shell
обновится, а недостающий runtime будет загружен при первом открытии тренажёра.

## Проверка перед публикацией

1. Выполнить все reference SQL queries на snapshot DB.
2. Выполнить canonical solution каждой AlgoPath задачи на public + hidden tests.
3. Запустить frontend tests, lint, TypeScript, Prettier и production build.
4. Проверить desktop/mobile: запуск SQL, успешный Python submit, syntax error, timeout, refresh и
   восстановление progress.
