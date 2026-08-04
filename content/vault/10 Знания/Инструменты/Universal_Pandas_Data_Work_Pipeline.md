---
title: Универсальная схема работы с данными в pandas
type: practice
area: pandas
status: deprecated
aliases:
  - Pandas Data Workflow
  - Шаблон pandas
  - Pandas Playbook
tags:
  - pandas
  - python
  - data-analysis
  - data-quality
  - sql
rag: exclude
id: practice.pandas.universal-naia-skhema-raboty-s-dannymi-v-pandas
schema_version: 2
language: ru
app: source
---
# Универсальная схема работы с данными в pandas

> [!info] Legacy playbook
> Начни с [[pandas Data Cleaning and Joins — Practice]]: там один runnable example, grain, merge validation и инварианты. Этот большой справочник сохранён для поиска редких операций, но исключён из основной RAG.

> [!summary] Главная формула
> **Бизнес-вопрос → гранулярность и ключи → загрузка → аудит → очистка → преобразования → объединение → агрегация/окна → проверки → вывод и сохранение.**

Эта заметка покрывает основную часть ежедневных задач аналитика и Data Scientist: загрузку, проверку качества, фильтрацию, объединение таблиц, расчёт метрик, сегментацию, временной анализ и подготовку датасета для модели.

Она не предназначена для заучивания всей библиотеки. Цель — знать **маршрут решения задачи**, основные инструменты и обязательные проверки. Редкие параметры всегда можно открыть в документации.

> [!tip] Как пользоваться заметкой
> Не читать её как длинный курс. Для первой практики достаточно разделов **0, 3, 6, 10, 11, 15 и 19**. Остальные разделы открывать, когда в задаче появляются строки, даты, окна, изменение формы или большой объём данных.

---

## 0. До кода сформулировать задачу

Ответить письменно хотя бы на шесть вопросов:

1. Какой бизнес-вопрос нужно решить?
2. Что означает одна строка исходных данных?
3. Что должна означать одна строка результата?
4. Какой столбец или набор столбцов является ключом?
5. За какой период и для какой выборки считаем результат?
6. В каких единицах измеряется итоговая метрика?

Пример:

```text
Вопрос: какие клиенты больше всего тратили за последние 90 дней?
Исходная гранулярность: одна строка = одна транзакция.
Итоговая гранулярность: одна строка = один клиент.
Ключ результата: client_id.
Период: 2025-10-03 — 2025-12-31 включительно.
Метрика: сумма expense-транзакций в евро.
```

> [!danger] Главная причина неправильных отчётов
> Код может выполняться без ошибок, но отвечать не на тот вопрос: неверный период, неправильный знаменатель, повторяющиеся объекты или размноженные строки после `merge`.

### Три понятия, которые нужно знать

| Понятие | Смысл |
|---|---|
| Гранулярность (grain) | Что представляет одна строка |
| Первичный ключ (primary key) | Столбец или набор столбцов, однозначно определяющий строку |
| Внешний ключ (foreign key) | Столбец, ссылающийся на ключ другой таблицы |

Примеры гранулярности:

- одна строка = клиент;
- одна строка = транзакция;
- одна строка = клиент × месяц;
- одна строка = товар × магазин × день.

---

## 1. Базовая настройка

```python
from pathlib import Path

import numpy as np
import pandas as pd

pd.set_option("display.max_columns", 100)
pd.set_option("display.float_format", "{:.3f}".format)

RANDOM_STATE = 42
```

Проверка версии:

```python
pd.__version__
```

Для путей удобнее использовать `Path`, а не вручную склеивать строки:

```python
DATA_DIR = Path("data")
INPUT_PATH = DATA_DIR / "transactions.csv"
```

---

## 2. Загрузка данных

### CSV

```python
df = pd.read_csv(
    INPUT_PATH,
    usecols=["transaction_id", "client_id", "date", "amount", "status"],
    parse_dates=["date"],
    dtype={
        "transaction_id": "string",
        "client_id": "string",
        "status": "string",
    },
    na_values=["", "NA", "N/A", "null", "unknown"],
)
```

Полезные параметры `read_csv`:

| Параметр | Зачем |
|---|---|
| `sep=";"` | другой разделитель |
| `usecols=[...]` | загрузить только нужные столбцы |
| `dtype={...}` | явно задать типы |
| `parse_dates=[...]` | сразу распознать даты |
| `na_values=[...]` | определить дополнительные обозначения пропусков |
| `encoding="utf-8"` | указать кодировку |
| `decimal=","` | числа с десятичной запятой |
| `chunksize=100_000` | читать большой файл частями |

> [!warning] Идентификатор — не число
> Номер клиента, телефона, счёта или почтовый индекс обычно нужно читать как строку. Иначе могут исчезнуть ведущие нули.

### Excel

```python
df = pd.read_excel(
    DATA_DIR / "report.xlsx",
    sheet_name="Transactions",
    usecols="A:F",
    parse_dates=["date"],
)
```

Все листы сразу:

```python
sheets = pd.read_excel(
    DATA_DIR / "report.xlsx",
    sheet_name=None,
)
```

`sheets` будет словарём: ключ — название листа, значение — `DataFrame`.

### Parquet

```python
df = pd.read_parquet(
    DATA_DIR / "transactions.parquet",
    columns=["client_id", "date", "amount"],
)
```

Parquet обычно удобнее CSV для больших типизированных таблиц: он сохраняет типы и позволяет читать только нужные столбцы.

### SQL

