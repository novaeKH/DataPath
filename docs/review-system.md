# DataPath — система интервального повторения (Фаза 5)

Реализация: `backend/app/services/reviews/` (`registry.py`, `templates.py`,
`clock.py`, `scheduler.py`, `queue.py`, `answer.py`), модели
`ReviewItem`/`ReviewAttempt` в `app/db/models.py`, миграция `f5a1b2c3d4e5`,
API `backend/app/api/reviews.py`.

Вся логика повторений — в Python backend: формирование очереди, due items,
проверка структурированных ответов, расчёт интервалов, хранение попыток,
дедупликация, learning events, обновление KnowledgeModelService, приоритет
для Today. Frontend только отображает вопрос, принимает ответ/оценку и
показывает объяснение и следующую дату — никаких расчётов в TypeScript.

## Таблицы

### review_items

Текущее состояние элемента повторения (одна строка на template).

| Колонка | Тип | Назначение |
|---|---|---|
| `id` | INTEGER PK | Идентификатор элемента |
| `template_id` | TEXT UNIQUE | Стабильный ID шаблона; уникален — один шаблон не создаёт несколько активных элементов |
| `primary_skill_id` | TEXT | Основной навык (для evidence и фильтрации) |
| `source_type` | TEXT | `lesson` \| `lab` \| `case` — что активировало элемент |
| `source_id` | TEXT | ID активатора (lesson_id / lab_id / case_id) |
| `stage` | TEXT | `learning` \| `review` \| `relearning` |
| `status` | TEXT | `active` \| `suspended` (completed не требуется архитектурой) |
| `due_at` | TEXT | Следующая дата повторения, ISO-8601 UTC |
| `interval_days` | REAL | Текущий интервал в днях (дробный — минуты/часы тоже) |
| `ease_factor` | REAL | Множитель интервала, диапазон 1.3–2.8 |
| `repetitions` | INTEGER | Число успешных повторений |
| `lapses` | INTEGER | Число сбоев (Again после первого ответа) |
| `last_reviewed_at` | TEXT | Последний ответ (UTC) |
| `created_at` / `updated_at` | TEXT | Служебные даты (UTC) |

### review_attempts

Неизменяемая история ответов (append-only).

| Колонка | Тип | Назначение |
|---|---|---|
| `id` | INTEGER PK | Идентификатор попытки |
| `review_item_id` | INTEGER FK | Ссылка на `review_items.id` (CASCADE) |
| `answer` | JSON | Ответ пользователя (MutableDict) |
| `objective_score` | REAL \| NULL | Объективная оценка 0..1; NULL для reveal_and_rate |
| `is_correct` | BOOLEAN \| NULL | Полностью верно; NULL для reveal_and_rate |
| `user_rating` | TEXT | Оценка пользователя: Again/Hard/Good/Easy |
| `effective_rating` | TEXT | Итоговая оценка после правил (объективность важнее) |
| `hints_used` | INTEGER | Сколько подсказок использовано |
| `response_time_ms` | INTEGER \| NULL | Время ответа, если передаёт frontend |
| `dedup_key` | TEXT UNIQUE | Защита от повторной записи одной отправки |
| `created_at` | TEXT | UTC |

## ReviewTemplateRegistry

Аналог CaseRegistry и LabRegistry: исполняемая структура шаблонов в Python,
контент vault остаётся каноном и не изменяется. Шаблон содержит:

- стабильный `id` (template_id);
- `title`, `prompt`, `question_type`;
- `options` и `answer_spec` (правильный ответ по типу);
- `explanation` (разбор, не копия урока);
- `primary_skill` + `skills` (дополнительные);
- `knowledge_axes` (какие оси обновляет; по умолчанию — mapping по типу);
- `source_content_id` (content ID материала vault);
- `source_lesson_id` (урок, к которому относится повторение);
- `source_type`/`source_id` (активатор: lesson/lab/case);
- `difficulty`, `evidence_weight`, `numeric_tolerance`.

Оценка детерминированная, без LLM и без сравнения свободного текста.

