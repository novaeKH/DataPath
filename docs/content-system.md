# DataPath — система учебного контента

## Как приложение читает `content/vault`

```
content/vault/
    │
    ├── _meta/            → app: exclude — полностью пропускается
    ├── .obsidian/        → игнорируется
    ├── 00 Главная/       → MOC и навигация → app: exclude
    ├── 01 Входящие/      → app: exclude
    ├── 02 Ежедневные/    → app: exclude
    ├── 05 Курсы/         → ОСНОВНОЙ ИСТОЧНИК ДЛЯ ПРИЛОЖЕНИЯ
    │   ├── Классический ML/
    │   │   ├── 00 Курс — Классический ML.md    (type: course, app: include)
    │   │   ├── Модули/                          (type: module, app: include)
    │   │   ├── Уроки/                           (type: lesson, app: include)
    │   │   └── Кейсы/                           (type: practice, app: include)
    │   └── Смешанные кейсы/                     (type: practice, app: include)
    ├── 10 Знания/        → app: source — каноническая теория
    ├── 15 Практика/      → app: source/include — задачи и примеры
    ├── 60 Карьера/       → app: exclude (MVP) — интервью отдельно
    └── 90 Шаблоны/       → app: exclude
```

## Типы Markdown-заметок для приложения

| `type` | Frontmatter | Назначение | Потребитель |
|---|---|---|---|
| `course` | `id: course.*`, `estimated_hours`, `difficulty`, `accent`, `icon` | Описание курса и порядок модулей | Atlas, Today, навигация курса |
| `module` | `id: module.*`, `course_id`, `module_order`, `estimated_minutes` | Группа связанных уроков | Atlas, маршрут курса |
| `lesson` | `id: lesson.*`, `course_id`, `module_id`, `content_path`, `skill_ids`, `interactive_component`, `estimated_minutes` | Сценарий интерактивного урока | Focus (сцены) |
| `practice` | `id: case.*`, `practice_kind`, `skill_ids`, `modes`, `estimated_minutes` | Упражнение, мини-кейс, итоговый кейс | Studio |
| `concept` | `id: concept.*`, `aliases`, `math_depth`, `rag: include` | Каноническая теория | Lesson (source), RAG |
| `deep-dive` | `id: concept.*.deep`, `math_depth: 3`, `rag: include` | Углублённая математика | RAG, опциональный материал урока |
| `interview` | `rag_collection: interview` | Короткие ответы для собеседования | Interview-режим RAG |
| `moc`, `meta`, `router`, `template` | `app: exclude` | Навигация и служебные | Не загружаются |

## YAML frontmatter — контракт

### Обязательные поля для app-контента

```yaml
---
id: lesson.classic-ml.trees.tree      # Стабильный ID (не менять после assign)
schema_version: 2                     # Версия схемы
type: lesson                           # Тип из контролируемого списка
area: ml                               # Предметная область
status: active                         # seedling/active/stable/deprecated
language: ru                           # Язык контента
rag: exclude                           # include | exclude
app: include                           # include | source | exclude
---
```

### Дополнительные поля по типу

**course:**
```yaml
difficulty: beginner-intermediate       # beginner | intermediate | advanced
estimated_hours: 10                     # Общая длительность
accent: emerald                         # Цвет в Atlas
icon: route                             # Иконка
source_ids: [sklearn-user-guide, ...]   # Источники
```

**lesson:**
```yaml
course_id: course.classic-ml            # Привязка к курсу
module_id: module.classic-ml.trees      # Привязка к модулю
module_order: 3                         # Порядок модуля
lesson_order: 1                         # Порядок урока в модуле
content_path: 10 Знания/ML/...         # Путь к канонической заметке
skill_ids: [ml.tree_ensembles]          # ID навыков из Learning Catalog
estimated_minutes: 45                   # Длительность
difficulty: core                        # core | advanced
interactive_component: decision-tree-split-lab  # ID интерактивного лаба
```

**practice (кейс):**
```yaml
practice_kind: mini-case                # exercise | mini-case | module-case | mixed-case | project
skill_ids: [ml.problem_framing, ...]    # Проверяемые навыки
modes: [guided, standard, interview, real-world]
estimated_minutes: 35
difficulty: standard
```

## Как строятся курсы и маршруты

```text
Course (00 Курс — Классический ML.md)
│
├── Module 1: Постановка задачи и оценка
│   ├── Lesson 01: Как поставить ML-задачу
│   │   └── source → 10 Знания/ML/.../ML Foundations.md
│   ├── Lesson 02: Validation, split и data leakage
│   │   └── source → 10 Знания/ML/.../Validation Splits.md
│   └── Lesson 03: Метрика, probability и threshold
│       └── source → 10 Знания/ML/.../ML Metrics.md
│
├── Module 2: Линейные модели
│   ├── Lesson 04: Linear Regression
│   ├── Lesson 05: Logistic Regression
│   └── Lesson 06: Bias, variance и regularization
│
├── Module 3: Деревья и ансамбли  ← MVP-маршрут
│   ├── Lesson 07: Decision Tree
│   ├── Lesson 08: Random Forest
│   ├── Lesson 09: Gradient Boosting
│   └── Lesson 10: XGBoost, LightGBM, CatBoost
│
├── Module 4: Unsupervised ML
│   ├── Lesson 11: K-Means
│   └── Lesson 12: PCA
│
└── Module 5: End-to-end
    └── Lesson 13: Classification pipeline
```

## Маршрут MVP

