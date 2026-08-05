"""Today API: главный экран (Фаза 4).

Правила:
1. Сначала продолжить незавершённый урок.
2. Затем следующий урок маршрута.
3. Слабые темы только при достаточном evidence.
4. Без очереди интервального повторения (Фаза 5).
5. При отсутствии данных — понятный стартовый сценарий.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.services.progress import ProgressService

router = APIRouter(prefix="/today", tags=["today"])


def get_progress_service() -> ProgressService:
    return ProgressService()


ProgressDep = Annotated[ProgressService, Depends(get_progress_service)]


@router.get("")
def today(service: ProgressDep) -> dict[str, Any]:
    return service.today()
