# DataPath — система прогресса и модель знаний (Фаза 4)

Реализация: `backend/app/services/knowledge_model.py`, `backend/app/services/progress.py`,
`backend/app/db/models.py` (модели), миграция `f4a1b2c3d4e5`.

Вся логика знаний и прогресса — в Python backend. Frontend только отправляет
события и отображает готовые данные API.

## Таблицы прогресса

| Таблица | Назначение |
|---|---|
| `learning_events` | Неизменяемый журнал фактов обучения (append-only), `dedup_key` уникален |
| `skill_assessments` | Текущее агрегированное состояние навыка: `axes` JSON (alpha/beta/score/evidence_count по осям), `confidence`, `evidence_count`, `state` |
| `lesson_progress` | Прогресс урока: `current_scene_id`, `completed_scenes`, `started_at`, `completed_at` |
| `lab_attempts` | Сохранённый результат лаборатории (идемпотентно, `dedup_key` = hash параметров) |
| `case_attempts` | Одна попытка кейса: `mode`, `answers`, `result` |

JSON-поля используют `MutableDict`/`MutableList` для корректного отслеживания
изменений SQLAlchemy.

## Типы learning events

| event_type | Источник | Что означает |
|---|---|---|
| `scene_complete` | lesson | Сцена просмотрена; минимальный сигнал по теории |
| `lesson_complete` | lesson | Урок завершён; умеренный сигнал по теории, без высокой оценки |
| `lab_recorded` | lab | Результат лаборатории сохранён; сильнее влияет на apply/interpret |
| `case_mini` | case | Мини-кейс; интегративный сигнал (вес 1.5) |
| `case_module` | case | Итоговый кейс; самый сильный смешанный сигнал (вес 2.0) |
| `checkpoint` | lesson | Самопроверка; слабый сигнал по теории |
| `review_answer` | review | Ответ на повторение (Фаза 5); оси/веса задаёт шаблон — см. `docs/review-system.md` |

Каждое событие хранит: `source_type/source_id`, `skill_id`, `knowledge_axis`,
`outcome`, `score`, `hints_used`, `attempts`, `error_code`, `metadata`.

## Правила deduplication

- `learning_events.dedup_key` уникален; повторная запись возвращает существующее
  событие и **не начисляет evidence повторно**.
- Сцена: `scene:{lesson_id}:{scene_id}`.
- Урок: `lesson_complete:{lesson_id}:{skill_id}`.
- Лаборатория: `lab:{lab_id}:{skill_id}:{hash(parameters+score)}`.
- Кейс: `case:{case_id}:{mode}:{hash(answers)}:{skill_id}` (повторная отправка
  того же набора ответов не начисляет evidence, но попытка сохраняется).

## Оси модели знаний

7 осей из docs/knowledge-model.md: `theory, reproduce, apply, code, interpret,
explain, interview`. Не каждый навык требует всех осей — обновляются только оси
политики события.

## Веса evidence

Политика `EVIDENCE_POLICY` в `knowledge_model.py`: какое событие какие оси
обновляет и с каким весом при success = 1.0.

| Событие | Оси (вес) |
|---|---|
| `checkpoint` | theory 0.2 |
| `scene_complete` | theory 0.15 |
| `lesson_complete` | theory 0.3 |
| `lab_recorded` | apply 1.0, interpret 1.0, theory 0.3 |
| `case_mini` | apply 1.5, interpret 1.5, theory 0.75 |
| `case_module` | apply 2.0, interpret 2.0, explain 1.0, theory 1.0 |

Модификаторы:
- подсказка (`hints_used > 0`): вес × 0.4;
- повторные попытки без успеха (`attempts > 1` и `success < 1`): вес × 0.6.

## Состояния навыка

Определяются по совокупности осей и числу evidence (`compute_state`):

| State | Условие |
|---|---|
| `not_started` | Нет измерений |
| `exploring` | Идёт изучение (есть evidence, средняя оценка < 0.5) |
| `developing` | ≥ 2 измерений, средняя оценка ≥ 0.5 |
| `strong` | ≥ 3 измерений, средняя оценка ≥ 0.75 |
| `needs_attention` | Повторяющиеся ошибки (≥ 2 одного типа) или низкая оценка (< 0.45) при ≥ 2 измерениях |

Слабые темы (`is_weak_skill`): только при `evidence_count >= 2` и средней оценке
< 0.6 или повторяющихся ошибках. При недостатке данных API возвращает пустой
список — никакой фиктивной аналитики.

## Правила Today

1. При наличии просроченных или due reviews — главное действие — короткая
   review-сессия (карточка повторений); незавершённый урок остаётся доступен
   как второе действие.
2. Сначала продолжить незавершённый урок (`continue_lesson`).
3. Затем следующий урок маршрута (`next_lesson`).
4. Слабые темы (`weak_skills`, до 3) — только при достаточном evidence.
5. При отсутствии данных — стартовый сценарий «Начните с первого урока».

Очередь повторений создаётся лениво и идемпотентно из существующего прогресса
(Фаза 5); новый пользователь без learning evidence не получает фиктивных
повторений. Подробности — `docs/review-system.md`.

## Интеграция Focus / Lab / Atlas

- **Focus**: при открытии урока GET `/api/progress/lessons/{id}` восстанавливает
  последнюю сцену; навигация отправляет POST scene complete; кнопка «Завершить
  урок» вызывает POST lesson complete.
- **Lab**: после расчёта кнопка «Сохранить результат в прогресс» вызывает POST
  `/api/progress/labs/{id}/record`; повторная отправка идемпотентна.
- **Atlas**: `AtlasBuilder` агрегирует состояния связанных навыков и прогресса
  уроков в состояние узла (`not_started/exploring/developing/strong/needs_attention`);
  course/module агрегируют дочерние уроки.

## Известные ограничения

- Один локальный пользователь: нет авторизации и облачной синхронизации.
- Свободный текст не оценивается (Фаза 6); кейсы и повторения используют только
  структурированные ответы (reveal_and_rate — слабая самооценка без
  объективной проверки).
- Интервальное повторение реализовано в Фазе 5 — `docs/review-system.md`.