```python
query = """
SELECT
    transaction_id,
    client_id,
    transaction_date,
    amount
FROM transactions
WHERE transaction_date >= :start_date
"""

df = pd.read_sql_query(
    query,
    con=connection,
    params={"start_date": "2025-01-01"},
    parse_dates=["transaction_date"],
)
```

> [!important] Загружать столько, сколько нужно
> Если источник — база данных, фильтрацию строк, выбор столбцов и крупные агрегации чаще выгоднее выполнить в SQL, а в pandas загрузить уже нужный объём.

---

## 3. Первый аудит таблицы

До очистки и расчётов посмотреть структуру данных.

```python
df.shape
df.head()
df.sample(5, random_state=RANDOM_STATE)
df.info()
df.describe(include="all").T
```

### Компактный профиль столбцов

```python
column_report = pd.DataFrame({
    "dtype": df.dtypes.astype(str),
    "missing": df.isna().sum(),
    "missing_pct": df.isna().mean(),
    "unique": df.nunique(dropna=False),
}).sort_values("missing_pct", ascending=False)

display(column_report)
```

### Проверка ключа

Для одного столбца:

```python
KEY = "transaction_id"

df[KEY].isna().sum()
df[KEY].is_unique
df.duplicated(subset=KEY).sum()
```

Для составного ключа:

```python
KEY = ["client_id", "month"]

df.duplicated(subset=KEY).sum()
```

Посмотреть все конфликтующие строки:

```python
duplicates = (
    df.loc[df.duplicated(subset=KEY, keep=False)]
    .sort_values(KEY)
)

display(duplicates)
```

### Быстрый анализ значений

```python
df["status"].value_counts(dropna=False)
df["status"].value_counts(dropna=False, normalize=True)
df["client_id"].nunique()
df.select_dtypes(include="number").describe().T
```

### Минимальный снимок перед преобразованиями

```python
n_rows_raw = len(df)
n_objects_raw = df["client_id"].nunique()
amount_raw = df["amount"].sum()
```

Эти значения помогут заметить случайную потерю или размножение данных.

---

## 4. Приведение схемы и типов

### Нормализация названий столбцов

```python
df = df.rename(
    columns=lambda column: (
        column.strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )
)
```

Точечное переименование:

```python
df = df.rename(columns={
    "cust_id": "client_id",
    "sum": "amount",
})
```

### Числа

```python
df["amount"] = pd.to_numeric(
    df["amount"],
    errors="coerce",
)
```

`errors="coerce"` превращает нераспознанные значения в пропуски. После этого нужно проверить, сколько новых пропусков появилось.

### Даты

```python
df["date"] = pd.to_datetime(
    df["date"],
    errors="coerce",
)
```

Если время приходит из разных часовых поясов:

```python
df["timestamp"] = pd.to_datetime(
    df["timestamp"],
    errors="coerce",
    utc=True,
)
```

### Строки, nullable integer и boolean

```python
df = df.astype({
    "client_id": "string",
    "status": "string",
    "age": "Int64",
    "is_active": "boolean",
})
```

`Int64` и `boolean` с большой буквы — pandas-типы, допускающие пропуски.

Автоматическая попытка подобрать современные nullable-типы:

```python
df = df.convert_dtypes()
```

### Категории

```python
df["status"] = df["status"].astype("category")
```

`category` особенно полезен для повторяющихся строковых значений с небольшой кардинальностью. Но идентификаторы с почти уникальными значениями превращать в категории обычно бессмысленно.

---

## 5. Пропуски, дубликаты и некорректные значения

### Пропуски

Сначала понять смысл пропуска:

| Ситуация | Возможное действие |
|---|---|
| Значение отсутствует из-за ошибки выгрузки | исправить источник или исключить строку с объяснением |
| События не было | иногда заполнить `0` |
| Категория неизвестна | оставить пропуск или создать `"missing"` |
| Число неизвестно | оставить пропуск или заполнить обоснованной статистикой |
| Временной ряд | иногда `ffill`, но только после сортировки и без заглядывания в будущее |

Команды:

```python
df["amount"].isna().sum()

df["amount"] = df["amount"].fillna(0)
df["city"] = df["city"].fillna("missing")

df = df.dropna(subset=["client_id", "date"])
df = df.dropna(thresh=3)
```

Заполнение внутри клиента:

```python
df = df.sort_values(["client_id", "date"])

df["tariff"] = (
    df.groupby("client_id")["tariff"]
    .ffill()
)
```

> [!danger] Нельзя автоматически заменять все пропуски нулями
> Ноль означает известное отсутствие величины, а пропуск — неизвестное значение. Это разные факты.

### Дубликаты

Полностью одинаковые строки:

```python
df.duplicated().sum()
df = df.drop_duplicates()
```

Повторения ключа:

```python
df.duplicated(subset=["transaction_id"]).sum()
```

Оставить последнюю запись по времени:

```python
df = (
    df.sort_values("updated_at")
    .drop_duplicates(subset="transaction_id", keep="last")
)
```

Так делать можно только тогда, когда бизнес-правило действительно требует последнюю версию записи.

### Некорректные значения и выбросы

```python
df["age"].between(18, 100).value_counts(dropna=False)
df["status"].isin(["active", "closed", "overdue"]).value_counts()
df["amount"].quantile([0.01, 0.50, 0.99])
```

Посмотреть подозрительные строки:

```python
invalid_age = df.loc[~df["age"].between(18, 100) & df["age"].notna()]
```

Ограничить значения допустимыми границами:

```python
df["amount_clipped"] = df["amount"].clip(lower=0, upper=100_000)
```

