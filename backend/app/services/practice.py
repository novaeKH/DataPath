"""Deterministic local practice: safe SQLite tasks and code-structure checks."""

# Учебные prompt/code/solution намеренно хранятся рядом в компактном реестре.
# ruff: noqa: E501

from __future__ import annotations

import hashlib
import re
import sqlite3
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.db.models import LearningEvent
from app.db.session import SessionLocal
from app.services.knowledge_model import KnowledgeModelService

SQL_SCHEMA = {
    "customers": ["customer_id", "name", "city", "signup_date"],
    "orders": ["order_id", "customer_id", "created_at", "status", "amount"],
    "events": ["event_id", "customer_id", "event_time", "event_name"],
}

SQL_EXERCISES: list[dict[str, Any]] = [
    {
        "id": "sql.select-filter",
        "track": "sql",
        "title": "SELECT и WHERE",
        "difficulty": "foundation",
        "estimated_minutes": 8,
        "prompt": "Выведите order_id, customer_id и amount оплаченных заказов дороже 100. Отсортируйте по amount по убыванию, затем по order_id.",
        "starter_code": "SELECT\n  order_id,\n  customer_id,\n  amount\nFROM orders\nWHERE ...\nORDER BY ...;",
        "hint": "Фильтр применяет два условия: status и amount.",
        "skill_id": "sql.select-where",
        "solution": "SELECT order_id, customer_id, amount FROM orders WHERE status = 'paid' AND amount > 100 ORDER BY amount DESC, order_id;",
        "ordered": True,
    },
    {
        "id": "sql.groupby-having",
        "track": "sql",
        "title": "GROUP BY и HAVING",
        "difficulty": "foundation",
        "estimated_minutes": 10,
        "prompt": "Для каждого customer посчитайте paid_orders и revenue. Оставьте клиентов с revenue не меньше 150. Сортировка: revenue DESC.",
        "starter_code": "SELECT\n  customer_id,\n  COUNT(*) AS paid_orders,\n  SUM(amount) AS revenue\nFROM orders\nWHERE ...\nGROUP BY ...\nHAVING ...;",
        "hint": "WHERE выбирает paid rows, HAVING фильтрует уже посчитанный SUM.",
        "skill_id": "sql.aggregation",
        "solution": "SELECT customer_id, COUNT(*) AS paid_orders, SUM(amount) AS revenue FROM orders WHERE status = 'paid' GROUP BY customer_id HAVING SUM(amount) >= 150 ORDER BY revenue DESC;",
        "ordered": True,
    },
    {
        "id": "sql.join",
        "track": "sql",
        "title": "LEFT JOIN без потери клиентов",
        "difficulty": "core",
        "estimated_minutes": 12,
        "prompt": "Выведите всех customers и число их paid orders, включая клиентов без заказов. Колонки: customer_id, name, paid_orders. Сортировка по customer_id.",
        "starter_code": "SELECT\n  c.customer_id,\n  c.name,\n  COUNT(...) AS paid_orders\nFROM customers c\nLEFT JOIN orders o ON ...\nGROUP BY ...\nORDER BY ...;",
        "hint": "Условие status поместите в ON, иначе LEFT JOIN станет похож на INNER JOIN.",
        "skill_id": "sql.joins",
        "solution": "SELECT c.customer_id, c.name, COUNT(o.order_id) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'paid' GROUP BY c.customer_id, c.name ORDER BY c.customer_id;",
        "ordered": True,
    },
    {
        "id": "sql.cte-case-dates",
        "track": "sql",
        "title": "CTE, CASE и даты",
        "difficulty": "core",
        "estimated_minutes": 15,
        "prompt": "Через CTE посчитайте по дням paid_revenue и refunds_count. Колонки: day, paid_revenue, refunds_count; сортировка по day.",
        "starter_code": "WITH typed AS (\n  SELECT date(created_at) AS day, status, amount\n  FROM orders\n)\nSELECT\n  day,\n  SUM(CASE WHEN ...),\n  SUM(CASE WHEN ...)\nFROM typed\nGROUP BY day;",
        "hint": "Conditional aggregation: CASE возвращает amount или 0, а для счётчика — 1 или 0.",
        "skill_id": "sql.cte-dates",
        "solution": "WITH typed AS (SELECT date(created_at) AS day, status, amount FROM orders) SELECT day, SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_revenue, SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunds_count FROM typed GROUP BY day ORDER BY day;",
        "ordered": True,
    },
    {
        "id": "sql.window-ranking",
        "track": "sql",
        "title": "Window functions и ranking",
        "difficulty": "interview",
        "estimated_minutes": 18,
        "prompt": "Найдите последний paid order каждого customer. Колонки: customer_id, order_id, created_at, amount. Используйте ROW_NUMBER и deterministic tie-breaker.",
        "starter_code": "WITH ranked AS (\n  SELECT\n    ...,\n    ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) AS rn\n  FROM orders\n  WHERE ...\n)\nSELECT ... FROM ranked WHERE rn = 1 ORDER BY customer_id;",
        "hint": "При одинаковом created_at добавьте order_id DESC.",
        "skill_id": "sql.windows",
        "solution": "WITH ranked AS (SELECT customer_id, order_id, created_at, amount, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, order_id DESC) AS rn FROM orders WHERE status = 'paid') SELECT customer_id, order_id, created_at, amount FROM ranked WHERE rn = 1 ORDER BY customer_id;",
        "ordered": True,
    },
    {
        "id": "sql.retention",
        "track": "sql",
        "title": "Interview: D1 retention",
        "difficulty": "interview",
        "estimated_minutes": 20,
        "prompt": "Для каждого active day посчитайте users и returned_d1 — пользователей с событием на следующий календарный день. Колонки day, users, returned_d1.",
        "starter_code": "WITH active_days AS (\n  SELECT DISTINCT customer_id, date(event_time) AS day FROM events\n)\nSELECT ...",
        "hint": "Сделайте self LEFT JOIN unique user-day на day + 1.",
        "skill_id": "sql.interview",
        "solution": "WITH active_days AS (SELECT DISTINCT customer_id, date(event_time) AS day FROM events) SELECT a.day, COUNT(DISTINCT a.customer_id) AS users, COUNT(DISTINCT b.customer_id) AS returned_d1 FROM active_days a LEFT JOIN active_days b ON b.customer_id = a.customer_id AND b.day = date(a.day, '+1 day') GROUP BY a.day ORDER BY a.day;",
        "ordered": True,
    },
]

