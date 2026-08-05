---
title: pandas Cleaning and Data Types
id: concept.pandas.cleaning-dtypes
type: concept
area: pandas
schema_version: 2
language: ru
status: active
rag: include
rag_collection: knowledge
app: source
visual: true
aliases:
- Очистка данных pandas
tags:
- pandas/core
- data/cleaning
---

# pandas Cleaning and Data Types

## Принцип

Очистка данных — не удаление всего странного. Сначала нужно понять смысл значения, причину ошибки и влияние решения на target и deployment. Любая очистка должна быть воспроизводимой и выполняться одинаково на train и новых данных.

## Пропуски

```python
missing_rate = frame.isna().mean().sort_values(ascending=False)
```

Различайте:

- значение действительно неизвестно;
- значение неприменимо;
- источник не передал поле;
- пропуск появился после join;
- пропуск кодирует поведение пользователя;
- пропуск на самом деле записан как `"unknown"`, `-1`, пустая строка.

Не заполняйте всё нулём: это меняет смысл и distribution.

## Удаление и заполнение

```python
frame = frame.dropna(subset=["target"])
frame["age"] = frame["age"].fillna(frame["age"].median())
frame["city"] = frame["city"].fillna("__MISSING__")
```

Для ML statistics imputation fit только на train. В pandas exploratory шаге можно изучить варианты, но финальная операция должна попасть в sklearn Pipeline.

Missing indicator иногда сохраняет информацию:

```python
frame["age_was_missing"] = frame["age"].isna()
```

## Dtype

```python
frame = frame.convert_dtypes()
frame["age"] = pd.to_numeric(frame["age"], errors="coerce")
frame["event_time"] = pd.to_datetime(frame["event_time"], errors="coerce", utc=True)
```

`errors="coerce"` превращает неверные значения в пропуски. После этого обязательно посчитайте, сколько значений было потеряно.

## Категории

```python
frame["segment"] = frame["segment"].astype("category")
```

Category уменьшает память при небольшом числе повторяющихся значений. Но при постоянно меняющихся значениях или очень высокой cardinality выгода может исчезнуть.

Не кодируйте категорию целыми числами, если порядок не имеет смысла.

## Строки

```python
frame["email"] = frame["email"].str.strip().str.lower()
frame["domain"] = frame["email"].str.extract(r"@(.+)$", expand=False)
```

Перед нормализацией подумайте, не уничтожает ли регистр или пробелы значимую информацию.

## Дубликаты

```python
frame.duplicated().sum()
frame.duplicated(subset=["user_id", "event_time", "event_type"]).sum()
```

Полный дубль и повтор бизнес-события — разные вещи. Нельзя удалять дубликаты без определения ключа и причины появления.

## Диапазоны и контракты

```python
invalid_age = ~frame["age"].between(0, 120) & frame["age"].notna()
invalid_target = ~frame["target"].isin([0, 1])
```

Контракт может включать:

- обязательность;
- dtype;
- допустимый диапазон;
- уникальность;
- relation между колонками;
- monotonic time;
- долю пропусков.

## Outliers

Outlier может быть:

- ошибкой ввода;
- редким, но реальным случаем;
- отдельным сегментом;
- признаком fraud;
- следствием другой единицы измерения.

До удаления найдите источник. Winsorization, clipping и log transform меняют данные и должны валидироваться внутри pipeline.

## Timezone и даты

Храните timestamp в понятной timezone, часто UTC, а локальное представление вычисляйте отдельно. Извлечение месяца или дня недели до приведения timezone может дать неверный результат.

## Проверка после очистки

Сравните до/после:

- число строк;
- число уникальных ключей;
- missing rate;
- распределения;
- долю target;
- временной диапазон;
- число coerced значений;
- влияние по сегментам.

## Частые ошибки

- удалить все строки с любым NaN;
- заполнить пропуски до split;
- удалить outlier только потому, что он портит график;
- преобразовать ошибки в NaN и не посчитать их;
- удалять дубликаты без бизнес-ключа;
- потерять timezone;
- менять исходный DataFrame неявно.

## Связи

- [[Data Quality Missing Values and Outliers]] — причины и диагностика.
- [[Data Preprocessing and Feature Engineering]] — перенос правил в ML Pipeline.
- [[pandas Performance and Debugging]] — память и скорость.