```text
Decision Tree (урок 07)
    ↓
Bias/Variance (урок 06 — prerequisite)
    ↓
Random Forest (урок 08)
    ↓
Gradient Boosting (урок 09)
    ↓
CatBoost (урок 10)
    ↓
Сравнение моделей + итоговый кейс
```

## Интерактивные компоненты урока

Каждый урок определяет сцены через fenced-блок `datapath`:

```json
{
  "schema_version": 1,
  "layout": "focus",
  "content_path": "10 Знания/ML/01 Classical ML/Decision Trees.md",
  "scenes": [
    {"type": "hook", "title": "Зачем это нужно"},
    {"type": "content", "source_heading": "Коротко"},
    {"type": "content", "source_heading": "Интуиция"},
    {"type": "interactive", "component": "decision-tree-split-lab"},
    {"type": "retrieval", "mode": "free-recall"},
    {"type": "application", "mode": "micro-task"},
    {"type": "interview", "mode": "follow-up"},
    {"type": "reflection", "action": "update-skill-evidence"}
  ]
}
```

**Типы сцен:**

| Тип | Описание | Данные |
|---|---|---|
| `hook` | Введение, мотивация | title |
| `content` | Канонический контент из source-заметки | source_heading |
| `interactive` | Интерактивный лабораторный компонент | component (ID лаба) |
| `retrieval` | Свободное воспроизведение (free-recall) | mode, prompt |
| `application` | Микро-задача на применение | mode |
| `interview` | Вопрос в стиле собеседования | mode |
| `reflection` | Итог, обновление evidence | action |

**Интерактивные лабы MVP:**

1. `decision-tree-split-lab` — визуализация разделения пространства
2. `bootstrap-forest-lab` — влияние bootstrap и количества деревьев
3. `boosting-residuals-lab` — последовательное исправление ошибок
4. `threshold-cost-explorer` — выбор порога по цене ошибок
5. `regularization-path` — эффект регуляризации

## Связь тем с упражнениями и кейсами

```text
Тема (concept) ←── Lesson (content_path)
                        │
                        ├── exercise (practice_kind: exercise)
                        │   └── проверяет 1 skill
                        │
                        ├── mini-case (practice_kind: mini-case, 3-4 урока)
                        │   └── проверяет 3-5 skills
                        │
                        ├── module-case (practice_kind: module-case)
                        │   └── проверяет 5-10 skills целого модуля
                        │
                        └── mixed-case (practice_kind: mixed-case)
                            └── проверяет skills из разных областей
```

## Отделение публикуемого от личного

**В приложение попадает (`app: include`):**
- `05 Курсы/` — курсы, модули, уроки, кейсы
- Отдельные `15 Практика/` — только с `app: include`

**В приложение НЕ попадает (`app: exclude`):**
- `_meta/` — служебные документы
- `.obsidian/` — конфигурация Obsidian
- `00 Главная/`, `01 Входящие/`, `02 Ежедневные заметки/`
- `30 Мысли/` — личные заметки
- `40 Проекты/` — личные проекты (кроме явно помеченных)
- `50 Люди и идеи/` — личные контакты
- `90 Шаблоны/` — шаблоны
- `99 Вложения/` — файлы
- `60 Карьера/` — личная подготовка (MVP)

**В RAG попадает только:**
- `rag: include` И `app: source` ИЛИ `app: include` с `rag_collection`
- Только коллекции: `knowledge`, `practice`, `interview`
- Исключены: MOC, router, template, meta, question bank

## Что из Obsidian НЕ попадает в приложение и RAG

- `.obsidian/` — весь каталог
- `.gitattributes`, `.gitignore`
- `.hermes.md` (в vault)
- `CHANGELOG.md`, `MIGRATION_REPORT.md`, `README_DATAPATH.md`
- Canvas-файлы (`.canvas`)
- Вложения (изображения, скриншоты)
- Заметки без frontmatter
- Заметки с `status: deprecated`
- Router-notes

## Проверка целостности

При парсинге vault приложение проверяет:

1. **Структурная целостность:**
   - У каждого `lesson` есть существующий `content_path`
   - У каждого `lesson`/`case` есть существующие `skill_ids` в Learning Catalog
   - У каждого `module` есть `course_id`, ссылающийся на существующий курс
   - Нет циклических зависимостей в prerequisites

2. **Metadata-целостность:**
   - Все обязательные поля присутствуют
   - `id` уникальны и не меняются между запусками
   - Значения `type`, `area`, `status`, `difficulty` из контролируемых списков
   - `rag` и `app` не конфликтуют (например, `app: include` с `rag: include` — ок, но `app: exclude` с `rag: include` — конфликт)

3. **Контентная целостность:**
   - Файлы, на которые ссылаются `content_path`, существуют
   - Wikilinks внутри заметок разрешимы (предупреждение, не ошибка)

Проверка запускается:
- При старте бэкенда (быстрая проверка изменённых файлов)
- Через CLI: `python -m backend.check_integrity`
- В CI (при добавлении новых материалов)

## Инкрементальное обновление каталога

```
1. При старте: сканирование content/vault
2. Для каждого .md файла:
   a. Вычислить content_hash (SHA-256)
   b. Если файла нет в catalog → добавить
   c. Если хеш изменился → обновить запись
   d. Если файл удалён → пометить как deleted
3. Для RAG:
   a. Только для изменившихся файлов с rag: include
   b. Удалить старые чанки из ChromaDB
   c. Переразбить и переиндексировать
4. Триггеры обновления:
   - Запуск приложения
   - POST /api/content/reload (ручной триггер)
   - Watch-режим (опционально, через watchdog)
```
