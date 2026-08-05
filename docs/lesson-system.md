# DataPath — система уроков (Фаза 3, доработки Фазы 6A)

> Статус: реализовано и проверено (phase-3-complete); Фаза 6A добавляет
> смысловую группировку сцен, `display_title`, метаданные сцен, прозрачность
> `source_heading` и рендер inline-математики.

Система уроков связывает каталог vault, Python-парсер сцен и React-frontend.
Вся предметная логика (построение сцен, расчёты лабораторий, валидация
параметров) живёт в backend; frontend только отображает готовые данные.

## 1. Модель сцен

Урок — упорядоченный список сцен. Каждая сцена имеет стабильный ID
(`scene-01`, `scene-02`, … — по порядку, детерминированно).

| Тип | Поля | Назначение |
|---|---|---|
| `markdown` | `title`, `display_title`, `markdown` | Связное объяснение (секция source-заметки) |
| `formula` | `formula`, `explanation` | LaTeX-формула и пояснение (включая intro) |
| `code` | `language`, `code`, `caption` | Fenced code block (caption = intro + пояснение) |
| `callout` | `callout_type`, `markdown` | Obsidian callout (`> [!type]`) |
| `checkpoint` | `question` | Вопрос самопроверки (без сохранения оценки) |
| `interactive_lab` | `lab_id`, `lab_title` | Ссылка на зарегистрированную лабораторию |
| `table` | `markdown` | Таблица (рендерится через MarkdownContent) |
| `visual` | `markdown` | Визуализация/изображение (placeholder Фазы 6A) |

Каждая сцена содержит метаданные (Фаза 6A): `word_count`,
`source_content_id`, `source_heading`, `semantic_role` (`motivation`,
`intuition`, `mechanism`, `mathematics`, `example`, `visualization`, `code`,
`hyperparameters`, `pitfalls`, `comparison`, `checkpoint`, `lab`,
`interview_summary` или `null`), `contains_formula`, `contains_code`,
`contains_visual`.

### display_title

`display_title` — детерминированный пользовательский заголовок сцены,
отдельный от `source_heading` (который может повторяться у нескольких сцен
одной H2-секции). Приоритет:

1. H3/H4-заголовок внутри сцены;
2. уникальный `source_heading`;
3. смысловая метка формулы (`\operatorname{Gini}` → Gini) / caption кода / таблицы / visual;
4. локализованная метка `semantic_role`;
5. короткое первое предложение;
6. стабильный fallback.

Scene ID, `source_heading`, `semantic_role` и прогресс не меняются.

Порядок сборки урока (`LessonContentService.lesson`):

1. **Hook** — заголовок из `datapath`-сценария или summary-callout урока.
2. **Content** — сцены из source-заметки по `content_path`.
3. **Labs** — `interactive_lab` для каждой лаборатории registry, привязанной к уроку.
4. **Checkpoint** — вопросы из раздела «Проверка понимания» урока.

## 2. Правила разбора Markdown

`build_source_scenes` (backend, `app/services/lesson_content.py`):

- секции отделяются заголовками `H2`; `H3/H4` остаются внутри секции;
- `$$...$$` → сцена `formula` (короткий intro до формулы + пояснение после
  объединяются в `explanation`; текст не дублируется и не создаёт лишних сцен);
- fenced code block → сцена `code` (intro до блока + пояснение после → `caption`);
- `> [!type] ...` → сцена `callout`;
- остальной текст группируется в связные `markdown`-сцены (абзацы не дробятся);
- короткие сцены (< 15 слов) сливаются с ближайшей содержательной сценой;
- мета-секции «Связи»/«Источники» пропускаются.

### source_heading: статусы разрешения

Если `datapath`-сценарий урока содержит `content` с `source_heading`, который
**не существует** в source-заметке (в текущем vault уроки ссылаются на
`"Коротко"`/`"Интуиция"`, которых нет), берутся **все секции** заметки по
порядку — осознанное поведение. Для прозрачности урок возвращает
`heading_resolution`:

- `exact` — точное совпадение с H2 source-заметки;
- `normalized` — совпадение после нормализации (trim, регистр, markdown-эмфазис, числовые префиксы);
- `fallback` — заголовок не найден, используются все секции (quality CLI → warning `source_heading_fallback`);
- `missing` — source недоступен/пуст (quality CLI → warning `source_heading_missing`).