> [!warning] Выброс — не обязательно ошибка
> Крупная транзакция может быть реальным и самым важным наблюдением. Удалять или ограничивать значения нужно по смыслу задачи, а не только по правилу IQR.

---

## 6. Выбор строк и столбцов

### Столбцы

```python
df["amount"]
df[["client_id", "date", "amount"]]
df.select_dtypes(include="number")
df.select_dtypes(include=["string", "category"])
```

### Строки по условию

```python
mask = (
    df["status"].eq("active")
    & df["amount"].gt(0)
    & df["date"].between("2025-01-01", "2025-12-31")
)

active = df.loc[
    mask,
    ["client_id", "date", "amount"],
].copy()
```

Частые условия:

```python
df["city"].eq("Amsterdam")
df["city"].ne("Amsterdam")
df["amount"].gt(100)
df["amount"].ge(100)
df["amount"].lt(100)
df["amount"].le(100)
df["city"].isin(["Amsterdam", "Rotterdam"])
df["amount"].between(100, 500)
df["city"].isna()
df["city"].notna()
```

> [!warning] Условия для Series
> Использовать `&`, `|`, `~` и ставить каждое условие в скобки. Обычные Python-операторы `and`, `or`, `not` для Series не подходят.

### `loc` и `iloc`

```python
# по названиям строк/столбцов
df.loc[df["amount"] > 100, ["client_id", "amount"]]

# по позициям
df.iloc[:10, :3]
```

Изменение по условию:

```python
df.loc[df["amount"] < 0, "has_negative_amount"] = True
```

Не использовать цепочное присваивание:

```python
# Плохо
df[df["amount"] < 0]["has_negative_amount"] = True
```

### Сортировка и Top-N

```python
df = df.sort_values(
    ["client_id", "date"],
    ascending=[True, False],
)

top_10 = df.nlargest(10, "amount")
bottom_10 = df.nsmallest(10, "amount")
```

### Случайная выборка

```python
sample = df.sample(
    n=100,
    random_state=RANDOM_STATE,
)
```

---

## 7. Создание и преобразование признаков

### Арифметика

```python
df["revenue"] = df["price"] * df["quantity"]
df["margin"] = df["revenue"] - df["cost"]
df["margin_pct"] = df["margin"].div(df["revenue"]).replace([np.inf, -np.inf], np.nan)
```

### `assign`

```python
df = df.assign(
    revenue=lambda data: data["price"] * data["quantity"],
    is_large=lambda data: data["revenue"] >= 1_000,
)
```

### Замена и словарь соответствий

```python
status_map = {
    "A": "active",
    "C": "closed",
    "O": "overdue",
}

df["status_name"] = df["status_code"].map(status_map)
df["city"] = df["city"].replace({"A'dam": "Amsterdam"})
```

После `map` проверить значения, которых не было в словаре:

```python
df.loc[df["status_name"].isna(), "status_code"].value_counts(dropna=False)
```

### Условия без построчного цикла

```python
df["risk"] = np.select(
    condlist=[
        df["score"] >= 0.8,
        df["score"] >= 0.5,
    ],
    choicelist=["high", "medium"],
    default="low",
)
```

Два варианта:

```python
df["segment"] = np.where(
    df["amount"] >= 1_000,
    "large",
    "regular",
)
```

Сохранить старое значение или заменить по условию:

```python
df["clean_amount"] = df["amount"].where(df["amount"] >= 0)
df["clean_amount"] = df["amount"].mask(df["amount"] < 0)
```

### Интервалы и квантили

```python
df["age_group"] = pd.cut(
    df["age"],
    bins=[18, 25, 35, 50, 65, np.inf],
    labels=["18-24", "25-34", "35-49", "50-64", "65+"],
    right=False,
)

df["amount_quartile"] = pd.qcut(
    df["amount"],
    q=4,
    labels=False,
    duplicates="drop",
).add(1)
```

### Приоритет способов вычисления

1. Встроенная векторная операция.
2. `map`, `replace`, `np.where`, `np.select`.
3. Методы `.str`, `.dt`, `groupby`, `rolling`.
4. `.apply()` — только если понятного встроенного решения нет.
5. `iterrows()` — почти никогда для преобразования данных.

> [!important] Почему не начинать с `apply`
> Встроенные и векторные операции обычно быстрее, короче и предсказуемее пользовательских функций.

---

## 8. Строки и категории

Перед обработкой текст лучше привести к строковому типу:

```python
df["job"] = df["job"].astype("string")
```

Очистка:

```python
df["job"] = (
    df["job"]
    .str.strip()
    .str.lower()
    .str.replace(r"\s+", "_", regex=True)
)
```

Поиск:

```python
df["email"].str.contains("@", na=False)
df["product"].str.startswith("credit", na=False)
df["code"].str.fullmatch(r"[A-Z]{2}\d{6}", na=False)
```

Извлечение частей:

```python
df[["prefix", "number"]] = df["code"].str.extract(
    r"(?P<prefix>[A-Z]{2})(?P<number>\d{6})"
)
```

Разделение:

```python
df[["first_name", "last_name"]] = df["full_name"].str.split(
    " ",
    n=1,
    expand=True,
)
```

Частоты категорий:

```python
df["job"].value_counts(dropna=False)
df["job"].value_counts(normalize=True, dropna=False)
```

---

## 9. Даты и время

### Компоненты даты

```python
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day"] = df["date"].dt.day
df["day_of_week"] = df["date"].dt.dayofweek
df["quarter"] = df["date"].dt.quarter
df["is_month_end"] = df["date"].dt.is_month_end
df["year_month"] = df["date"].dt.to_period("M")
```