CODE_EXERCISES: list[dict[str, Any]] = [
    {
        "id": "numpy.broadcast",
        "track": "numpy",
        "title": "Broadcasting без циклов",
        "difficulty": "foundation",
        "estimated_minutes": 8,
        "prompt": "Для matrix shape (3, 4) вычтите mean каждого столбца и разделите на std. Сохраните result в normalized.",
        "starter_code": "column_mean = ...\ncolumn_std = ...\nnormalized = ...",
        "hint": "axis=0 и keepdims=True сохраняют форму (1, 4).",
        "skill_id": "numpy.broadcasting",
        "required": ["axis=0", "keepdims=true", "normalized"],
        "solution": "column_mean = matrix.mean(axis=0, keepdims=True)\ncolumn_std = matrix.std(axis=0, keepdims=True)\nnormalized = (matrix - column_mean) / column_std",
    },
    {
        "id": "numpy.vectorize",
        "track": "numpy",
        "title": "Vectorization",
        "difficulty": "core",
        "estimated_minutes": 8,
        "prompt": "Без Python loop вычислите MSE массивов y_true и y_pred.",
        "starter_code": "mse = ...",
        "hint": "Разность и квадрат применяются elementwise, затем mean.",
        "skill_id": "numpy.vectorization",
        "required": ["y_true - y_pred", "** 2", ".mean("],
        "solution": "mse = ((y_true - y_pred) ** 2).mean()",
    },
    {
        "id": "pandas.clean-feature",
        "track": "pandas",
        "title": "Missing values и feature creation",
        "difficulty": "foundation",
        "estimated_minutes": 12,
        "prompt": "Создайте total = price * quantity, заполните missing city значением 'unknown' и удалите полные дубликаты.",
        "starter_code": "clean = orders.copy()\n...",
        "hint": "Используйте assign/column expression, fillna и drop_duplicates.",
        "skill_id": "pandas.cleaning",
        "required": ["price", "quantity", "fillna", "drop_duplicates"],
        "solution": "clean = orders.copy()\nclean['total'] = clean['price'] * clean['quantity']\nclean['city'] = clean['city'].fillna('unknown')\nclean = clean.drop_duplicates()",
    },
    {
        "id": "pandas.groupby-merge",
        "track": "pandas",
        "title": "GroupBy + merge с проверкой cardinality",
        "difficulty": "core",
        "estimated_minutes": 15,
        "prompt": "Посчитайте revenue по customer_id и присоедините к customers как many-to-one. Клиентов без заказов сохраните.",
        "starter_code": "revenue = ...\nresult = customers.merge(...)",
        "hint": "groupby(..., as_index=False), how='left', validate='one_to_one' или 'one_to_many' — проверьте grain результата.",
        "skill_id": "pandas.groupby-merge",
        "required": ["groupby", "sum", 'how="left"', "validate="],
        "solution": "revenue = orders.groupby('customer_id', as_index=False)['amount'].sum()\nresult = customers.merge(revenue, on='customer_id', how=\"left\", validate=\"one_to_one\")\nresult['amount'] = result['amount'].fillna(0)",
    },
    {
        "id": "pandas.datetime",
        "track": "pandas",
        "title": "Datetime, sorting и rolling",
        "difficulty": "core",
        "estimated_minutes": 15,
        "prompt": "Преобразуйте event_time в datetime, отсортируйте по customer/time и посчитайте rolling mean amount по 3 последним строкам клиента.",
        "starter_code": "events['event_time'] = ...\nevents = ...\nevents['rolling_3'] = ...",
        "hint": "groupby(customer_id)['amount'].transform(lambda s: s.rolling(3, min_periods=1).mean()).",
        "skill_id": "pandas.datetime",
        "required": ["to_datetime", "sort_values", "groupby", "rolling(3"],
        "solution": "events['event_time'] = pd.to_datetime(events['event_time'])\nevents = events.sort_values(['customer_id', 'event_time'])\nevents['rolling_3'] = events.groupby('customer_id')['amount'].transform(lambda s: s.rolling(3, min_periods=1).mean())",
    },
    {
        "id": "sklearn.pipeline",
        "track": "sklearn",
        "title": "Leakage-safe Pipeline",
        "difficulty": "core",
        "estimated_minutes": 18,
        "prompt": "Соберите ColumnTransformer: median+scale для numeric, most_frequent+one-hot для categorical, затем LogisticRegression.",
        "starter_code": "numeric = Pipeline([...])\ncategorical = Pipeline([...])\npreprocess = ColumnTransformer([...])\nmodel = Pipeline([...])",
        "hint": "Все learned transformations должны находиться внутри model Pipeline до CV.",
        "skill_id": "sklearn.pipeline",
        "required": [
            "simpleimputer",
            "standardscaler",
            "onehotencoder",
            "columntransformer",
            "logisticregression",
        ],
        "solution": "numeric = Pipeline([('imputer', SimpleImputer(strategy='median')), ('scale', StandardScaler())])\ncategorical = Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore'))])\npreprocess = ColumnTransformer([('num', numeric, numeric_cols), ('cat', categorical, categorical_cols)])\nmodel = Pipeline([('preprocess', preprocess), ('classifier', LogisticRegression(max_iter=1000))])",
    },
    {
        "id": "sklearn.cv",
        "track": "sklearn",
        "title": "Cross-validation и tuning",
        "difficulty": "interview",
        "estimated_minutes": 15,
        "prompt": "Настройте RandomizedSearchCV для classifier__C в log-scale, scoring average_precision, 5 folds и refit.",
        "starter_code": "search = RandomizedSearchCV(...)",
        "hint": "Вложенный parameter использует double underscore.",
        "skill_id": "sklearn.cv",
        "required": [
            "randomizedsearchcv",
            "classifier__c",
            "average_precision",
            "cv=5",
            "refit=true",
        ],
        "solution": "search = RandomizedSearchCV(model, {'classifier__C': loguniform(1e-3, 1e2)}, n_iter=30, scoring='average_precision', cv=5, refit=True, random_state=42)",
    },
    {
        "id": "algorithms.sliding-window",
        "track": "algorithms",
        "title": "Sliding window",
        "difficulty": "core",
        "estimated_minutes": 15,
        "prompt": "Реализуйте max_sum_k(nums, k) за O(n), не пересчитывая сумму каждого окна.",
        "starter_code": "def max_sum_k(nums, k):\n    ...",
        "hint": "Вычтите уходящий элемент и добавьте входящий.",
        "skill_id": "algorithms.sliding-window",
        "required": ["sum(nums[:k])", "range(k", "nums[right - k]", "max("],
        "solution": "def max_sum_k(nums, k):\n    window = sum(nums[:k])\n    best = window\n    for right in range(k, len(nums)):\n        window += nums[right] - nums[right - k]\n        best = max(best, window)\n    return best",
    },
    {
        "id": "algorithms.bfs",
        "track": "algorithms",
        "title": "BFS по графу",
        "difficulty": "core",
        "estimated_minutes": 18,
        "prompt": "Верните shortest distance в невзвешенном graph через deque и visited.",
        "starter_code": "def shortest(graph, start, target):\n    ...",
        "hint": "Состояние queue: (node, distance); отмечайте visited при добавлении.",
        "skill_id": "algorithms.graphs",
        "required": ["deque", "visited", "popleft", "distance + 1"],
        "solution": "def shortest(graph, start, target):\n    queue = deque([(start, 0)])\n    visited = {start}\n    while queue:\n        node, distance = queue.popleft()\n        if node == target:\n            return distance\n        for neighbour in graph[node]:\n            if neighbour not in visited:\n                visited.add(neighbour)\n                queue.append((neighbour, distance + 1))\n    return -1",
    },
    {
        "id": "dl.training-loop",
        "track": "deep-learning",
        "title": "PyTorch training loop",
        "difficulty": "core",
        "estimated_minutes": 15,
        "prompt": "Допишите training step в правильном порядке: zero_grad, forward, loss, backward, optimizer.step.",
        "starter_code": "for x, y in loader:\n    ...",
        "hint": "Gradient накапливается, поэтому zero_grad выполняется до backward.",
        "skill_id": "dl.training",
        "required": ["zero_grad", "model(x)", "loss_fn", ".backward()", "optimizer.step()"],
        "solution": "for x, y in loader:\n    optimizer.zero_grad()\n    logits = model(x)\n    loss = loss_fn(logits, y)\n    loss.backward()\n    optimizer.step()",
    },
    {
        "id": "dl.debug",
        "track": "deep-learning",
        "title": "Найдите evaluation bug",
        "difficulty": "interview",
        "estimated_minutes": 12,
        "prompt": "Исправьте validation loop: переключите режим, отключите gradients и верните model в train mode.",
        "starter_code": "# validation\nfor x, y in valid_loader:\n    logits = model(x)",
        "hint": "model.eval() влияет на dropout/batchnorm, torch.no_grad() — на graph.",
        "skill_id": "dl.debugging",
        "required": ["model.eval()", "torch.no_grad()", "model.train()"],
        "solution": "model.eval()\nwith torch.no_grad():\n    for x, y in valid_loader:\n        logits = model(x)\nmodel.train()",
    },
]

