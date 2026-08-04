---
title: DataPath Content Spec
id: meta.learning-system.datapath-content-spec
type: meta
area: learning-system
status: active
schema_version: 2
language: ru
rag: exclude
app: exclude
updated: 2026-08-05
---

# DataPath Content Spec

## Зачем нужен слой курсов

`10 Знания` остаётся канонической базой теории. `15 Практика` хранит самостоятельные задачи и runnable-примеры. Новый раздел `05 Курсы` не копирует знания: он задаёт маршрут, учебные сцены, интерактивные компоненты, проверки и кейсы, а затем ссылается на canonical notes.

```text
Canonical knowledge → Lesson wrapper → Interactive scene → Assessment → User memory
```

Пользовательская память, ответы, сильные и слабые навыки не записываются в vault. Их хранит приложение в локальной базе.

## Типы контента

| `type` | Назначение | RAG | App |
|---|---|---:|---:|
| `concept` / `deep-dive` | источник истины | include | source |
| `practice` | задача, кейс или runnable-практика | include | source/include |
| `interview` | короткие ответы и follow-up | include, отдельная коллекция | source |
| `course` | описание курса и порядок модулей | exclude | include |
| `module` | связная группа уроков | exclude | include |
| `lesson` | сценарий отображения canonical note | exclude | include |
| `moc`, `meta`, `router`, `template`, `source` | навигация и служебные файлы | exclude | exclude |

## Обязательные поля app-контента

```yaml
id: lesson.classic-ml.trees.decision-tree
type: lesson
course_id: course.classic-ml
module_id: module.classic-ml.trees
content_path: 10 Знания/ML/01 Classical ML/Decision Trees.md
skill_ids: [ml.tree_ensembles]
estimated_minutes: 35
difficulty: core
rag: exclude
app: include
```

Стабильный `id` используется в прогрессе пользователя. Путь можно менять после миграции, но `id` менять нельзя.

## Формат урока

Урок состоит из коротких сцен. В Markdown хранится понятное человеку описание, а fenced-блок `datapath` хранит конфигурацию приложения.

```datapath
{
  "schema_version": 1,
  "layout": "focus",
  "scenes": [
    {"type": "hook"},
    {"type": "content", "source_heading": "Коротко"},
    {"type": "interactive", "component": "threshold-explorer"},
    {"type": "retrieval", "mode": "free-recall"},
    {"type": "interview"}
  ]
}
```

## Практика

Поле `practice_kind`:

- `exercise` — один навык;
- `mini-case` — связная группа тем;
- `module-case` — большая часть модуля;
- `mixed-case` — несколько направлений;
- `project` — длительная поэтапная работа.

Каждый кейс обязан указывать `skill_ids`, входные данные, ожидаемые артефакты, критерии завершения и режимы `guided`, `standard`, `interview`, `real-world`.

## Интерактивные компоненты MVP

- `validation-split-lab`;
- `leakage-detector`;
- `threshold-cost-explorer`;
- `regularization-path`;
- `decision-tree-split-lab`;
- `bootstrap-forest-lab`;
- `boosting-residuals-lab`;
- `categorical-encoding-lab`;
- `kmeans-canvas`;
- `pca-projection-lab`.

Компонент получает конфигурацию из урока и записывает только события и результат в пользовательскую БД.
