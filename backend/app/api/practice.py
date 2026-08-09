"""Local practice API."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services.practice import PracticeService

router = APIRouter(prefix="/practice", tags=["practice"])


def get_service() -> PracticeService:
    return PracticeService()


PracticeDep = Annotated[PracticeService, Depends(get_service)]


class SqlRunRequest(BaseModel):
    exercise_id: str
    query: str = Field(min_length=1, max_length=20_000)


class CodeCheckRequest(BaseModel):
    exercise_id: str
    code: str = Field(min_length=1, max_length=20_000)


@router.get("")
def catalog(service: PracticeDep) -> dict:
    return service.catalog()


@router.post("/sql/run")
def run_sql(payload: SqlRunRequest, service: PracticeDep) -> dict:
    try:
        return service.run_sql(payload.exercise_id, payload.query)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Упражнение не найдено") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/code/check")
def check_code(payload: CodeCheckRequest, service: PracticeDep) -> dict:
    try:
        return service.check_code(payload.exercise_id, payload.code)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Упражнение не найдено") from exc
