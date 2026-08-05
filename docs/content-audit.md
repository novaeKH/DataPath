# DataPath — Content Audit (Фаза 6A)

> Аудит парсинга и группировки сцен MVP-маршрута.
> Дата: 2026-08-05. Основан на реальных данных API.
> Обновлён в таргетированном completion-пасе Фазы 6A.

## Методология

Для каждого MVP-урока сравнивались:
- Исходная source-заметка (concept в `10 Знания/ML/01 Classical ML/`);
- Ответ `GET /api/content/lessons/{id}`;
- Фактическое разбиение на сцены, типы, заголовки, размеры.

## Шесть тем MVP: сцены до и после

| Тема | Lesson ID | Source content ID | Сцен было | Сцен сейчас | Δ абс. | Δ отн. | Blocker/important остаток |
|---|---|---|---|---|---|---|---|
| Decision Tree | `lesson.classic-ml.trees.tree` | `concept.ml.decision-trees` | 26 | 18 | −8 | −31% | нет |
| Bias/Variance | `lesson.classic-ml.linear.regularization` | `concept.ml.regularization` | 30 | 19 | −11 | −37% | нет |
| Random Forest | `lesson.classic-ml.trees.forest` | `concept.ml.bagging-and-random-forest` | 22 | 18 | −4 | −18% | нет |
| Gradient Boosting | `lesson.classic-ml.trees.boosting` | `concept.ml.gradient-boosting` | 28 | 21 | −7 | −25% | нет |
| CatBoost | `lesson.classic-ml.trees.libraries` | `concept.ml.xgboost-lightgbm-and-catboost` | 35 | 25 | −10 | −29% | нет |
| Model Comparison | нет отдельного урока (кейс `case.classic-ml.tree-ensemble-choice` + сцены «Сравнение»/«Практический tuning order» внутри урока CatBoost) | `concept.ml.xgboost-lightgbm-and-catboost` | not recorded | 2 | — | — | источник содержит валидный Markdown-список; рендер исправлен |

Примечание: значения RF/GB/CatBoost «сейчас» (18/21/25) измерены после уточнения
правил поглощения intro/explanation (сцена «leaks current target…» в CatBoost
и аналогичные стали отдельными сценами — это корректно).

## Найденные проблемы (первичный аудит)

### P1. Короткие случайные сцены (1–10 слов) — BLOCKER (исправлено)

**Примеры (все уроки):**

| Урок | Scene | Слов | Содержимое |
|---|---|---|---|
| 07 DT | scene-14 | 1 | `Impurity:` |
| 06 BV | scene-09 | 1 | `то:` |
| 06 BV | scene-16 | 1 | `Тогда:` |
| 08 RF | scene-06 | 1 | `Regression:` |
| 09 GB | scene-11 | 1 | `Тогда:` |
| 10 CB | scene-08 | 1 | `где:` |

**Причина:** `_split_blocks` создаёт отдельный markdown-блок для каждого параграфа.
Короткие строки-переходы между формулами (`то:`, `Тогда:`, `где:`) становились
отдельными сценами.

**Исправление:** `_drain_short_buffer()` перед formula/code, `_consume_prev_short_text`
смотрит только соседний блок, `_consume_next_short_text` не поглощает текст,
который является intro следующей формулы/кода. Короткие сцены сливаются
с ближайшей содержательной сценой.

**Область:** parser (`build_source_scenes`).

---

### P2. Заголовок отделён от содержания — BLOCKER (исправлено)

**Примеры:**

- **07 DT:** title="Split gain", content="Для node с $n$ objects:" (5 слов)
  → реальное объяснение было в другой сцене.
- **06 BV:** title="L2 / Ridge", content="### Gaussian prior → MAP Если:" (6 слов).

**Исправление:** заголовок + короткий вводный текст + формула/код образуют
одну композицию; `display_title` показывает смысловой заголовок сцены.

**Область:** parser.

---

### P3. Дублирование текста между formula.explanation и markdown-сценой — BLOCKER (исправлено)

**Пример (07 DT):**
- formula scene explanation: "$I$ — impurity или loss внутри node. …"
- отдельная markdown-сцена с тем же текстом.

**Причина:** `_next_short_text()` читал следующий блок, но **не удалял его**.

**Исправление:** `_consume_next_short_text()` помечает блок как consumed;
дубликат больше не создаётся.

**Область:** parser.

---

### P4. source_heading не совпадает с реальными заголовками — IMPORTANT (теперь прозрачно)

**Факт:** datapath-сценарии всех уроков содержат `source_heading: "Коротко"`
и `"Интуиция"`. Этих заголовков **нет** в source-заметках.

**Исправление:** добавлены статусы разрешения `exact | normalized | fallback |
missing` (поле `heading_resolution` в Lesson API) и warnings в quality CLI
(`source_heading_fallback` / `source_heading_missing`) с полной диагностикой
(lesson_id, source_content_id, requested/selected heading, `source_path`,
known_alias). Fallback продолжает использовать все секции по порядку — это
осознанное поведение, теперь видимое в аудите.

