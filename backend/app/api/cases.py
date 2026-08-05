"""Cases API: GET /api/cases, GET /api/cases/{id}, POST submit, GET attempts.

Структурированные кейсы (Фаза 4). Оценка и evidence — на backend;
frontend только отображает спецификацию и отправляет ответы.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.cases.service import ALLOWED_MODES, CaseService

router = APIRouter(prefix="/cases", tags=["cases"])


def get_case_service() -> CaseService:
    return CaseService()


CaseDep = Annotated[CaseService, Depends(get_case_service)]


class CaseSubmitRequest(BaseModel):
    mode: str = "standard"
    answers: dict[str, Any]


@router.get("")
def list_cases(service: CaseDep, mode: str = "standard") -> dict[str, Any]:
    if mode not in ALLOWED_MODES:
        raise HTTPException(
            status_code=422,
            detail=f"Недопустимый режим {mode!r}. Доступны: {', '.join(ALLOWED_MODES)}",
        )
    return {"cases": service.list_cases(mode)}


@router.get("/{case_id}")
def get_case(service: CaseDep, case_id: str, mode: str = "standard") -> dict[str, Any]:
    if mode not in ALLOWED_MODES:
        raise HTTPException(
            status_code=422,
            detail=f"Недопустимый режим {mode!r}. Доступны: {', '.join(ALLOWED_MODES)}",
        )
    spec = service.get_case(case_id, mode)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Кейс {case_id!r} не найден")
    return spec


@router.post("/{case_id}/submit")
def submit_case(
    case_id: str,
    payload: CaseSubmitRequest,
    service: CaseDep,
) -> dict[str, Any]:
    try:
        return service.submit(case_id, payload.mode, payload.answers)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Кейс {case_id!r} не найден") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{case_id}/attempts")
def case_attempts(case_id: str, service: CaseDep) -> dict[str, Any]:
    spec = service.get_case(case_id)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Кейс {case_id!r} не найден")
    return {"case_id": case_id, "attempts": service.attempts(case_id)}
