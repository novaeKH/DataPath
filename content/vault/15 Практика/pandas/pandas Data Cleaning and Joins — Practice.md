---
title: pandas Data Cleaning and Joins — Practice
type: practice
area: pandas
status: active
aliases:
  - pandas очистка и объединение данных
tags:
  - practice/pandas
  - data/quality
rag: include
id: practice.pandas.pandas-data-cleaning-and-joins-practice
schema_version: 2
language: ru
rag_collection: practice
app: source
---
# pandas Data Cleaning and Joins — Practice

## Цель

Очистить orders, безопасно присоединить customer segment и посчитать paid revenue по segment. В центре примера — grain, keys и проверки merge, а не короткая method chain.

## Вход

```python
import pandas as pd


orders = pd.DataFrame(
    {
        "order_id": [1, 2, 3, 4],
        "customer_id": [10, 11, 10, 12],
        "status": ["paid", "cancelled", "paid", "paid"],
        "amount": ["120.0", "80.0", "30.0", None],
        "created_at": [
            "2026-07-01",
            "2026-07-02",
            "2026-07-03",
            "2026-07-04",
        ],
    }
)

customers = pd.DataFrame(
    {
        "customer_id": [10, 11, 12],
        "segment": ["business", "consumer", "consumer"],
    }
)
```

Grain:

- `orders`: одна строка — один `order_id`;
- `customers`: одна строка — один `customer_id`.

## Очистка типов

```python
clean_orders = orders.copy()

clean_orders["amount"] = pd.to_numeric(
    clean_orders["amount"],
    errors="coerce",
)

clean_orders["created_at"] = pd.to_datetime(
    clean_orders["created_at"],
    errors="coerce",
)
```

`errors="coerce"` не «исправляет» данные: invalid values становятся missing и должны быть посчитаны.

```python
quality_report = {
    "rows": len(clean_orders),
    "duplicate_order_ids": int(clean_orders["order_id"].duplicated().sum()),
    "missing_amount": int(clean_orders["amount"].isna().sum()),
    "missing_created_at": int(clean_orders["created_at"].isna().sum()),
}

print(quality_report)
```

Ожидаем один missing amount и zero duplicate IDs/dates.

## Явная policy missing amount

В этом учебном примере order без amount исключается из revenue и сохраняется в отдельный reject set:

```python
rejected_orders = clean_orders.loc[
    clean_orders["amount"].isna()
].copy()

valid_orders = clean_orders.loc[
    clean_orders["amount"].notna()
].copy()
```

Заполнять missing amount нулём без business rule опасно: это меняет выручку и число valid orders.

## Безопасный join

```python
enriched_orders = valid_orders.merge(
    customers,
    on="customer_id",
    how="left",
    validate="many_to_one",
    indicator=True,
)
```

`validate="many_to_one"` проверяет, что справа один customer на key. `indicator=True` позволяет увидеть unmatched keys.

```python
unmatched_customers = enriched_orders.loc[
    enriched_orders["_merge"] != "both",
    "customer_id",
].unique()

assert len(unmatched_customers) == 0
```

После проверки technical column удаляется:

```python
enriched_orders = enriched_orders.drop(columns="_merge")
```

## Filter и aggregation

```python
paid_orders = enriched_orders.loc[
    enriched_orders["status"] == "paid"
].copy()

revenue_by_segment = (
    paid_orders
    .groupby("segment", as_index=False, dropna=False)
    .agg(
        paid_revenue=("amount", "sum"),
        paid_orders=("order_id", "nunique"),
    )
    .sort_values("segment")
    .reset_index(drop=True)
)

print(revenue_by_segment)
```

Ожидаемый result:

```text
    segment  paid_revenue  paid_orders
0  business         150.0            2
```

Consumer paid order был rejected из-за missing amount; это должно быть явно отражено в report.

## Проверки и инварианты

```python
assert clean_orders["order_id"].is_unique
assert customers["customer_id"].is_unique
assert len(enriched_orders) == len(valid_orders)
assert rejected_orders["order_id"].tolist() == [4]
assert revenue_by_segment["paid_revenue"].sum() == 150.0
```

## Типичные ошибки

- merge без знания grain и `validate`;
- silently many-to-many row explosion;
- `inplace=True` в длинном pipeline;
- chained assignment;
- fit categories/statistics на train+test;
- `fillna(0)` без business meaning;
- aggregation по row count вместо unique business key.

## Связанные знания

- [[Readable Python for Data Work — Practice]] — тот же прямой control flow.
- [[Universal_Pandas_Data_Work_Pipeline]] — расширенный legacy playbook.
- [[Validation Splits and Data Leakage]] — preprocessing statistics внутри train folds.
