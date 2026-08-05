# DataPath — система уроков (Фаза 3)

> Статус: реализовано и проверено (phase-3-complete).

Система уроков связывает каталог vault, Python-парсер сцен и React-frontend.
Вся предметная логика (построение сцен, расчёты лабораторий, валидация
параметров) живёт в backend; frontend только отображает готовые данные.

## 1. Модель сцен

Урок — упорядоченный список сцен. Каждая сцена имеет стабильный ID
(`scene-01`, `scene-02`, … — по порядку, детерминированно).

| Тип | Поля | Назначение |
|---|---|---|
| `markdown` | `title`, `markdown` | Связное объяснение (секция source-заметки) |
| `formula` | `formula`, `explanation` | LaTeX-формула и краткое пояснение |
| `code` | `language`, `code`, `caption` | Fenced code block |
| `callout` | `callout_type`, `markdown` | Obsidian callout (`> [!type]`) |
| `checkpoint` | `question` | Вопрос самопроверки (без сохранения оценки) |
| `interactive_lab` | `lab_id`, `lab_title` | Ссылка на зарегистрированную лабораторию |

Порядок сборки урока (`LessonContentService.lesson`):

1. **Hook** — заголовок из `datapath`-сценария или summary-callout урока.
2. **Content** — сцены из source-заметки по `content_path`.
3. **Labs** — `interactive_lab` для каждой лаборатории registry, привязанной к уроку.
4. **Checkpoint** — вопросы из раздела «Проверка понимания» урока.

## 2. Правила разбора Markdown

`build_source_scenes` (backend, `app/services/lesson_content.py`):

- секции отделяются заголовками `H2`; `H3/H4` остаются внутри секции;
- `$$...$$` → сцена `formula` (пояснение — следующий короткий абзац ≤ 400 симв.);
- fenced code block → сцена `code`;
- `> [!type] ...` → сцена `callout`;
- остальной текст группируется в связные `markdown`-сцены (абзацы не дробятся);
- мета-секции «Связи»/«Источники» пропускаются.

Если `datapath`-сценарий урока содержит `content` с `source_heading`, который
**не существует** в source-заметке (в текущем vault уроки ссылаются на
`"Коротко"`/`"Интуиция"`, которых нет), берутся **все секции** заметки по
порядку. Это осознанное отличие от плана в `docs/content-system.md`.

## 3. API уроков

- `GET /api/content/courses/{course_id}` — курс: модули по порядку, уроки,
  кейсы, `first_lesson_id`/`last_lesson_id`.
- `GET /api/content/lessons/{lesson_id}` — урок: metadata, `previous_lesson_id`/
  `next_lesson_id` (порядок курса: `module_order`, `lesson_order`), сцены,
  `laboratory_ids`, `materials`.

Ответы не содержат абсолютных путей и сырого frontmatter. Чтение vault
ограничено двумя файлами на урок (сам урок + source по `content_path`);
пути резолвятся строго внутри `content/vault` (защита от path traversal).

## 4. Registry лабораторий

Единая точка регистрации — `app/services/labs/registry.py` (`LabRegistry`).
Каждая лаборатория — класс `Lab` (`base.py`):

- `id`, `title`, `description`, `lesson_ids`;
- `parameters` — декларация формы (тип, диапазон, дефолт);
- `run(params)` — Pydantic-валидация + детерминированный расчёт (seed 42).

API: `GET /api/labs/{lab_id}` (metadata + параметры + `initial_result`) и
`POST /api/labs/{lab_id}/run` (422 при некорректных параметрах, 404 при
неизвестном lab_id).

### Реализованные лаборатории (3)

| ID | Уроки | Суть |
|---|---|---|
| `decision-tree-split-lab` | 07 Decision Tree | Разбиение датасета: feature/threshold/criterion, impurity, gain |
| `tree-depth-overfitting-lab` | 06 Bias/Variance, 07 Decision Tree | max_depth/min_samples_leaf, train/val, decision boundary, кривая по глубине |
| `ensemble-comparison-lab` | 08 RF, 09 GB, 10 CatBoost | DT vs RF vs GB (+CatBoost), n_estimators/depth/lr, время, boundary |

## 5. Связь lesson → lab

- явная: `interactive_lab`-сцены из registry по `lesson_ids` лаборатории;
- в frontmatter уроков есть `interactive_component` (плановые ID) — в Фазе 3
  реализованы 3 из них; нереализованные компоненты в сцены не добавляются.

## 6. Как добавить новую лабораторию

1. Создать класс в `app/services/labs/<name>.py`, наследовать `Lab`.
2. Описать `parameters` и реализовать детерминированный `run()`.
3. Зарегистрировать в `get_default_registry()` (`registry.py`).
4. Добавить `lesson_ids` для нужных уроков.
5. Создать компонент результата во frontend и добавить кейс в
   `LabResult` (`components/interactive/LabHost.tsx`).

## 7. Границы backend/frontend

**Backend:** чтение vault, парсинг сцен, метаданные урока, генерация данных
лабораторий, расчёты моделей, метрики, валидация, объяснения.

**Frontend:** отображение урока, навигация по сценам, элементы управления
лабораторией, SVG-графики, отправка параметров, отображение результатов.
ML-логики во frontend нет.

## 8. Известные ограничения

- `datapath`-типы `retrieval/application/interview/reflection` не реализованы
  (Фазы 4–6: AI-оценка, прогресс).
- Прогресс пользователя не сохраняется (Фаза 4).
- `prev/next` — порядок курса, а не «спираль» MVP-маршрута
  (07 → 06 → 08 → …); маршрут открывается из Atlas.
- CatBoost участвует в сравнении, только если CPU-пакет установлен
  (`dataset.catboost_available`); иначе лаборатория честно показывает
  ограничение, а урок 10 остаётся теорией.
- KaTeX делает bundle больше (~800 kB) — полировка/код-сплит в Фазе 7.