### 15 шаблонов MVP-маршрута (`app/services/reviews/templates.py`)

Маршрут: Decision Tree → Bias/Variance → Random Forest → Gradient Boosting →
CatBoost → сравнение моделей. Все ID существуют в vault/реестрах.

| template_id | Тип | Активатор | Навык |
|---|---|---|---|
| `rev.dt.split-gain` | single_choice | lab `decision-tree-split-lab` | ml.tree_ensembles |
| `rev.dt.overfit-sign` | error_diagnosis | lesson `lesson.classic-ml.trees.tree` | ml.tree_ensembles |
| `rev.bv.bias-variance` | single_choice | lesson `lesson.classic-ml.linear.regularization` | ml.bias_variance_regularization |
| `rev.bv.regularization-effect` | parameter_selection | lesson `lesson.classic-ml.linear.regularization` | ml.bias_variance_regularization |
| `rev.bv.depth-curve` | single_choice | lesson `lesson.classic-ml.linear.regularization` | ml.bias_variance_regularization |
| `rev.rf.steps` | ordering | lesson `lesson.classic-ml.trees.forest` | ml.tree_ensembles |
| `rev.rf.bagging-vs-boosting` | single_choice | lesson `lesson.classic-ml.trees.forest` | ml.tree_ensembles |
| `rev.rf.explain-bagging` | reveal_and_rate | lesson `lesson.classic-ml.trees.forest` | ml.bias_variance_regularization |
| `rev.gb.learning-rate` | parameter_selection | lab `ensemble-comparison-lab` | ml.tree_ensembles |
| `rev.gb.residuals` | single_choice | lesson `lesson.classic-ml.trees.boosting` | ml.tree_ensembles |
| `rev.gb.too-many-iters` | error_diagnosis | lesson `lesson.classic-ml.trees.boosting` | ml.error_analysis |
| `rev.cb.categorical-native` | single_choice | lesson `lesson.classic-ml.trees.libraries` | ml.tree_ensembles |
| `rev.cb.error-diagnosis` | error_diagnosis | lesson `lesson.classic-ml.trees.libraries` | ml.tree_ensembles |
| `rev.cmp.model-choice-biz` | single_choice | case `case.classic-ml.tree-ensemble-choice` | ml.tree_ensembles |
| `rev.cmp.roc-diff` | numeric | lab `ensemble-comparison-lab` | ml.error_analysis |

## Типы вопросов

| Тип | Ввод | Оценка |
|---|---|---|
| `single_choice` | один индекс | 1.0 при совпадении, иначе 0.0 |
| `multiple_choice` | список индексов | 1.0 точный набор; 0.5 непустое подмножество; иначе 0.0 |
| `ordering` | список индексов | доля позиций на месте (n из N) |
| `numeric` | число | 1.0 при |answer − correct| ≤ tolerance |
| `parameter_selection` | один индекс | как single_choice |
| `error_diagnosis` | один индекс | как single_choice (распознать ошибочное объяснение) |
| `reveal_and_rate` | свободный текст | **не проверяется объективно**; только слабое evidence |

Свободный текст никогда не оценивается совпадением строк.

## Bootstrap очереди

Ленивый и идемпотентный: вызывается на первом запросе `GET /api/reviews/*`
или `GET /api/today`. По существующему прогрессу Фазы 4 создаются
отсутствующие review items:

- **lesson**: `lesson_progress.completed_at` не NULL → шаблоны
  `source_type=lesson` с `source_id=lesson_id`;
- **lab**: `lab_attempts` со `score >= 0.6` → шаблоны `source_type=lab`;
- **case**: есть `case_attempts` → шаблоны `source_type=case`.

Свойства:

- новый элемент due сразу (due_at = now), stage = `learning`;
- незавершённый урок не ставит материал в очередь;
- слабая лаборатория (score < 0.6) не активирует;
- один template → один активный item (UNIQUE template_id);
- повторные вызовы ничего не создают; старые learning events не изменяются;
- у нового пользователя без evidence повторений нет (никаких фиктивных).