# AlgoPath remains the owner of algorithm drills. Records and runners stay compatible,
# but algorithm exercises are not published in the DataPath release catalogue.
RELEASE_PRACTICE_EXERCISES = [
    *SQL_EXERCISES,
    *(exercise for exercise in CODE_EXERCISES if exercise["track"] != "algorithms"),
]


def _seed(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE customers(customer_id INTEGER PRIMARY KEY, name TEXT, city TEXT, signup_date TEXT);
        CREATE TABLE orders(order_id INTEGER PRIMARY KEY, customer_id INTEGER, created_at TEXT, status TEXT, amount REAL);
        CREATE TABLE events(event_id INTEGER PRIMARY KEY, customer_id INTEGER, event_time TEXT, event_name TEXT);
        INSERT INTO customers VALUES
          (1,'Анна','Москва','2026-01-10'),(2,'Борис','Казань','2026-01-12'),
          (3,'Вера','Москва','2026-02-01'),(4,'Глеб','Тула','2026-02-14'),(5,'Дина',NULL,'2026-03-03');
        INSERT INTO orders VALUES
          (101,1,'2026-04-01 10:00','paid',120),(102,1,'2026-04-03 12:00','paid',80),
          (103,2,'2026-04-01 09:00','cancelled',200),(104,2,'2026-04-04 11:00','paid',230),
          (105,3,'2026-04-02 15:00','refunded',90),(106,3,'2026-04-05 08:00','paid',160),
          (107,3,'2026-04-05 08:00','paid',45),(108,5,'2026-04-06 18:00','paid',70);
        INSERT INTO events VALUES
          (1,1,'2026-04-01 08:00','open'),(2,1,'2026-04-02 09:00','open'),
          (3,1,'2026-04-04 09:00','open'),(4,2,'2026-04-01 10:00','open'),
          (5,2,'2026-04-02 10:00','buy'),(6,3,'2026-04-02 11:00','open'),
          (7,3,'2026-04-03 11:00','open'),(8,4,'2026-04-03 12:00','open');
        """
    )


def _sql_rows(query: str) -> tuple[list[str], list[list[Any]]]:
    normalized = re.sub(r"--.*?$|/\*.*?\*/", " ", query, flags=re.MULTILINE | re.DOTALL).strip()
    if not re.match(r"^(select|with)\b", normalized, flags=re.IGNORECASE):
        raise ValueError("Разрешены только read-only SELECT или WITH запросы.")
    if re.search(
        r"\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|replace|truncate)\b",
        normalized,
        flags=re.IGNORECASE,
    ):
        raise ValueError("Запрос содержит запрещённую операцию.")
    if ";" in normalized.rstrip(";"):
        raise ValueError("Выполните один SQL statement за раз.")
    connection = sqlite3.connect(":memory:")
    try:
        connection.set_progress_handler(lambda: 1, 100_000)
        _seed(connection)
        cursor = connection.execute(normalized)
        columns = [item[0] for item in cursor.description or []]
        rows = [list(row) for row in cursor.fetchmany(101)]
        if len(rows) > 100:
            raise ValueError("Результат превышает лимит 100 строк.")
        return columns, rows
    except sqlite3.Error as exc:
        raise ValueError(f"SQLite: {exc}") from exc
    finally:
        connection.close()


def _normalized_rows(rows: list[list[Any]], ordered: bool) -> list[tuple[str, ...]]:
    values = [tuple("NULL" if value is None else str(value) for value in row) for row in rows]
    return values if ordered else sorted(values)


class PracticeService:
    def __init__(self, session_factory: sessionmaker | None = None) -> None:
        self.session_factory = session_factory or SessionLocal
        self.knowledge = KnowledgeModelService()

    def catalog(self) -> dict[str, Any]:
        completed = self.completed_ids()
        public_keys = {
            "id",
            "track",
            "title",
            "difficulty",
            "estimated_minutes",
            "prompt",
            "starter_code",
            "hint",
        }
        exercises = [
            {
                **{key: value for key, value in exercise.items() if key in public_keys},
                "kind": "sql",
                "completed": exercise["id"] in completed,
                "schema": SQL_SCHEMA,
            }
            for exercise in RELEASE_PRACTICE_EXERCISES
            if exercise in SQL_EXERCISES
        ]
        exercises.extend(
            {
                **{key: value for key, value in exercise.items() if key in public_keys},
                "kind": "code",
                "completed": exercise["id"] in completed,
            }
            for exercise in RELEASE_PRACTICE_EXERCISES
            if exercise in CODE_EXERCISES
        )
        released_ids = {exercise["id"] for exercise in RELEASE_PRACTICE_EXERCISES}
        return {
            "exercises": exercises,
            "completed_count": len(completed & released_ids),
            "total_count": len(exercises),
        }

    def completed_ids(self) -> set[str]:
        with self.session_factory() as db:
            return set(
                db.scalars(
                    select(LearningEvent.source_id).where(
                        LearningEvent.event_type == "practice_completed",
                        LearningEvent.outcome == "correct",
                    )
                ).all()
            )

    def recommendation(self) -> dict[str, Any] | None:
        completed = self.completed_ids()
        for exercise in RELEASE_PRACTICE_EXERCISES:
            if exercise["id"] not in completed:
                return {
                    "exercise_id": exercise["id"],
                    "title": exercise["title"],
                    "track": exercise["track"],
                    "estimated_minutes": exercise["estimated_minutes"],
                }
        return None

    def run_sql(self, exercise_id: str, query: str) -> dict[str, Any]:
        exercise = next((item for item in SQL_EXERCISES if item["id"] == exercise_id), None)
        if exercise is None:
            raise KeyError(exercise_id)
        columns, rows = _sql_rows(query)
        expected_columns, expected_rows = _sql_rows(exercise["solution"])
        passed = columns == expected_columns and _normalized_rows(
            rows, exercise["ordered"]
        ) == _normalized_rows(expected_rows, exercise["ordered"])
        evidence = self._record(exercise, query, passed)
        return {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "passed": passed,
            "feedback": "Результат совпал с эталонным набором."
            if passed
            else "Запрос выполнился, но набор строк или имена колонок отличаются. Проверьте grain, фильтры и сортировку.",
            "solution": exercise["solution"] if not passed else None,
            "evidence": evidence,
        }

    def check_code(self, exercise_id: str, code: str) -> dict[str, Any]:
        exercise = next((item for item in CODE_EXERCISES if item["id"] == exercise_id), None)
        if exercise is None:
            raise KeyError(exercise_id)
        normalized = re.sub(r"\s+", "", code).lower().replace("'", '"')
        missing = [
            fragment
            for fragment in exercise["required"]
            if re.sub(r"\s+", "", fragment).lower().replace("'", '"') not in normalized
        ]
        passed = not missing
        evidence = self._record(exercise, code, passed)
        return {
            "passed": passed,
            "feedback": "Ключевые шаги решения найдены."
            if passed
            else "Не все обязательные шаги найдены: проверьте API, порядок операций и edge cases.",
            "missing_count": len(missing),
            "solution": exercise["solution"],
            "evidence": evidence,
        }

    def _record(self, exercise: dict[str, Any], answer: str, passed: bool) -> list[dict[str, Any]]:
        digest = hashlib.sha1(answer.strip().encode("utf-8")).hexdigest()[:16]
        with self.session_factory() as db:
            update = self.knowledge.record_and_assess(
                db,
                event_type="practice_completed",
                source_type="practice",
                source_id=exercise["id"],
                skill_id=exercise["skill_id"],
                success=1.0 if passed else 0.25,
                outcome="correct" if passed else "incorrect",
                score=1.0 if passed else 0.25,
                error_code=None if passed else "practice.incomplete_solution",
                metadata={
                    "track": exercise["track"],
                    "kind": "sql" if exercise in SQL_EXERCISES else "code",
                },
                dedup_key=f"practice:{exercise['id']}:{digest}:{passed}",
            )
            db.commit()
            return [
                {
                    "skill_id": update.skill_id,
                    "state": update.state,
                    "evidence_count": update.evidence_count,
                }
            ]
