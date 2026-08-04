"""CLI-команды работы с контентом.

Примеры:
    PYTHONPATH= uv run python -m app.cli.content sync
    PYTHONPATH= uv run python -m app.cli.content validate
    PYTHONPATH= uv run python -m app.cli.content status
"""

from __future__ import annotations

import argparse
import sys

from app.services.content_catalog import ContentCatalogService
from app.services.content_sync import ContentSyncService


def _print_report(report) -> None:
    print("Синхронизация завершена:")
    print(f"  scanned:   {report.scanned}")
    print(f"  created:   {report.created}")
    print(f"  updated:   {report.updated}")
    print(f"  unchanged: {report.unchanged}")
    print(f"  removed:   {report.removed}")
    print(f"  errors:    {report.errors}")
    print(f"  warnings:  {report.warnings}")
    if report.last_sync_at:
        print(f"  last_sync: {report.last_sync_at}")


def _print_issues(issues) -> tuple[int, int]:
    errors = [i for i in issues if i.severity == "error"]
    warnings = [i for i in issues if i.severity == "warning"]
    print(f"Валидация: {len(errors)} ошибок, {len(warnings)} предупреждений")
    if errors:
        print("\nОшибки:")
        for issue in errors:
            print(f"  [error] {issue.path}: {issue.message}")
    if warnings:
        print("\nПредупреждения:")
        for issue in warnings:
            print(f"  [warning] {issue.path}: {issue.message}")
    return len(errors), len(warnings)


def cmd_sync(args: argparse.Namespace) -> int:
    service = ContentSyncService()
    report = service.sync()
    _print_report(report)
    if args.verbose and (report.errors or report.warnings):
        issues = service.validate_only().issues
        _print_issues(issues)
    return 0 if report.errors == 0 else 1


def cmd_validate(args: argparse.Namespace) -> int:
    service = ContentSyncService()
    result = service.validate_only()  # не изменяет БД
    errors, warnings = _print_issues(result.issues)
    return 0 if errors == 0 else 1


def cmd_status(args: argparse.Namespace) -> int:
    service = ContentCatalogService()
    status = service.status()
    print("Каталог контента:")
    print(f"  vault files:       {status['vault_files']}")
    print(f"  catalogued:        {status['total_catalogued']}")
    print(f"  published:         {status['published']}")
    print("  по типам:")
    for note_type, count in sorted(status["by_type"].items()):
        print(f"    {note_type}: {count}")
    print(f"  last sync:         {status['last_sync_at'] or '—'}")
    print(f"  errors:            {status['errors']}")
    print(f"  warnings:          {status['warnings']}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="content", description="DataPath content catalog CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    sync = subparsers.add_parser("sync", help="Синхронизировать vault → SQLite каталог")
    sync.add_argument(
        "-v", "--verbose", action="store_true", help="Показать ошибки и предупреждения"
    )
    sync.set_defaults(func=cmd_sync)

    validate = subparsers.add_parser("validate", help="Валидировать vault (без изменения БД)")
    validate.set_defaults(func=cmd_validate)

    status = subparsers.add_parser("status", help="Показать состояние каталога")
    status.set_defaults(func=cmd_status)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
