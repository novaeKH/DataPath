"""Базовое логирование."""

import logging

_CONFIGURED = False


def setup_logging(level: str = "INFO") -> None:
    """Настраивает корневой логгер. Безопасно вызывать несколько раз."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    )
    _CONFIGURED = True
