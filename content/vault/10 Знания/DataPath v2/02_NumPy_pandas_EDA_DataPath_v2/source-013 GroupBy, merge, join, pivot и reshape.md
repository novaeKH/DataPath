---
title: "GroupBy, merge, join, pivot и reshape"
id: concept.datapath-v2.013
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 13
canonical_course: "NumPy / pandas / EDA"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# GroupBy, merge, join, pivot и reshape

Большинство табличных ML-задач требуют соединить сущности разных гранулярностей: один клиент и много транзакций. Ошибка cardinality в merge способна незаметно размножить строки и сломать target.

## GroupBy: split-apply-combine

`groupby(...).agg(...)` уменьшает число строк до групп. Named aggregation делает feature table читаемой. `size` считает строки, `count` — non-null значения выбранной колонки.

## `agg` vs `transform`

`agg` редуцирует группу; `transform` возвращает результат той же длины, выровненный к исходным строкам. Поэтому transform удобен для group mean feature на event-level table.

## Cardinality merge

Перед merge назовите relation: one-to-one, one-to-many, many-to-one, many-to-many. Параметр `validate=` ловит многие accidental explosions.

## Left/inner semantics

Left join сохраняет population слева; inner silently удаляет unmatched entities. Выбор join — бизнес-решение.

## Pivot/reshape

`pivot` требует уникальную комбинацию index/column; `pivot_table` умеет агрегировать duplicates. `melt` переводит wide→long.

## Time leakage

Агрегация `sum(all transactions)` невалидна, если часть transactions произошла после prediction cutoff. Сначала temporal filter, потом groupby.

## Практический код

Перед кодом разберём один поток данных. Есть таблица заказов, где одна строка — один заказ, и таблица клиентов, где `client_id` уникален. Сначала проверяем гранулярность обеих таблиц. Затем `merge(..., validate="many_to_one")` явно фиксирует ожидание: многим заказам соответствует один клиент. Если в справочнике клиентов ключ продублирован, операция завершится ошибкой вместо незаметного размножения выручки.

После объединения можно сгруппировать строки по городу и месяцу. `groupby` делит таблицу на группы, агрегирующая функция сворачивает каждую группу, а результат снова собирается в таблицу. Число строк меняется предсказуемо: одна строка на каждую уникальную пару `(city, month)`. Проверка суммы выручки до и после агрегации помогает заметить потерю или дублирование данных.

`pivot_table` меняет представление того же результата: месяцы могут стать колонками, города — строками. Новых фактов при этом не появляется. `melt` выполняет обратный переход к длинному формату, который обычно удобнее для графиков и групповых операций. Так `merge`, `groupby` и reshape образуют последовательность, а не набор несвязанных методов: сначала присоединяем необходимые признаки, затем считаем показатель на нужной гранулярности и только потом выбираем форму отчёта.

```python
agg = transactions.groupby("client_id").agg(
    tx_count=("amount", "size"),
    tx_sum=("amount", "sum"),
    tx_mean=("amount", "mean"),
).reset_index()

result = clients.merge(
    agg,
    on="client_id",
    how="left",
    validate="one_to_one",
)

result["tx_count"] = result["tx_count"].fillna(0)
result["tx_sum"] = result["tx_sum"].fillna(0)
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- путать `count` и `size`
- ждать от `transform` уменьшения строк
- делать many-to-many merge случайно
- использовать inner join и терять population
- агрегировать future events

## Проверка понимания

1. Что делает `agg`?
2. `count` vs `size`?
3. `transform`?
4. Почему many-to-many размножает строки?
5. Зачем `validate=`?
6. Почему temporal filter должен быть до aggregation?

## Мини-практика

Создайте features клиентов на cutoff: count/sum/mean transactions за 30 дней. Все clients должны остаться, а future transactions не должны участвовать.

## Что нужно унести

Главные идеи: гранулярность, cardinality и prediction-time correctness. Syntax `groupby/merge` вторичен относительно этих трёх вопросов.

## Куда дальше

Следующий урок — time series/event windows: `shift`, rolling и time-aware features.