### Разница между датами

```python
reference_date = pd.Timestamp("2025-12-31")

df["days_since_event"] = (
    reference_date - df["event_date"]
).dt.days
```

Возраст на конкретную дату, а не на сегодняшний день:

```python
df["age_approx"] = (
    (reference_date - df["birth_date"]).dt.days // 365.25
).astype("Int64")
```

### Фильтр периода

```python
period = df["date"].between(
    "2025-10-01",
    "2025-12-31",
    inclusive="both",
)

quarter_df = df.loc[period].copy()
```

Для timestamp с временем надёжнее использовать полуинтервал:

```python
period = (
    df["timestamp"].ge("2025-10-01")
    & df["timestamp"].lt("2026-01-01")
)
```

### Агрегация по календарным периодам

```python
monthly = (
    df.groupby(pd.Grouper(key="date", freq="MS"))
    .agg(total_amount=("amount", "sum"))
    .reset_index()
)
```

Или через `resample`:

```python
monthly = (
    df.set_index("date")
    .resample("MS")["amount"]
    .sum()
    .rename("total_amount")
    .reset_index()
)
```

---

## 10. `groupby`: расчёт показателей

Модель мышления: **разделить → вычислить → собрать**.

### Простая агрегация

```python
df.groupby("client_id")["amount"].sum()
```

### Именованная агрегация

```python
client_report = (
    df.groupby(
        "client_id",
        as_index=False,
        dropna=False,
    )
    .agg(
        transactions=("transaction_id", "size"),
        active_days=("date", "nunique"),
        total_amount=("amount", "sum"),
        average_amount=("amount", "mean"),
        median_amount=("amount", "median"),
        last_transaction=("date", "max"),
    )
)
```

### Несколько группирующих столбцов

```python
city_month_report = (
    df.groupby(
        ["city", pd.Grouper(key="date", freq="MS")],
        dropna=False,
    )
    .agg(
        clients=("client_id", "nunique"),
        transactions=("transaction_id", "size"),
        amount=("amount", "sum"),
    )
    .reset_index()
)
```

### Доля как среднее boolean

```python
df["is_success"] = df["status"].eq("success")

segment_report = (
    df.groupby("segment", as_index=False, dropna=False)
    .agg(
        observations=("client_id", "size"),
        clients=("client_id", "nunique"),
        successes=("is_success", "sum"),
        success_rate=("is_success", "mean"),
    )
)
```

Всегда показывать размер группы рядом с долей. Доля `50%` среди двух объектов и среди десяти тысяч объектов имеет разную надёжность.

### `agg`, `transform`, `filter`, `apply`

| Метод | Размер результата | Когда нужен |
|---|---:|---|
| `agg` | обычно меньше строк | получить одну строку на группу |
| `transform` | столько же строк | вернуть групповую статистику в исходные строки |
| `filter` | оставить или убрать целые группы | отобрать группы по условию |
| `apply` | произвольный | сложная логика, не выражаемая встроенными методами |

Пример `transform`:

```python
df["client_total"] = (
    df.groupby("client_id")["amount"]
    .transform("sum")
)

df["share_of_client_total"] = (
    df["amount"] / df["client_total"]
)
```

Количество строк внутри группы:

```python
df["transaction_number"] = (
    df.groupby("client_id")
    .cumcount()
    .add(1)
)
```

Ранг внутри группы:

```python
df["amount_rank"] = (
    df.groupby("client_id")["amount"]
    .rank(method="dense", ascending=False)
)
```

> [!warning] Пропуски в ключе группировки
> По умолчанию строки с пропуском в ключе могут не попасть в группы. Если они должны быть видны, явно указывать `dropna=False`.

---

## 11. Объединение таблиц

До `merge` определить:

1. ключ объединения;
2. уникален ли он слева;
3. уникален ли он справа;
4. какая таблица задаёт набор строк результата;
5. допустимо ли увеличение количества строк.

### Виды связей

| Связь | Пример | `validate` |
|---|---|---|
| один к одному | клиент ↔ одна анкета | `"one_to_one"` |
| многие к одному | счета → клиент | `"many_to_one"` |
| один ко многим | клиент → счета | `"one_to_many"` |
| многие ко многим | товары ↔ акции | `"many_to_many"` |

### Безопасный `left merge`

```python
n_accounts_before = len(accounts)

account_report = accounts.merge(
    clients[["client_id", "city", "job"]],
    on="client_id",
    how="left",
    validate="many_to_one",
    indicator=True,
)

assert len(account_report) == n_accounts_before

account_report["_merge"].value_counts(dropna=False)
```

Проверить несовпавшие строки:

```python
unmatched = account_report.loc[
    account_report["_merge"].ne("both")
]
```

После проверки:

```python
account_report = account_report.drop(columns="_merge")
```

### Как выбрать `how`

| `how` | Что остаётся |
|---|---|
| `left` | все строки левой таблицы |
| `inner` | только совпавшие ключи |
| `right` | все строки правой таблицы |
| `outer` | все ключи из обеих таблиц |

Для обогащения основной таблицы справочником чаще всего нужен `left`.

### Поиск внешних ключей без родителя

```python
orphan_accounts = accounts.loc[
    ~accounts["client_id"].isin(clients["client_id"])
]
```

### Почему размножаются строки

Если один ключ несколько раз встречается и слева, и справа, возникает связь многие-ко-многим. Например, две строки слева × три строки справа дадут шесть строк.

