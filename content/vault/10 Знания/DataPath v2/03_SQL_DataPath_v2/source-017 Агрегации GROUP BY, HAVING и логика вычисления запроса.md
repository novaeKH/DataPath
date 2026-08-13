---
title: "Агрегации: GROUP BY, HAVING и логика вычисления запроса"
id: concept.datapath-v2.017
schema_version: 2
type: concept
area: datapath-v2
status: active
language: ru
rag: include
rag_collection: datapath-v2
app: source
canonical_number: 17
canonical_course: "SQL"
source_provenance: "DataPath v2 canonical corpus"
tags:
- datapath/v2
- canonical/source
---

# Агрегации: GROUP BY, HAVING и логика вычисления запроса

`GROUP BY` меняет гранулярность результата. Из миллионов заказов можно получить одну строку на клиента. Это ровно тот же conceptual step, что pandas `groupby`, но выполняемый в базе.

## Агрегаты

`COUNT`, `SUM`, `AVG`, `MIN`, `MAX` сворачивают набор строк. `COUNT(*)` считает строки; `COUNT(column)` — non-NULL значения. Это важное отличие.

## GROUP BY

Все неагрегированные выражения SELECT должны быть согласованы с группировкой. `GROUP BY customer_id` означает: одна output row на customer_id.

## HAVING

`WHERE` фильтрует исходные строки до группировки; `HAVING` — уже сформированные группы. `HAVING COUNT(*) >= 5` нельзя корректно заменить WHERE, потому что count ещё не существует на стадии WHERE.

## COUNT DISTINCT

`COUNT(DISTINCT user_id)` отвечает на число уникальных пользователей, но может быть дорогим на больших данных. Всегда проверяйте, действительно ли нужна уникальность.

## Conditional aggregation

Pattern `SUM(CASE WHEN condition THEN 1 ELSE 0 END)` позволяет считать несколько сегментных метрик одним GROUP BY.

## Практический код

```sql
SELECT
    customer_id,
    COUNT(*) AS order_count,
    COUNT(payment_id) AS paid_rows,
    SUM(amount) AS revenue,
    AVG(amount) AS avg_order
FROM orders
WHERE order_date >= DATE '2026-01-01'
GROUP BY customer_id
HAVING COUNT(*) >= 3;
```

## Интерактивная визуализация DataPath

Визуализация должна показывать механизм пошагово, позволять менять ключевые параметры и связывать результат с тем, что происходит в коде. Она не должна быть статичной декоративной карточкой.

## Типичные ошибки

- путать COUNT(*) и COUNT(column)
- использовать HAVING вместо обычного WHERE без причины
- не замечать смену гранулярности
- считать DISTINCT автоматически
- выбирать неагрегированный столбец, которого нет в GROUP BY

## Проверка понимания

1. COUNT(*) vs COUNT(column)?
2. WHERE vs HAVING?
3. Что означает GROUP BY customer_id для гранулярности?
4. Зачем conditional aggregation?
5. Когда нужен COUNT DISTINCT?

## Мини-практика

Соберите одну строку на клиента: число заказов, общая сумма, число доставленных заказов и доля доставленных. Отфильтруйте только клиентов с минимум 5 заказами.

## Что нужно унести

GROUP BY — оператор смены гранулярности. Всегда называйте ключ группировки и ожидаемое число строк после неё.

## Куда дальше

Дальше — JOIN: как соединять таблицы и не получать неожиданные дубликаты.