## Scheduler (SM-2-like)

`ReviewSchedulerService` (`scheduler.py`) — детерминированный, время через
`ReviewClock` (тесты фиксируют `now`).

### Первый ответ (repetitions == 0)

| Оценка | Интервал | Stage |
|---|---|---|
| Again | ~10 минут | relearning |
| Hard | 1 день | review |
| Good | 3 дня | review |
| Easy | 7 дней | review |

### Последующие ответы

- **Again**: lapses += 1, ease −0.2, интервал ~10 минут, stage = relearning
  (модель знаний не обнуляется);
- **Hard**: интервал ×1.2, ease −0.15; relearning остаётся relearning;
- **Good**: интервал × ease; stage = review;
- **Easy**: интервал × ease × 1.3, ease +0.1; stage = review.

### Ограничения

- ease factor в [1.3, 2.8];
- interval_days ≥ 0, верхний предел 365 дней;
- просроченный ответ не ошибка;
- skip не считается неправильным ответом;
- повторная HTTP-отправка не создаёт вторую попытку (dedup_key);
- пользователь не может поставить Easy неправильному ответу.

## objective_score и effective_rating

`objective_score` считает `ReviewTemplate.evaluate()` (детерминированно).
`effective_rating` — правило в `ReviewAnswerService._effective_rating`:

- объективно неправильный ответ → **Again** (независимо от user_rating);
- частично правильный (0 < score < 1) → **не выше Hard**;
- полностью правильный → допустимая пользовательская оценка;
- reveal_and_rate → пользовательская оценка (объективной проверки нет).

## Deduplication

- `review_attempts.dedup_key` уникален; повторный submit с тем же ключом
  возвращает существующую попытку с `deduplicated: true` и **не начисляет
  evidence повторно**;
- learning event на ось имеет ключ `review:{item_id}:{attempt_id}:{axis}` —
  повторная отправка не создаёт дубликатов в журнале;
- frontend генерирует dedup_key на элемент и переиспользует его при
  повторном клике; после «ответить ещё раз» ключ обновляется.

## Интеграция с семью осями Knowledge Model

Ответ создаёт learning event (`event_type = review_answer`) и обновляет
существующий `KnowledgeModelService` — второй модели mastery нет.

Mapping типов → оси (`DEFAULT_AXES_BY_TYPE`, шаблон может переопределить):

| Тип | Ось (вес при success=1) |
|---|---|
| single_choice | theory 0.5 |
| multiple_choice | theory 0.5 |
| ordering | apply 0.6 |
| numeric | apply 0.6 |
| parameter_selection | apply 0.6 |
| error_diagnosis | interpret 0.6 |
| reveal_and_rate | theory 0.15 (слабое evidence) |

Вес evidence = `evidence_weight × axis_weight × modifiers`:

- правильный ответ после реального интервала (prev interval ≥ 1 дня) —
  полный вес;
- немедленный повтор (prev interval < 1 дня) — ×0.5;
- hints_used > 0 — ×0.4;
- успех по effective rating: Again 0.15 (умеренно снижает ось, одна ошибка
  не обнуляет навык), Hard 0.6 (слабее Good), Good 0.85, Easy 1.0
  (не мгновенный strong — байесовское обновление);
- reveal_and_rate: потолок success 0.6 — самооценка не даёт сильный mastery;
- `state` и weak skills продолжают вычисляться только KnowledgeModelService.

## Приоритет очереди и дневной лимит

`GET /api/reviews/queue` возвращает элементы в порядке:

1. overdue + needs_attention (достаточное evidence — состояние навыка это
   гарантирует);
2. overdue;
3. due today;
4. более низкая confidence;
5. более ранний due_at.

Слабые темы без достаточного evidence не получают приоритет
(needs_attention возможен только при evidence ≥ 2).

- дневной лимит по умолчанию 10; параметр `limit` в диапазоне 1–30
  (clamp на сервере);
