"""Clock abstraction и timezone-границы для интервального повторения (Фаза 5).

Все timestamps в БД — ISO-8601 UTC. Границы «сегодня» (start/end of day)
вычисляются в конфигурируемой IANA timezone (settings.timezone), чтобы
алгоритм не зависел от timezone контейнера. Тесты фиксируют время через
freeze() и не зависят от системных часов.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, tzinfo
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def parse_utc(value: str) -> datetime:
    """ISO-строка → aware datetime UTC."""
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def utc_now() -> datetime:
    return datetime.now(UTC)


class ReviewClock:
    """Детерминированное время для сервисов повторения.

    freeze(iso) фиксирует now() — используется в тестах вместо реальных
    системных часов.
    """

    def __init__(self, timezone_name: str = "Europe/Moscow") -> None:
        self.timezone_name = timezone_name
        self._now: datetime | None = None

    @property
    def tz(self) -> tzinfo:
        try:
            return ZoneInfo(self.timezone_name)
        except ZoneInfoNotFoundError:
            # Некорректная настройка не ломает алгоритм: fallback на UTC.
            return UTC

    def now(self) -> datetime:
        """Текущее время в UTC (aware)."""
        if self._now is not None:
            return self._now
        return utc_now()

    def now_iso(self) -> str:
        return self.now().isoformat(timespec="seconds")

    def freeze(self, iso: str) -> None:
        """Фиксирует время для детерминированных тестов."""
        self._now = parse_utc(iso)

    def unfreeze(self) -> None:
        self._now = None

    def day_bounds(self, moment: datetime | None = None) -> tuple[datetime, datetime]:
        """Границы «сегодня» в UTC: (start_of_day, end_of_day].

        Локальный день вычисляется в settings.timezone, затем переводится
        в UTC. end_of_day — start следующего дня (полуоткрытый интервал).
        """
        local = (moment or self.now()).astimezone(self.tz)
        start_local = local.replace(hour=0, minute=0, second=0, microsecond=0)
        end_local = start_local + timedelta(days=1)
        return start_local.astimezone(UTC), end_local.astimezone(UTC)

    def start_of_day_utc(self, moment: datetime | None = None) -> datetime:
        return self.day_bounds(moment)[0]

    def end_of_day_utc(self, moment: datetime | None = None) -> datetime:
        return self.day_bounds(moment)[1]

    def add_interval(self, days: float) -> datetime:
        """now + interval в днях (дробный интервал — минуты/часы тоже)."""
        return self.now() + timedelta(days=days)