> [!danger] Не отключать `validate`, чтобы merge «заработал»
> Ошибка `validate` часто обнаруживает неверную гранулярность или дубликаты ключа. Сначала выяснить причину, затем исправить данные или осознанно разрешить нужную связь.

### Сначала агрегировать, потом объединять

Если результат должен иметь одну строку на клиента:

```python
transaction_features = (
    transactions.groupby("client_id", as_index=False)
    .agg(
        transaction_count=("transaction_id", "size"),
        total_amount=("amount", "sum"),
    )
)

client_dataset = clients.merge(
    transaction_features,
    on="client_id",
    how="left",
    validate="one_to_one",
)
```

### Разные названия ключей

```python
result = orders.merge(
    clients,
    left_on="customer_id",
    right_on="client_id",
    how="left",
    validate="many_to_one",
)
```

### `concat`: сложить одинаковые таблицы

```python
all_months = pd.concat(
    [january, february, march],
    ignore_index=True,
)
```

Не добавлять таблицы через `concat` по одной в цикле. Сначала собрать их в список, затем выполнить один `concat`.

### Ближайшее событие по времени

```python
events = events.sort_values("event_time")
prices = prices.sort_values("price_time")

result = pd.merge_asof(
    events,
    prices,
    left_on="event_time",
    right_on="price_time",
    by="product_id",
    direction="backward",
)
```

`merge_asof` полезен, когда нужно присоединить последнее известное значение на момент события. Таблицы должны быть правильно отсортированы.

---

## 12. Изменение формы таблицы

### `pivot_table`: сводная таблица

```python
report = pd.pivot_table(
    df,
    index="city",
    columns="status",
    values="amount",
    aggfunc="sum",
    fill_value=0,
    margins=True,
)
```

### `crosstab`: таблица частот или долей

```python
counts = pd.crosstab(
    df["city"],
    df["status"],
    margins=True,
)

shares = pd.crosstab(
    df["city"],
    df["status"],
    normalize="index",
)
```

### `melt`: wide → long

```python
long_df = wide_df.melt(
    id_vars=["client_id"],
    value_vars=["amount_jan", "amount_feb", "amount_mar"],
    var_name="month",
    value_name="amount",
)
```

### `pivot`: long → wide без агрегации

```python
wide_df = long_df.pivot(
    index="client_id",
    columns="month",
    values="amount",
)
```

Если комбинация `index × columns` не уникальна, использовать `pivot_table` и явно выбрать `aggfunc`.

### `explode`: список в отдельные строки

```python
df = df.explode(
    "product_ids",
    ignore_index=True,
)
```

После `explode` количество строк обычно увеличивается — это ожидаемая смена гранулярности.

---

## 13. Предыдущие значения, накопления и скользящие окна

Всегда сначала сортировать данные по объекту и времени:

```python
df = df.sort_values(["client_id", "date"])
```

### Предыдущее значение

```python
df["previous_amount"] = (
    df.groupby("client_id")["amount"]
    .shift(1)
)
```

### Изменение относительно прошлого события

```python
df["amount_change"] = (
    df.groupby("client_id")["amount"]
    .diff()
)

df["amount_growth"] = (
    df.groupby("client_id")["amount"]
    .pct_change(fill_method=None)
)
```

### Накопительный итог

```python
df["cumulative_amount"] = (
    df.groupby("client_id")["amount"]
    .cumsum()
)
```

### Скользящее среднее по последним трём событиям

```python
df["rolling_mean_3"] = (
    df.groupby("client_id")["amount"]
    .transform(
        lambda values: values.rolling(
            window=3,
            min_periods=1,
        ).mean()
    )
)
```

### Расширяющееся окно

```python
df["mean_to_date"] = (
    df.groupby("client_id")["amount"]
    .transform(
        lambda values: values.expanding().mean()
    )
)
```

> [!danger] Утечка из будущего
> Если признак строится для прогноза, окно должно использовать только информацию, доступную до момента прогноза. Часто для этого нужен `shift(1)` перед `rolling`.

```python
df["past_3_mean"] = (
    df.groupby("client_id")["amount"]
    .transform(
        lambda values: (
            values.shift(1)
            .rolling(3, min_periods=1)
            .mean()
        )
    )
)
```

---

## 14. Быстрый исследовательский анализ

### Числовые признаки

```python
df.select_dtypes(include="number").describe().T
df["amount"].quantile([0, 0.01, 0.25, 0.5, 0.75, 0.99, 1])
df.select_dtypes(include="number").corr(method="pearson")
df.select_dtypes(include="number").corr(method="spearman")
```

Корреляция показывает статистическую связь, но сама по себе не доказывает причинность.

### Категориальные признаки

```python
df["city"].value_counts(dropna=False)
pd.crosstab(df["city"], df["status"], normalize="index")
```

### Простые графики

```python
df["amount"].plot.hist(bins=40)
df.groupby("city")["amount"].mean().sort_values().plot.barh()
monthly.plot(x="date", y="total_amount", marker="o")
```

Для окончательной визуализации обычно удобнее `matplotlib`, `seaborn` или BI-инструмент, но pandas-графиков достаточно для быстрой проверки.

### Правильный сегментный отчёт

```python
segment_report = (
    df.groupby("segment", as_index=False, dropna=False)
    .agg(
        rows=("client_id", "size"),
        clients=("client_id", "nunique"),
        total_amount=("amount", "sum"),
        average_amount=("amount", "mean"),
        response_rate=("target", "mean"),
    )
    .sort_values("response_rate", ascending=False)
)
```

В отчёте нужны и показатель, и размер сегмента. Иначе маленькая случайная группа может выглядеть лидером.

---

## 15. Проверки качества результата