**Требует правки vault (не выполнено в этой фазе):** обновить `source_heading`
в datapath уроков на реальные H2 (например «Идея за 30 секунд») или добавить
в source-заметки секции «Коротко»/«Интуиция».

**Область:** parser + quality audit.

---

### P5. Список потерял вводный контекст — IMPORTANT (исправлено)

**Пример (10 CB):** "Все реализации наследуют цепочку [[Gradient Boosting]]:"
(6 слов) — введение к code block, становилось отдельной сценой.

**Исправление:** короткий вводный текст перед code block теперь становится
caption/intro кода (поле `caption`).

**Область:** parser.

---

### P6. Code block без caption/intro — COSMETIC (исправлено)

**Пример (09 GB):** code block без caption, хотя перед ним был контекст.

**Исправление:** intro перед кодом попадает в `caption`; caption рендерится
через Markdown/KaTeX (inline-математика работает и в подписях).

**Область:** parser + frontend.

---

### P7. Раздел «Связи» исключается — OK (подтверждено)

Во всех source-заметках раздел «Связи» корректно исключается через
`META_SECTION_TITLES`.

---

### P8. Таблица сравнения — одна сцена, с горизонтальным scroll — COSMETIC (исправлено)

**10 CB:** «Сравнение» — таблица XGBoost/LightGBM/CatBoost в одной сцене.
В `MarkdownContent` таблицы обёрнуты в `overflow-x-auto`.

---

### P9. Пустых сцен не обнаружено — OK

---

### P10. Изображений в MVP-заметках нет — OK

Поддержка изображений понадобится при расширении vault; типы `table` и `visual`
добавлены в модель сцен (backend + TypeScript) и рендерятся через MarkdownScene.

---

### P11. Служебные секции в lesson output — OK

---

### P12. Markdown не ломает layout — COSMETIC (исправлено)

Добавлены: локальный горизонтальный scroll для формул и таблиц, классы
`list-disc`/`list-decimal` для списков (Tailwind v4 preflight сбрасывает
`list-style`), явные `marker:` стили.

---

## Найденные проблемы (таргетированный completion-пас)

### P13. Gain formula: `n_L` / `n_R` опускались на уровень знаменателя — BLOCKER (исправлено)

**Пример (07 DT «Split gain»):**
`\frac{n_L}{n}I(\text{left})` визуально читалось как `n / L`.

**Root cause:** `rehype-sanitize` удалял inline `style`-атрибуты у KaTeX-элементов.
KaTeX позиционирует подстрочные символы и дроби через inline-стили
(`top`, `height`, `margin`); без них `L`/`R` падали на уровень знаменателя.

**Исправление (frontend):** в `MarkdownContent.tsx` разрешены `style` и
`ariaHidden` для `span`/`code` (только KaTeX-генерируемые элементы; `rehypeRaw`
не включён, произвольный HTML/JS по-прежнему не исполняется). Проверено в
браузере: стили присутствуют, подстрочные в числителях, MathML скрыт,
страница без горизонтального overflow.

**Источник корректен** — правка vault не требуется.

**Область:** frontend (sanitize schema).

---

### P14. Сырые `$...$` в explanation — IMPORTANT (исправлено)

**Пример (07 DT):** `Для node с $n$ objects: $I$ — impurity…` отображалось
с сырыми делимитерами.

**Причина:** `FormulaScene.explanation` и `CodeScene.caption` рендерились как
обычный `<p>`, минуя Markdown/KaTeX-пайплайн.

**Исправление:** explanation и caption теперь рендерятся через `MarkdownContent`
(remark-math + rehype-katex); inline-математика работает в обычных сценах,
объяснениях, callouts, списках и подписях. Escaped `\$` остаётся обычным
символом; malformed-формулы не роняют сцену (`throwOnError: false`).

**Область:** frontend (SceneView).

---

### P15. Дублирующиеся заголовки в outline — IMPORTANT (исправлено)

**Пример (07 DT):** «Classification criteria», «Classification criteria»;
(10 CB): несколько одинаковых «LightGBM: histograms и leaf-wise growth».

**Причина:** заголовком сцены был `source_heading` (H2-секция), общий для
нескольких сцен.

**Исправление (backend):** детерминированный `display_title` с приоритетом:
1. H3/H4 внутри сцены; 2. уникальный source_heading; 3. метка формулы
(`\operatorname{Gini}` → Gini) / caption кода / таблицы / visual; 4. локализованная
метка `semantic_role`; 5. первое смысловое предложение; 6. стабильный fallback.
Scene ID, `source_heading`, `semantic_role`, progress совместимость сохранены.
Frontend (`LessonOutline`, `SceneView`) использует `display_title`.

**Область:** backend (`_assign_display_titles`) + frontend.

---

### P16. Списки без маркеров — IMPORTANT (исправлено)

**Пример (10 CB «Сравнение»):** критерии «на одинаковых folds; …» отображались
как обычные строки без маркеров.

