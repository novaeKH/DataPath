---
title: SQL — основы и практические методы
type: concept
area: tools
status: active
aliases:
  - SQL methods
  - SQL tasks
tags:
  - sql/basics
  - tools
  - practice
math_depth: 0
id: concept.sql.foundations
schema_version: 2
language: ru
rag: include
rag_collection: knowledge
app: source
---

# SQL — основы и практические методы

## SELECT, фильтрация и сортировка

**SELECT** — основная команда для чтения данных. Минимальный синтаксис:

```sql
SELECT column1, column2
FROM table_name
WHERE condition
ORDER BY column1 DESC
LIMIT 100;
```

### WHERE — фильтрация строк

| Оператор | Пример | Описание |
|---|---|---|
| `=` | `WHERE city = 'Moscow'` | точное совпадение |
| `IN` | `WHERE city IN ('Moscow', 'SPb')` | одно из списка |
| `BETWEEN` | `WHERE age BETWEEN 18 AND 65` | диапазон включительно |
| `LIKE` | `WHERE name LIKE 'Ivan%'` | шаблон: % — любые символы |
| `IS NULL` | `WHERE email IS NULL` | проверка на NULL |
| `AND/OR` | `WHERE age > 25 AND city = 'Moscow'` | логические комбинации |
| `NOT` | `WHERE city NOT IN ('Moscow')` | отрицание |

> [!warning] NULL — не равно ничему!
> `WHERE column = NULL` всегда ложно. Используйте `IS NULL` / `IS NOT NULL`.

### ORDER BY — сортировка

```sql
ORDER BY column1 ASC, column2 DESC
```

## Агрегация и GROUP BY

**Агрегатные функции** сжимают несколько строк в одну:

| Функция | Что делает | Пример |
|---|---|---|
| `COUNT(*)` | число строк | `COUNT(*)` — все строки; `COUNT(column)` — не-NULL |
| `SUM(column)` | сумма значений | `SUM(amount)` |
| `AVG(column)` | среднее | `AVG(price)` |
| `MIN/MAX` | минимум/максимум | `MAX(salary)` |

**GROUP BY** группирует строки и применяет агрегацию к каждой группе:

```sql
SELECT city, COUNT(*) AS users, AVG(age) AS avg_age
FROM users
GROUP BY city
HAVING COUNT(*) > 10
ORDER BY users DESC;
```

**HAVING** фильтрует группы (аналог WHERE для агрегатов):

```sql
HAVING AVG(salary) > 50000
```

### Порядок выполнения (логический):

```text
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

## JOIN — соединение таблиц

```sql
SELECT users.name, orders.amount
FROM users
JOIN orders ON users.id = orders.user_id
```

| Тип JOIN | Что включает |
|---|---|
| `INNER JOIN` | только совпадения в обеих таблицах |
| `LEFT JOIN` | все строки левой + совпадения правой (NULL если нет) |
| `RIGHT JOIN` | все строки правой + совпадения левой |
| `FULL OUTER JOIN` | все строки обеих таблиц |
| `CROSS JOIN` | декартово произведение |
| `SELF JOIN` | таблица соединяется сама с собой |

> [!tip] Всегда явно указывайте JOIN-условие (ON)
> `FROM a, b WHERE a.id = b.id` — старый синтаксис, используйте `FROM a JOIN b ON a.id = b.id`.

## Подзапросы и CTE

**Подзапрос (subquery):**

```sql
SELECT * FROM users
WHERE city IN (SELECT city FROM cities WHERE population > 1e6)
```

**CTE (Common Table Expression) с WITH:**

```sql
WITH city_stats AS (
    SELECT city, COUNT(*) AS cnt
    FROM users
    GROUP BY city
)
SELECT * FROM city_stats WHERE cnt > 100;
```

## Оконные функции

Оконная функция вычисляет агрегат по «окну» строк, не сворачивая их:

```sql
SELECT
    name,
    department,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank
FROM employees;
```

| Функция | Описание |
|---|---|
| `ROW_NUMBER()` | уникальный номер в окне |
| `RANK()` | ранг с пропусками при равенстве |
| `DENSE_RANK()` | ранг без пропусков |
| `SUM/AVG OVER()` | накопительная сумма/среднее |
| `LAG(column, N)` | значение N строк назад |
| `LEAD(column, N)` | значение N строк вперёд |

```sql
-- Прирост month-over-month:
SELECT month, revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) AS change
FROM monthly_sales;
```

## Типичные ошибки

1. **`WHERE` после `GROUP BY`** — нужно `HAVING`
2. **`COUNT(NULL)`** — считает только не-NULL значения
3. **`INNER JOIN` вместо `LEFT JOIN`** — теряются строки без совпадений
4. **Фильтрация в `WHERE` на агрегат** — ошибка синтаксиса
5. **`SELECT *` в production** — лишние данные, ломается при изменении схемы
6. **Отсутствие индексов на JOIN-ключах** — медленные запросы
7. **Путать `WHERE` и `ON` в JOIN** — `WHERE` фильтрует после JOIN, `ON` — условие соединения

## Проверка понимания

### 1. Фильтрация и NULL

**Вопрос.** Почему `SELECT * FROM users WHERE email = NULL` не работает?

- **A.** NULL не является значением — сравнение с NULL всегда даёт NULL (не TRUE)
- **B.** email не может быть NULL
- **C.** Нужно использовать `==` вместо `=`

<details>
<summary>Ответ</summary>

**Правильный ответ:** A. В SQL `NULL` означает «неизвестно»; любое сравнение с `NULL` возвращает `NULL` (не TRUE и не FALSE). Используйте `IS NULL`.

</details>

### 2. GROUP BY и HAVING

**Вопрос.** Что вернёт запрос, если в группе 0 строк?

```sql
SELECT department, COUNT(*) FROM employees
WHERE 1=0 GROUP BY department
```

- **A.** Ни одной строки
- **B.** Все department с COUNT=0
- **C.** Ошибку

<details>
<summary>Ответ</summary>

**Правильный ответ:** A. `WHERE 1=0` фильтрует все строки до GROUP BY — группировать нечего.

</details>

### 3. JOIN-типы

**Вопрос.** У клиента 3 заказа. `LEFT JOIN orders` вернёт...

- **A.** 1 строку
- **B.** 3 строки
- **C.** Зависит от того, есть ли заказы

<details>
<summary>Ответ</summary>

**Правильный ответ:** B. `LEFT JOIN` возвращает строку для каждого совпадения в правой таблице. Один клиент × 3 заказа = 3 строки.

</details>