Проверки должны выполняться не только в начале, но и после каждого важного преобразования.

### Ключи и обязательные поля

```python
assert df["transaction_id"].notna().all()
assert df["transaction_id"].is_unique
assert df["client_id"].notna().all()
```

Составной ключ:

```python
assert not report.duplicated(
    subset=["client_id", "month"]
).any()
```

### Допустимые значения

```python
allowed_statuses = {"active", "closed", "overdue"}

actual_statuses = set(df["status"].dropna().unique())

assert actual_statuses <= allowed_statuses
assert df["amount"].ge(0).all()
assert df["age"].dropna().between(18, 100).all()
```

### Даты

```python
assert df["date"].notna().all()
assert df["date"].le(reference_date).all()
```

### Проверка после фильтрации

```python
assert len(filtered) <= len(df)
assert filtered["date"].between(start_date, end_date).all()
```

### Проверка после `merge`

```python
assert len(result) == len(left_table)
assert result["_merge"].eq("both").all()
```

### Сверка итогов

```python
assert np.isclose(
    source["amount"].sum(),
    report["total_amount"].sum(),
)
```

Для финансовых расчётов дополнительно учитывать правила округления и тип чисел, принятый в системе.

### Универсальная функция профиля

```python
def profile_table(data: pd.DataFrame) -> pd.DataFrame:
    return (
        pd.DataFrame({
            "dtype": data.dtypes.astype(str),
            "missing": data.isna().sum(),
            "missing_pct": data.isna().mean(),
            "unique": data.nunique(dropna=False),
        })
        .sort_values(
            ["missing_pct", "unique"],
            ascending=[False, False],
        )
    )
```

---

## 16. Воспроизводимый pipeline обработки

Хорошая функция:

- получает таблицу аргументом;
- не зависит от случайных глобальных переменных;
- возвращает новую понятную таблицу;
- имеет одно назначение;
- допускает отдельную проверку.

```python
def clean_transactions(data: pd.DataFrame) -> pd.DataFrame:
    result = data.copy()

    result.columns = (
        result.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    result["date"] = pd.to_datetime(
        result["date"],
        errors="coerce",
    )

    result["amount"] = pd.to_numeric(
        result["amount"],
        errors="coerce",
    )

    result = result.dropna(
        subset=["transaction_id", "client_id", "date", "amount"]
    )

    result = result.drop_duplicates(
        subset="transaction_id",
    )

    return result
```

Применение:

```python
transactions_clean = clean_transactions(transactions_raw)
```

Цепочка через `pipe`:

```python
result = (
    transactions_raw
    .pipe(clean_transactions)
    .pipe(add_time_features)
    .pipe(build_client_report)
)
```

> [!important] Практическое правило
> Сырые данные не перезаписывать. Использовать понятные имена: `raw`, `clean`, `features`, `report`.

---

## 17. Производительность и большие данные

Действовать в таком порядке:

1. Не загружать ненужные строки и столбцы.
2. Выполнять крупную фильтрацию и агрегацию в SQL.
3. Использовать Parquet вместо CSV для повторных чтений больших таблиц.
4. Проверить типы и память.
5. Использовать векторные операции вместо построчных циклов.
6. Собирать части в список и выполнять один `concat`.
7. Читать файл чанками, если операция допускает обработку по частям.
8. Если данные существенно больше памяти — выбрать другой вычислительный инструмент.

### Память

```python
memory_mb = (
    df.memory_usage(deep=True).sum()
    / 1024**2
)

memory_mb
```

По столбцам:

```python
(
    df.memory_usage(deep=True)
    .sort_values(ascending=False)
    .div(1024**2)
)
```

### Чтение чанками

```python
parts = []

for chunk in pd.read_csv(
    INPUT_PATH,
    usecols=["client_id", "amount"],
    chunksize=100_000,
):
    part = (
        chunk.groupby("client_id", as_index=False)
        .agg(total_amount=("amount", "sum"))
    )
    parts.append(part)

result = (
    pd.concat(parts, ignore_index=True)
    .groupby("client_id", as_index=False)
    .agg(total_amount=("total_amount", "sum"))
)
```

Если нужен сложный join нескольких огромных таблиц, pandas может быть неправильным местом для расчёта. Тогда использовать базу данных, DuckDB, Polars, Dask или Spark — в зависимости от инфраструктуры команды.

---

## 18. Сохранение результата

### CSV

```python
report.to_csv(
    "client_report.csv",
    index=False,
)
```

### Parquet

```python
report.to_parquet(
    "client_report.parquet",
    index=False,
)
```

### Excel

```python
with pd.ExcelWriter("report.xlsx") as writer:
    report.to_excel(
        writer,
        sheet_name="Report",
        index=False,
    )
    quality_report.to_excel(
        writer,
        sheet_name="Data quality",
        index=False,
    )
```

### SQL

```python
report.to_sql(
    "client_report",
    con=connection,
    if_exists="replace",
    index=False,
)
```

Перед сохранением проверить:

```python
report.shape
report.head()
report.isna().sum()
report.duplicated(subset=RESULT_KEY).sum()
```

В рабочем проекте также фиксировать:

- дату и время расчёта;
- период данных;
- источник;
- версию кода;
- определение метрик;
- применённые фильтры.

---

## 19. Универсальный end-to-end шаблон

