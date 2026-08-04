---
title: Readable Python for Data Work — Practice
type: practice
area: python
status: active
aliases:
  - Читаемый Python для работы с данными
tags:
  - practice/python
  - data/quality
rag: include
id: practice.python.readable-python-for-data-work-practice
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# Readable Python for Data Work — Practice

## Цель

Из списка заказов получить выручку оплаченных заказов по пользователям. Реализация специально использует понятные intermediate steps: её можно прочитать сверху вниз и объяснить без скрытых side effects.

## Вход и ожидаемый результат

```python
orders = [
    {"order_id": 1, "user_id": 10, "status": "paid", "amount": 120.0},
    {"order_id": 2, "user_id": 11, "status": "cancelled", "amount": 80.0},
    {"order_id": 3, "user_id": 10, "status": "paid", "amount": 30.0},
    {"order_id": 4, "user_id": 12, "status": "paid", "amount": 50.0},
]
```

Ожидаем:

```python
{10: 150.0, 12: 50.0}
```

## Прямая реализация

```python
def revenue_by_user(orders):
    result = {}

    for order in orders:
        if order["status"] != "paid":
            continue

        user_id = order["user_id"]
        amount = float(order["amount"])

        previous_revenue = result.get(user_id, 0.0)
        result[user_id] = previous_revenue + amount

    return result


orders = [
    {"order_id": 1, "user_id": 10, "status": "paid", "amount": 120.0},
    {"order_id": 2, "user_id": 11, "status": "cancelled", "amount": 80.0},
    {"order_id": 3, "user_id": 10, "status": "paid", "amount": 30.0},
    {"order_id": 4, "user_id": 12, "status": "paid", "amount": 50.0},
]

revenue = revenue_by_user(orders)
print(revenue)
```

Почему этот код читаем:

- одна function делает одну задачу;
- early `continue` убирает лишнюю вложенность;
- intermediate values названы по смыслу;
- conversion amount выполняется в одном месте;
- function не меняет входной список.

## Проверки и инварианты

```python
assert revenue == {10: 150.0, 12: 50.0}
assert sum(revenue.values()) == 200.0
assert 11 not in revenue
assert orders[0]["amount"] == 120.0
```

Последняя проверка подтверждает отсутствие mutation input.

## Валидация входа

Для учебной задачи лучше сделать assumptions явными, а не прятать `try/except` вокруг всего loop:

```python
def validate_order(order):
    required_fields = {"order_id", "user_id", "status", "amount"}
    missing_fields = required_fields - order.keys()

    if missing_fields:
        raise ValueError(f"Missing fields: {sorted(missing_fields)}")

    if float(order["amount"]) < 0:
        raise ValueError("Amount must be non-negative")
```

Production policy для refund/negative amount может быть другой; validation должна отражать business semantics.

## Advanced только после baseline

`defaultdict`, comprehensions и third-party pipelines могут сократить код, но не должны скрывать grain, filter или aggregation. Оптимизация оправдана после profiling и тестов.

## Типичные ошибки

- одна длинная comprehension одновременно filters, casts и aggregates;
- mutation input objects;
- `except Exception: pass`;
- float equality для сложных monetary calculations без agreed tolerance/decimal policy;
- function зависит от global variable;
- unclear names `d`, `x`, `tmp`.

## Связанные знания

- [[pandas Data Cleaning and Joins — Practice]] — тот же reasoning для tables.
- [[Validation Splits and Data Leakage]] — проверка data pipeline до model.
- [[ML Foundations]] — baseline и ясный prediction contract.
