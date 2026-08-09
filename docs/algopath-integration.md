# Интеграция AlgoPath

DataPath не должен копировать банк алгоритмических задач. Интеграция строится через модульный
контракт, чтобы AlgoPath мог оставаться отдельным источником контента и прогресса.

## Граница домена

`LearningModuleProvider` предоставляет унифицированные элементы маршрута и ссылки на практику.
Текущий `ContentLearningModuleProvider` читает опубликованные курсы из SQLite. Будущий
`AlgoPathLearningModuleProvider` адаптирует существующие AlgoPath topics/tasks к тому же контракту.

Минимальная сущность модуля:

```text
id, title, course_id, stage, depth, order,
lessons[{id, title, estimated_minutes, status}],
practice_refs[], source_provider
```

Собственные сущности AlgoPath остаются отдельными:

```text
AlgorithmTopic
AlgorithmProblem
AlgorithmAttempt
AlgorithmPatternMastery
```

Они не маскируются под markdown-урок. Adapter публикует только совместимое представление для
Roadmap/Today/Atlas и переводит результат задачи в стандартный learning evidence.

## Что переиспользуется без изменений

- Roadmap получает модули через registry, а не напрямую из конкретного каталога.
- Today выбирает следующий `LearningItem` из Roadmap.
- Review получает review candidates из provider adapter.
- Atlas получает block/group descriptors и prerequisite edges.
- Focus открывает lesson или внешний practice target по typed link.

## Порядок подключения

1. Найти canonical repository/data layer AlgoPath и зафиксировать стабильные topic/problem IDs.
2. Реализовать read-only adapter и сопоставление patterns с DataPath skills.
3. Импортировать исторический progress идемпотентно.
4. Подключить запуск задач через typed practice link.
5. Только после сверки данных убрать временный встроенный Algorithms-контент.

До появления canonical AlgoPath текущий курс Algorithms остаётся рабочим fallback, но registry и
API не требуют копировать ещё один набор задач.
