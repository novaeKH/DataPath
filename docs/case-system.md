# DataPath — система кейсов (Фаза 4)

Реализация: `backend/app/services/cases/` (registry, service), API
`backend/app/api/cases.py`.

Кейсы — структурированные практические задания на проверку навыков. Оценка
детерминированная, **без AI-оценки свободного текста**: только правила и
сравнение ответов.

## CaseRegistry

`CaseRegistry` — единая расширяемая точка регистрации кейсов (по аналогии с
`LabRegistry`):

- `register(case)` / `get(case_id)` / `ids()`;
- `spec(case_id, mode)` — спецификация для UI без правильных ответов;
- `evaluate(case_id, answers, mode)` — проверка и результат.

По умолчанию зарегистрированы два кейса (`DEFAULT_CASE_REGISTRY`).

## Связь с content ID

Контент vault остаётся каноническим описанием кейса (заметки
`05 Курсы/Классический ML/Кейсы/...`). Исполняемая структура (вопросы, варианты,
правильные ответы, объяснения, подсказки) задана в Python-реестре. Каждый кейс
содержит `content_id`, совпадающий с content ID заметки vault:

| case_id | content_id | practice_kind |
|---|---|---|
| `case.classic-ml.tree-ensemble-choice` | Мини-кейс «Выбор ансамбля для оттока» | mini-case |
| `case.classic-ml.churn-end-to-end` | Итоговый кейс «Churn end-to-end» | module-case |

Vault **не изменяется** приложением.

## Типы вопросов

| Тип | Ответ | Проверка |
|---|---|---|
| `single` | индекс варианта | точное совпадение с `correct` |
| `multiple` | список индексов | полное совпадение набора → 1.0; правильное подмножество → 0.5 |
| `numeric` | число | |ответ − correct| ≤ tolerance |
| `select` | индекс варианта (выбор параметра/модели) | как `single` |
| `order` | список индексов в порядке | доля позиций на месте |

Каждый вопрос имеет `weight` (по умолчанию 1.0), `topic` (семантическая
категория для error_taxonomy), `explanation` и опциональный `hint`.

## Режимы

| Режим | Поведение |
|---|---|
| `guided` | подсказки по шагам (`hint` в спецификации) и подробная обратная связь |
| `standard` | без промежуточных подсказок |
| `interview` | краткая формулировка (`interview_prompt`) и итоговый разбор |

Недопустимый режим возвращает 422.

## Проверка ответов и результат

`Case.evaluate(answers, mode)`:

- по каждому вопросу — score 0..1, флаг `correct`, объяснение;
- итоговый `total_score` — взвешенное среднее по вопросам;
- `passed = total_score >= 0.7`;
- `error_codes` — коды error_taxonomy для неправильных вопросов
  (по `topic`: overfitting/data → `wrong_validation`, metrics →
  `metric_mismatch`, apply → `wrong_assumption`, theory →
  `missing_definition`).

## Сохранение попыток и evidence

`CaseService.submit(case_id, mode, answers)`:

1. валидация режима и кейса;
2. `case.evaluate` → результат;
3. сохранение `case_attempts` (mode, answers, result, completed_at);
4. evidence по всем `skill_ids` кейса через `KnowledgeModelService`:
   - mini-case → `case_mini` (вес 1.5);
   - module-case → `case_module` (вес 2.0);
   - `success = total_score`;
   - dedup по `hash(answers)`: повторная отправка тех же ответов не начисляет
     evidence повторно, но попытка сохраняется.

API:

- `GET /api/cases` — список (по режиму);
- `GET /api/cases/{case_id}?mode=guided|standard|interview` — спецификация;
- `POST /api/cases/{case_id}/submit` — проверка + попытка + evidence;
- `GET /api/cases/{case_id}/attempts` — история попыток.

## Как добавить новый кейс

1. Создать заметку кейса в vault (тип `practice`, `app: include`, `skill_ids`,
   `practice_kind`).
2. Добавить класс-фабрику в `backend/app/services/cases/registry.py`:
   - `Case` с `id`, `content_id`, `lesson_ids`, `skill_ids`, вопросами;
   - вопросы — `CaseQuestion(id, type, prompt, options, correct, ...)`.
3. Зарегистрировать в `get_default_registry()`.
4. Тесты: `backend/tests/test_cases_api.py`.

## Известные ограничения

- Только структурированные ответы; свободный текст не оценивается (Фаза 6).
- Нет режима real-world (требует отдельной логики; остаётся на будущую версию).
- Один локальный пользователь.