- фильтры `skill_id`, `lesson_id`;
- при отсутствии due: `due_count = 0`, `next_due_at`, рекомендация
  «на сегодня всё» (или «пройдите уроки», если элементов ещё нет);
- answer key не возвращается ни в queue, ни в GET item.

## Skip

`POST /api/reviews/{id}/skip`:

- не создаёт отрицательного evidence;
- не увеличивает lapses;
- не меняет расписание (элемент остаётся due);
- не используется для искусственного улучшения расписания.

## UTC и IANA timezone

- все timestamps хранятся в UTC (ISO-8601, `timespec=seconds`);
- границы «сегодня» вычисляются в IANA timezone из настроек
  (`Settings.timezone`, по умолчанию `Europe/Moscow`, env
  `DATAPATH_TIMEZONE`) через `ReviewClock.day_bounds`;
- алгоритм не зависит от timezone контейнера;
- тесты используют фиксированное время (`ReviewClock.freeze`) и не зависят
  от системных часов.

## API

- `GET /api/reviews/summary` — due_count, overdue_count, completed_today,
  next_due_at, active_items, распределение по stage, рекомендация;
  опциональный `lesson_id`;
- `GET /api/reviews/queue?limit=&skill_id=&lesson_id=` — очередь без
  правильных ответов;
- `GET /api/reviews/{id}` — prompt, question type, options, source metadata,
  безопасное scheduling metadata; **без answer key**;
- `POST /api/reviews/{id}/submit` — {answer, user_rating, hints_used,
  response_time_ms, dedup_key} → objective_score, is_correct,
  effective_rating, explanation, правильный ответ, interval, next_due_at,
  stage, knowledge impact, deduplicated;
- `POST /api/reviews/{id}/skip`;
- `GET /api/reviews/history?limit=` — краткая история.

Обработка ошибок: неизвестный ID → 404; suspended → 409; неверный тип
ответа / недопустимая оценка / вне диапазона → 422; answer key не
раскрывается до отправки ответа. Абсолютные пути не принимаются и не
возвращаются.

## Today, Focus и Atlas

- **Today** (`GET /api/today`): добавляются `review_summary`,
  `due_reviews`, `overdue_reviews`, `next_review_at`, `review_action`.
  Приоритет главного действия: due/overdue reviews → короткая review-сессия;
  незавершённый урок остаётся доступен как второе действие. Для нового
  пользователя без evidence reviews не создаются.
- **Focus**: ссылка «Повторить тему (N)» при наличии активных review items
  для урока (число через `summary?lesson_id=`); после завершения урока —
  спокойное уведомление «материал добавлен в расписание повторений».
- **Atlas**: узлы уроков получают `review_due`/`review_due_count` из
  реальных просроченных повторений; frontend показывает небольшой amber
  индикатор. Режим «К повторению» не добавлен — данные due state
  реальные, архитектура Atlas не меняется.

## Добавление нового review template

1. Добавить `ReviewTemplate` в `backend/app/services/reviews/templates.py`
   (или отдельный модуль-фабрику).
2. Указать реальные `source_content_id`, `source_lesson_id`, `primary_skill`
   и активатор (`source_type`/`source_id`) — ID должны существовать в
   vault/реестрах.
3. Зарегистрировать в `get_default_registry()`.
4. Для нового типа вопроса — реализовать `evaluate` и UI-ветку в
   `ReviewView.AnswerInputView`.
5. Тесты: `backend/tests/test_reviews.py` (bootstrap, submit, интервалы).

## Известные ограничения

- Один локальный пользователь: нет авторизации и облачной синхронизации.
- Оценка только структурированных ответов; свободный текст не оценивается
  (AI-оценка — Фаза 6); reveal_and_rate даёт только слабое evidence.
- Дневная граница — единственное использование timezone; все хранение в UTC.
- `completed` статус не используется (не требуется архитектурой).
- Boost/streak/achievements/notifications отсутствуют намеренно.
- Scheduler — прозрачный упрощённый SM-2-like, не претендует на точную
  модель забывания.
