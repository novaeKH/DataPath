"""Build the checked-in DataPath practice assets from SQL Praktikum and AlgoPath.

The source projects are treated as read-only.  DataPath receives normalized JSON
catalogues and a compact, relationally consistent Olist SQLite database suitable
for a browser/PWA download.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import sqlite3
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "frontend" / "public" / "practice-data"


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def asset_integrity(path: Path) -> dict[str, Any]:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return {"bytes": path.stat().st_size, "sha256": digest.hexdigest()}


def load_sql_catalog(
    source: Path,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    app_dir = source / "app"
    sys.path.insert(0, str(app_dir))
    try:
        tasks_module = importlib.import_module("tasks_data")
        schema_module = importlib.import_module("schema_meta")
        tasks = [dict(task) for task in tasks_module.TASKS]
        sections = [dict(section) for section in tasks_module.SECTIONS]
        schema = {
            name: dict(meta)
            for name, meta in schema_module.TABLE_META.items()
            if name != "geolocation"
        }
    finally:
        sys.path.remove(str(app_dir))
        for module_name in (
            "tasks_data",
            "schema_meta",
            "beginner_tasks",
            "v3_content",
        ):
            sys.modules.pop(module_name, None)
    return tasks, sections, schema


def build_compact_olist(source_db: Path, target_db: Path) -> dict[str, int]:
    """Keep a deterministic 25% order sample and every referenced dimension row."""
    target_db.parent.mkdir(parents=True, exist_ok=True)
    target_db.unlink(missing_ok=True)
    connection = sqlite3.connect(target_db)
    try:
        connection.execute("PRAGMA journal_mode=OFF")
        connection.execute("PRAGMA synchronous=OFF")
        connection.execute("ATTACH DATABASE ? AS source", (str(source_db),))
        connection.executescript(
            """
            CREATE TABLE orders AS
              SELECT * FROM source.orders
              WHERE lower(substr(order_id, 1, 1)) IN ('0','1','2','3');

            CREATE TABLE customers AS
              SELECT c.* FROM source.customers c
              JOIN orders o ON o.customer_id = c.customer_id;

            CREATE TABLE order_items AS
              SELECT i.* FROM source.order_items i
              JOIN orders o ON o.order_id = i.order_id;

            CREATE TABLE payments AS
              SELECT p.* FROM source.payments p
              JOIN orders o ON o.order_id = p.order_id;

            CREATE TABLE reviews AS
              SELECT r.* FROM source.reviews r
              JOIN orders o ON o.order_id = r.order_id;

            CREATE TABLE products AS
              SELECT DISTINCT p.* FROM source.products p
              JOIN order_items i ON i.product_id = p.product_id;

            CREATE TABLE sellers AS
              SELECT DISTINCT s.* FROM source.sellers s
              JOIN order_items i ON i.seller_id = s.seller_id;

            CREATE TABLE category_translation AS
              SELECT * FROM source.category_translation;

            CREATE TABLE monthly_targets AS
              SELECT * FROM source.monthly_targets;

            CREATE UNIQUE INDEX idx_orders_order_id ON orders(order_id);
            CREATE INDEX idx_orders_customer_id ON orders(customer_id);
            CREATE INDEX idx_orders_purchase ON orders(order_purchase_timestamp);
            CREATE UNIQUE INDEX idx_customers_customer_id ON customers(customer_id);
            CREATE INDEX idx_customers_unique ON customers(customer_unique_id);
            CREATE INDEX idx_items_order ON order_items(order_id);
            CREATE INDEX idx_items_product ON order_items(product_id);
            CREATE INDEX idx_items_seller ON order_items(seller_id);
            CREATE INDEX idx_payments_order ON payments(order_id);
            CREATE INDEX idx_reviews_order ON reviews(order_id);
            CREATE UNIQUE INDEX idx_products_product ON products(product_id);
            CREATE UNIQUE INDEX idx_sellers_seller ON sellers(seller_id);
            """
        )
        connection.commit()
        counts = {
            table: int(
                connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            )
            for table in (
                "orders",
                "customers",
                "order_items",
                "payments",
                "reviews",
                "products",
                "sellers",
                "category_translation",
                "monthly_targets",
            )
        }
        connection.execute("DETACH DATABASE source")
        connection.execute("VACUUM")
        return counts
    finally:
        connection.close()


def export_sql_project(source: Path) -> dict[str, Any]:
    tasks, sections, schema = load_sql_catalog(source)
    database_path = OUTPUT / "olist-practice.sqlite"
    row_counts = build_compact_olist(source / "data" / "olist.sqlite", database_path)
    for name, meta in schema.items():
        meta["row_count"] = row_counts.get(name, 0)
    payload = {
        "format": "datapath-sql-praktikum",
        "version": "3.1",
        "source": "SQL Praktikum v3.1",
        "dataset": {
            "name": "Brazilian E-Commerce Public Dataset by Olist",
            "variant": "deterministic relational 25% sample for offline study",
            "database": "olist-practice.sqlite",
            "size_bytes": database_path.stat().st_size,
        },
        "sections": sections,
        "schema": schema,
        "tasks": tasks,
    }
    write_json(OUTPUT / "sql-praktikum.json", payload)
    return {
        "tasks": len(tasks),
        "sections": len(sections),
        "database_bytes": database_path.stat().st_size,
        "kinds": dict(Counter(str(task.get("kind", "practice")) for task in tasks)),
    }


def export_algopath(source: Path) -> dict[str, Any]:
    problems: list[dict[str, Any]] = []
    for path in sorted((source / "content" / "problems").glob("*.yaml")):
        with path.open(encoding="utf-8") as handle:
            problem = yaml.safe_load(handle)
        problem["source_file"] = path.name
        problems.append(problem)

    payload = {
        "format": "datapath-algopath",
        "version": "1.0",
        "source": "AlgoPath",
        "problems": problems,
    }
    write_json(OUTPUT / "algopath.json", payload)
    (OUTPUT / "algopath-runner.py").write_text(
        (source / "services" / "runner" / "runner.py").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    return {
        "problems": len(problems),
        "topics": len({problem["topic"] for problem in problems}),
        "priorities": dict(
            Counter(
                problem.get("interview_priority", "important") for problem in problems
            )
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sql-source",
        type=Path,
        default=ROOT.parent / "sql_praktikum_v3_1",
    )
    parser.add_argument(
        "--algopath-source",
        type=Path,
        default=ROOT.parent / "AlgoPath",
    )
    args = parser.parse_args()
    sql_summary = export_sql_project(args.sql_source.resolve())
    algo_summary = export_algopath(args.algopath_source.resolve())
    assets = {
        path.name: asset_integrity(path)
        for path in sorted(OUTPUT.iterdir())
        if path.is_file() and path.name != "manifest.json"
    }
    summary = {"sql": sql_summary, "algorithms": algo_summary, "assets": assets}
    write_json(OUTPUT / "manifest.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