Quality CLI (`python -m app.cli.content quality`) включает в warning:
lesson_id, source_content_id, requested_heading, selected_heading, status,
source_path (относительный путь vault), known_alias.

## 3. API уроков

- `GET /api/content/courses/{course_id}` — курс: модули по порядку, уроки,
  кейсы, `first_lesson_id`/`last_lesson_id`.
- `GET /api/content/lessons/{lesson_id}` — урок: metadata, `previous_lesson_id`/
  `next_lesson_id` (порядок курса: `module_order`, `lesson_order`), сцены
  (включая `display_title` и метаданные), `laboratory_ids`, `materials`,
  `heading_resolution`, `source_content_id`, `source_path`.

Ответы не содержат абсолютных путей и сырого frontmatter. Чтение vault
ограничено двумя файлами на урок (сам урок + source по `content_path`);
пути резолвятся строго внутри `content/vault` (защита от path traversal).

## 2a. Рендер Markdown/KaTeX (frontend)

`MarkdownContent` использует remark-gfm + remark-math + rehype-katex +
rehype-sanitize:

- inline-математика (`$n$`, `$I$`, `$n_L$`) рендерится и в обычных сценах,
  и в explanation формул, и в captions кода;
- **KaTeX требует inline `style`-атрибуты** для позиционирования дробей и
  подстрочных символов; sanitize-схема разрешает `style`/`ariaHidden` для
  `span`/`code`. `rehypeRaw` не включён, произвольный HTML и JavaScript
  не исполняются, `javascript:`-ссылки санитизируются;
- списки получают явные `list-disc`/`list-decimal` (Tailwind v4 preflight
  сбрасывает `list-style`);
- таблицы и формулы оборачиваются в локальный горизонтальный scroll.

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
лабораторий, расчёты моделей, метрики, валидация, объяснения, прогресс сцен,
оценки навыков (Фаза 4).

**Frontend:** отображение урока, навигация по сценам, элементы управления
лабораторией, SVG-графики, отправка параметров, отображение результатов,
сохранение позиции и прогресса (отправка событий). ML-логики во frontend нет.

## 8. Прогресс уроков (Фаза 4)

- При навигации по сценам frontend вызывает
  `POST /api/progress/lessons/{id}/scenes/{scene_id}/complete` — backend
  сохраняет текущую позицию (`lesson_progress.current_scene_id`) и завершённые
  сцены, создаёт слабое evidence по теории.
- При открытии урока frontend запрашивает `GET /api/progress/lessons/{id}` и
  восстанавливает последнюю незавершённую сцену.
- Кнопка «Завершить урок» → `POST /api/progress/lessons/{id}/complete`:
  умеренный сигнал по теории (не высокий mastery).
- Лаборатория: кнопка «Сохранить результат в прогресс» →
  `POST /api/progress/labs/{lab_id}/record` (идемпотентно, без дубликатов).
- Подробности — [`docs/progress-system.md`](progress-system.md).

**Повторения (Фаза 5):** завершение урока активирует review items по
шаблонам урока, успешная лаборатория (score ≥ 0.6) — по шаблонам
application/interpretation. Элементы появляются лениво и идемпотентно при
первом запросе `/api/reviews/*` или `/api/today`; незавершённый урок не
ставит материал в очередь. Подробности — [`docs/review-system.md`](review-system.md).

## 9. Известные ограничения

- `datapath`-типы `retrieval/application/interview/reflection` не реализованы
  (Фаза 6: AI-оценка, свободный текст).
- Интервальное повторение (review_queue, SM-2) — Фаза 5.
- `prev/next` — порядок курса, а не «спираль» MVP-маршрута
  (07 → 06 → 08 → …); маршрут открывается из Atlas.
- CatBoost участвует в сравнении, только если CPU-пакет установлен
  (`dataset.catboost_available`); иначе лаборатория честно показывает
  ограничение, а урок 10 остаётся теорией.
- KaTeX делает bundle больше (~800 kB) — полировка/код-сплит в Фазе 7.
