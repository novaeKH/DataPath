---
type: interview
area: career
status: active
tags: [interview, sql]
title: "SQL — Interview"
id: interview.career.sql-interview
schema_version: 2
language: ru
rag: include
rag_collection: interview
app: source
---
# SQL — Interview

Полная теория: [[SQL for Interviews]]  
Банк вопросов: [[Вопросы к собеседованию#14 SQL]]

## Каков логический порядок выполнения SELECT?

`FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`. Поэтому alias из SELECT обычно недоступен в WHERE, а window functions фильтруют во внешнем запросе/`QUALIFY`, если dialect поддерживает.

## WHERE vs HAVING

WHERE фильтрует строки до aggregation, HAVING — группы после. Условие по исходным колонкам лучше ставить в WHERE: меньше данных агрегируется и смысл яснее.

## Что делает GROUP BY?

Формирует группы по key и возвращает одну строку на комбинацию keys после aggregation. Каждый выбранный non-aggregated column должен функционально зависеть от group keys; иначе результат запрещён или неоднозначен в lax dialect.

## Как SQL работает с NULL?

Сравнение с NULL даёт UNKNOWN, поэтому нужен `IS NULL`. `COUNT(col)` игнорирует NULL, `COUNT(*)` считает строки. `NOT IN` с NULL может вернуть неожиданный пустой результат; надёжнее `NOT EXISTS`.

## INNER vs LEFT JOIN

INNER оставляет совпавшие пары, LEFT сохраняет все строки слева и ставит NULL без match. Условие по правой таблице в WHERE после LEFT JOIN может фактически превратить его в INNER; такое условие часто должно быть в ON.

## Почему JOIN размножает строки?

Ключ не уникален на одной или обеих сторонах; many-to-many создаёт все комбинации. До join проверяю grain/uniqueness и считаю rows per key, после — row count и контрольную сумму. `DISTINCT` не является исправлением неверного join.

## Что делает DISTINCT?

Удаляет полные дубли выбранных expressions после SELECT. Это полезно для реальной set semantics, но опасно как маскировка неправильного JOIN. Для уникальных пользователей часто яснее `GROUP BY user_id` или `COUNT(DISTINCT user_id)`.

## Как использовать CASE WHEN?

Создаёт условное значение внутри SELECT/aggregate/order. Порядок ветвей важен: срабатывает первая истинная. Для conditional aggregation типичен `SUM(CASE WHEN condition THEN 1 ELSE 0 END)`.

## GROUP BY vs window function

GROUP BY сворачивает строки. Window сохраняет каждую строку и считает значение по partition/order/frame, поэтому подходит для rank, cumulative sum, доли от группы и сравнения с предыдущей строкой.

## Что делает PARTITION BY?

Разделяет строки на независимые окна, не схлопывая их. `ORDER BY` задаёт порядок внутри partition, а frame — какие соседние строки входят в расчёт. Без PARTITION вся таблица — одно окно.

## Как посчитать running sum?

`SUM(value) OVER (PARTITION BY key ORDER BY ts, tie_breaker ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. Явный `ROWS` избегает неожиданностей `RANGE` при одинаковых датах; порядок должен быть детерминирован.
## ROW_NUMBER vs RANK vs DENSE_RANK

ROW_NUMBER даёт уникальный порядковый номер даже при tie. RANK оставляет пропуски после ties: 1,1,3. DENSE_RANK — без пропусков: 1,1,2. Для top-N нужно заранее определить семантику ties.

## LAG и LEAD

Возвращают значение предыдущей/следующей строки в window order. Используются для интервалов, retention и изменений; без полного детерминированного ORDER BY результат неоднозначен.

## Как найти top-N в каждой группе?

Посчитать `ROW_NUMBER()` или `DENSE_RANK()` over `(PARTITION BY group ORDER BY metric DESC, tie_breaker)` в CTE, затем отфильтровать `rank <= N`. Выбор функции определяет поведение ties.

## CTE vs subquery

Чаще различаются читаемостью и повторным использованием, а optimizer может построить тот же plan. Recursive CTE — отдельная возможность. Производительность проверяют `EXPLAIN`, не угадывают по синтаксису.

## `COUNT(*)`, `COUNT(col)` и `COUNT(DISTINCT col)`

Первый считает строки, второй — non-NULL значения, третий — уникальные non-NULL значения. После join их различие особенно важно: дубли могут завысить counts.

## Как посчитать retention?

Определяю cohort date первого события, activity period и единицу пользователя; deduplicate user-period. Join activity с cohort, вычисляю period index, затем `active_users/cohort_size`. Важны календарные границы, timezone и неполные правые периоды.

## Как решать SQL-задачу на интервью?

Сначала произношу grain входов и результата, ключи, дубли, NULL и ties. Пишу CTE по этапам, проверяю toy example, затем обсуждаю indexes/partition pruning и corner cases. Пример практики: Olist-задачи из внешнего проекта подготовки.