```python
from pathlib import Path

import numpy as np
import pandas as pd


# 1. Настройки
DATA_DIR = Path("data")
REFERENCE_DATE = pd.Timestamp("2025-12-31")
START_DATE = pd.Timestamp("2025-10-01")
RESULT_KEY = "client_id"


# 2. Загрузка
clients = pd.read_csv(
    DATA_DIR / "clients.csv",
    parse_dates=["registration_date"],
    dtype={"client_id": "string"},
)

transactions = pd.read_csv(
    DATA_DIR / "transactions.csv",
    parse_dates=["transaction_date"],
    dtype={
        "transaction_id": "string",
        "client_id": "string",
        "direction": "string",
    },
)


# 3. Первичный аудит
print("clients:", clients.shape)
print("transactions:", transactions.shape)

display(profile_table(clients))
display(profile_table(transactions))

assert clients["client_id"].notna().all()
assert clients["client_id"].is_unique
assert transactions["transaction_id"].is_unique


# 4. Очистка и проверка типов
transactions["amount"] = pd.to_numeric(
    transactions["amount"],
    errors="coerce",
)

transactions = transactions.dropna(
    subset=["transaction_id", "client_id", "transaction_date", "amount"]
)

assert transactions["amount"].ge(0).all()


# 5. Фильтрация под бизнес-вопрос
period_mask = (
    transactions["transaction_date"].ge(START_DATE)
    & transactions["transaction_date"].le(REFERENCE_DATE)
)

expense_mask = transactions["direction"].eq("expense")

period_transactions = transactions.loc[
    period_mask & expense_mask
].copy()


# 6. Приведение к гранулярности результата
client_features = (
    period_transactions
    .groupby("client_id", as_index=False)
    .agg(
        transaction_count=("transaction_id", "size"),
        active_days=("transaction_date", "nunique"),
        total_expense=("amount", "sum"),
        average_expense=("amount", "mean"),
        last_transaction=("transaction_date", "max"),
    )
)

assert client_features["client_id"].is_unique


# 7. Объединение
report = clients.merge(
    client_features,
    on="client_id",
    how="left",
    validate="one_to_one",
    indicator=True,
)

assert len(report) == len(clients)

report["_merge"].value_counts(dropna=False)

report = report.drop(columns="_merge")


# 8. Осмысленное заполнение отсутствующих событий
event_columns = [
    "transaction_count",
    "active_days",
    "total_expense",
]

report[event_columns] = report[event_columns].fillna(0)


# 9. Итоговые признаки и сортировка
report["days_since_last_transaction"] = (
    REFERENCE_DATE - report["last_transaction"]
).dt.days

report = report.sort_values(
    "total_expense",
    ascending=False,
)


# 10. Финальные проверки
assert report[RESULT_KEY].notna().all()
assert report[RESULT_KEY].is_unique
assert len(report) == len(clients)
assert report["total_expense"].ge(0).all()

display(report.head(10))


# 11. Сохранение
report.to_csv(
    "client_expense_report.csv",
    index=False,
)
```

### Как читать этот шаблон

```text
clients: одна строка = клиент
transactions: одна строка = транзакция
client_features: одна строка = клиент с транзакциями
report: одна строка = любой клиент, в том числе без транзакций
```

Ключевой момент — `transactions` сначала агрегируются до уровня клиента, и только затем объединяются с `clients`. Поэтому итоговая гранулярность контролируема.

---

## 20. Как выбрать нужную команду

| Задача | Основной инструмент |
|---|---|
| Посмотреть структуру | `shape`, `head`, `sample`, `info`, `describe` |
| Посчитать категории | `value_counts` |
| Проверить уникальные значения | `unique`, `nunique`, `is_unique` |
| Найти пропуски | `isna`, `notna` |
| Найти повторы | `duplicated`, `drop_duplicates` |
| Выбрать строки | boolean mask + `loc` |
| Выбрать столбцы | `df[[...]]`, `select_dtypes` |
| Отсортировать | `sort_values`, `nlargest`, `nsmallest` |
| Заменить значения | `map`, `replace`, `where`, `mask` |
| Несколько условий | `np.select` |
| Разбить число на интервалы | `cut`, `qcut` |
| Обработать текст | `.str` |
| Обработать дату | `to_datetime`, `.dt` |
| Одна строка на группу | `groupby(...).agg(...)` |
| Вернуть статистику в исходные строки | `groupby(...).transform(...)` |
| Добавить справочник | `merge(..., validate=...)` |
| Сложить однотипные таблицы | `concat` |
| Сводная таблица | `pivot_table`, `crosstab` |
| Wide → long | `melt` |
| Список → строки | `explode` |
| Предыдущее значение | `groupby(...).shift()` |
| Изменение во времени | `diff`, `pct_change` |
| Накопление | `cumsum`, `cumcount` |
| Скользящий показатель | `rolling` |
| Календарная агрегация | `Grouper`, `resample` |
| Проверить предположения | `assert`, `np.isclose` |
| Сохранить | `to_csv`, `to_parquet`, `to_excel`, `to_sql` |

---

## 21. Мост между pandas и SQL

| pandas | SQL |
|---|---|
| `df[["a", "b"]]` | `SELECT a, b` |
| `df.loc[mask]` | `WHERE` |
| `sort_values` | `ORDER BY` |
| `drop_duplicates` | `DISTINCT` или `ROW_NUMBER()` |
| `groupby().agg()` | `GROUP BY` |
| `merge` | `JOIN` |
| `concat` по строкам | `UNION ALL` |
| `transform` | оконная функция `OVER (PARTITION BY ...)` |
| `shift` | `LAG` / `LEAD` |
| `rank` | `RANK` / `DENSE_RANK` |
| `cumsum` | оконный `SUM` |
| `pivot_table` | `PIVOT` или условная агрегация |