**Root cause:** источник содержит валидный Markdown-список; parser и API
сохраняли его корректно. Маркеры терял frontend: Tailwind v4 preflight
устанавливает `list-style: none` для `ul`/`ol`.

**Исправление (frontend):** явные классы `list-disc`/`list-decimal` в
`MarkdownContent`. Проверено в браузере: `list-style-type: disc`, 5 элементов,
вводный текст прикреплён.

**Область:** frontend (MarkdownContent).

---

## Итоговая таблица проблем по приоритету

| # | Проблема | Критичность | Область | Статус |
|---|---|---|---|---|
| P1 | Короткие сцены 1–10 слов | blocker | parser | исправлено |
| P2 | Заголовок отделён от содержания | blocker | parser | исправлено |
| P3 | Дублирование formula.explanation | blocker | parser | исправлено |
| P4 | source_heading не совпадает | important | parser+audit | **исправлено в Phase 6A.1**: «Коротко»→«Идея за 30 секунд» для 12 уроков (→«Цель» для урока 13), «Интуиция»→ближайший H2 в каждой source-заметке; 0 fallback warnings |
| P5 | Вводный текст списка/кода отделён | important | parser | исправлено |
| P6 | Code без caption | cosmetic | parser+frontend | исправлено |
| P8 | Таблица без scroll | cosmetic | frontend | исправлено |
| P12 | Горизонтальный overflow | cosmetic | frontend | исправлено |
| P13 | Gain: n_L/n_R опускались | blocker | frontend (sanitize) | исправлено |
| P14 | Сырые $...$ в explanation | important | frontend | исправлено |
| P15 | Дубли заголовков в outline | important | backend+frontend | исправлено |
| P16 | Списки без маркеров | important | frontend | исправлено |

## Черновики контента

`docs/content-drafts/` содержит **7 файлов** (точное количество). Все интегрированы в Phase 6A.1:

1. `draft-dt-gain-example.md` → `concept.ml.decision-trees` — **integrated** (новый H2 «Пример расчёта Gain» с численным примером Gini и checkpoint);
2. `draft-bv-tree-overfitting.md` → `concept.ml.decision-trees` — **integrated** (интуитивный пример кошка/собака в секции «Почему дерево overfit», ссылка на RF);
3. `draft-rf-variance-reduction.md` → `concept.ml.bagging-and-random-forest` — **integrated** (интуиция с монеткой в секции «Bias и variance»);
4. `draft-gb-step-example.md` → `concept.ml.gradient-boosting` — **integrated** (новый H2 «Пример: 3 шага boosting» с таблицами, квартиры);
5. `draft-cb-categorical-leakage.md` → `concept.ml.xgboost-lightgbm-and-catboost` — **integrated** (пример 6 клиентов с наивным и ordered TS в секции CatBoost);
6. `draft-ensemble-comparison.md` → новый `concept.ml.ensemble-comparison` — **integrated** (создана новая concept-заметка `Ensemble Comparison.md`; standalone lesson НЕ создавался — нет изменений кода);
7. `draft-interview-answers.md` → все 5 concept MVP-маршрута + `concept.ml.ensemble-comparison` — **integrated** (H2 «Ответ для собеседования» в каждой заметке).

Черновики сохранены в `docs/content-drafts/` для истории.

## Качество контента после Phase 6A.1

Content quality CLI (`course.classic-ml`, 13 уроков):

| Метрика | Phase 6A (baseline) | Phase 6A.1 |
|---|---|---|
| Errors | 0 | **0** |
| Warnings | 26 | **0** |
| source_heading fallback | 26 | **0** |
| Suggestions | 48 | **62** |

**Почему suggestions выросли с 48 до 62 (Δ = +14):** аудитор оценивает
присутствие сцен пример/визуализация/код/pitfalls/сравнение в выводе урока.
До Phase 6A.1 `source_heading` был в режиме `fallback` — урок отображал все
секции source-заметки, поэтому многие такие сцены присутствовали, и
диагностических `no_example`/`no_visualization`/… было меньше. После
исправления на точные H2 уроки стали отображать только сконфигурированные
секции, и часть этих диагностик сработала заново. Новый RAG-контент
(численные примеры, interview answers) живёт в concept-заметках и не входит
в сценарный вывод уроков, поэтому lesson-аудитор его не учитывает.

Suggestions — неблокирующие (не дают ненулевой exit code) и лежали вне
таргетированного скоупа Phase 6A.1 (цель — 0 errors / 0 fallback warnings).
Их число специально не возвращали к 48 и не обнуляли.

## Известный некритичный визуальный/контентный долг (не блокирует 6A.1)

- Видимая языковая метка `text` на plain-text code-блоках (косметика рендера).
- Смешение русского и английского в части старого learner-facing материала
  source-заметок (вне скоупа 6A.1; сохраняется для Phase 6B RAG-качества позже).
- Сжатая компоновка маршрута в Atlas (небольшие расстояния между узлами) —
  косметика, без редизайна UI.