Один и тот же бизнес-вопрос полезно уметь решить двумя способами. Тогда SQL отвечает за получение и крупную обработку данных, а pandas — за проверку, исследование, моделирование и финальный отчёт.

---

## 22. Что выучить наизусть

### Обязательно

```text
read_csv / read_parquet / read_sql_query
shape / head / sample / info / describe
isna / notna / duplicated / value_counts / nunique
loc / isin / between / sort_values
to_numeric / to_datetime / astype
fillna / dropna / drop_duplicates
assign / map / replace / np.where / np.select
groupby + agg / transform
merge + how + validate + indicator
concat
str / dt
pivot_table / crosstab / melt
shift / diff / cumsum / rolling
assert
to_csv / to_parquet
```

### Понимать, но можно смотреть синтаксис

```text
merge_asof
resample и сложные временные частоты
регулярные выражения
сложные pivot/MultiIndex
chunked processing
стилизация Excel
оптимизация типов и памяти
редкие параметры IO
```

Не нужно помнить точное название каждого параметра. Нужно понимать, **какой класс операции решает задачу**, после чего открыть документацию метода.

---

## 23. Типовые ошибки

1. Начать писать код, не определив гранулярность результата.
2. Считать среднее по строкам, когда нужны уникальные клиенты.
3. Использовать `count`, не понимая, что он не считает пропуски; для числа строк чаще нужен `size`.
4. Заполнить все пропуски нулями.
5. Удалить дубликаты без понимания их причины.
6. Выполнить `inner merge` и незаметно потерять объекты.
7. Выполнить many-to-many merge и размножить строки.
8. Не использовать `validate` и `indicator` при важных объединениях.
9. Применить `and/or` вместо `&/|` к Series.
10. Изменять данные через цепочное присваивание вместо `.loc`.
11. Использовать `.apply(axis=1)` для задачи, решаемой векторно.
12. Считать временные признаки без предварительной сортировки.
13. Использовать будущее при создании признаков прошлого.
14. Показывать долю сегмента без размера сегмента.
15. Делать вывод о причинности только по корреляции.
16. Перезаписывать сырые данные и терять возможность повторить анализ.
17. Сохранять CSV с ненужным индексом.
18. Не проверять число строк, ключи и контрольные суммы после преобразований.

---

## 24. Финальный чек-лист

### Постановка

- [ ] Бизнес-вопрос сформулирован одним предложением.
- [ ] Определена гранулярность исходных таблиц и результата.
- [ ] Известны первичные и внешние ключи.
- [ ] Зафиксированы период, фильтры, единицы и знаменатель метрики.

### Данные

- [ ] Проверены `shape`, типы, пропуски и категории.
- [ ] Проверена уникальность ключей.
- [ ] Даты и числа приведены к правильным типам.
- [ ] Пропуски и дубликаты обработаны по смыслу.
- [ ] Сырые данные не были перезаписаны.

### Преобразования

- [ ] Фильтр соответствует бизнес-вопросу.
- [ ] `groupby` приводит данные к нужной гранулярности.
- [ ] В `merge` указан `validate`.
- [ ] Проверены несовпавшие ключи.
- [ ] После join проверено количество строк.
- [ ] Временные операции выполнены после сортировки.

### Результат

- [ ] Ключ результата уникален и не содержит пропусков.
- [ ] Контрольные количества и суммы сходятся.
- [ ] Доли показаны вместе с размерами групп.
- [ ] Таблица отвечает именно на исходный вопрос.
- [ ] Результат сохранён с `index=False`.
- [ ] Зафиксированы дата расчёта, период и определения метрик.

---

## Формула для собеседования

> Сначала я уточняю бизнес-вопрос, гранулярность, ключи, период и определение метрики. Затем загружаю только необходимые данные, проверяю типы, пропуски, дубликаты и целостность ключей. После очистки фильтрую данные, привожу их через groupby к требуемой гранулярности и безопасно объединяю таблицы с `validate` и контролем числа строк. В конце сверяю ключи, размеры и контрольные суммы, интерпретирую результат вместе с объёмами групп и сохраняю воспроизводимый отчёт.

---

## Границы pandas

pandas хорошо подходит для анализа данных, которые помещаются в память одной машины. Для отдельных задач нужны другие инструменты:

| Задача | Инструмент |
|---|---|
| Получение и объединение больших таблиц в БД | SQL |
| Данные существенно больше оперативной памяти | база данных, DuckDB, Polars, Dask, Spark |
| Статистические тесты и модели | SciPy, statsmodels |
| Машинное обучение | scikit-learn, CatBoost, PyTorch |
| Продвинутые графики | seaborn, matplotlib, Plotly, BI |

Универсальность означает не пытаться решить всё одним `DataFrame`, а понимать момент, когда вычисление нужно передать другому инструменту.

---

## Официальная документация

- [Pandas User Guide](https://pandas.pydata.org/docs/user_guide/index.html)
- [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html)
- [Indexing and selecting data](https://pandas.pydata.org/docs/user_guide/indexing.html)
- [Working with missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)
- [Merge, join and concatenate](https://pandas.pydata.org/docs/user_guide/merging.html)
- [GroupBy](https://pandas.pydata.org/docs/user_guide/groupby.html)
- [Time series](https://pandas.pydata.org/docs/user_guide/timeseries.html)
- [Windowing operations](https://pandas.pydata.org/docs/user_guide/window.html)
- [Scaling to large datasets](https://pandas.pydata.org/docs/user_guide/scale.html)
- [API reference](https://pandas.pydata.org/docs/reference/index.html)
