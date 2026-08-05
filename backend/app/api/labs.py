"""Labs API: GET /api/labs/{lab_id}, POST /api/labs/{lab_id}/run.

Единый расширяемый интерфейс для всех лабораторий: registry хранит
metadata, параметры и расчёт. Валидация параметров — Pydantic внутри
каждой лаборатории, ошибки возвращаются как понятные 422.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ValidationError

from app.services.labs.registry import DEFAULT_REGISTRY, LabRegistry

router = APIRouter(prefix="/labs", tags=["labs"])


class LabParameterSpec(BaseModel):
    name: str
    label: str
    type: str
    default: Any = None
    min: float | None = None
    max: float | None = None
    step: float | None = None
    values: list[str] | None = None
    unit: str | None = None


class LabSpecResponse(BaseModel):
    id: str
    title: str
    description: str
    lesson_ids: list[str]
    parameters: list[LabParameterSpec]
    defaults: dict[str, Any]
    initial_result: dict[str, Any]


class LabRunRequest(BaseModel):
    parameters: dict[str, Any] = {}


def get_lab_registry() -> LabRegistry:
    return DEFAULT_REGISTRY


LabRegistryDep = Annotated[LabRegistry, Depends(get_lab_registry)]


@router.get("/{lab_id}", response_model=LabSpecResponse)
def lab_spec(lab_id: str, registry: LabRegistryDep) -> LabSpecResponse:
    spec = registry.spec(lab_id)
    if spec is None:
        raise HTTPException(
            status_code=404,
            detail=f"Лаборатория {lab_id!r} не найдена. Доступны: {', '.join(registry.ids())}",
        )
    return LabSpecResponse(**spec)


@router.post("/{lab_id}/run")
def lab_run(
    lab_id: str,
    payload: LabRunRequest,
    registry: LabRegistryDep,
) -> dict[str, Any]:
    lab = registry.get(lab_id)
    if lab is None:
        raise HTTPException(
            status_code=404,
            detail=f"Лаборатория {lab_id!r} не найдена. Доступны: {', '.join(registry.ids())}",
        )
    try:
        return lab.run(payload.parameters)
    except ValidationError as exc:
        errors = [
            {
                "loc": [str(loc) for loc in err.get("loc", [])],
                "msg": err.get("msg", "некорректное значение"),
            }
            for err in exc.errors()
        ]
        raise HTTPException(
            status_code=422,
            detail={"message": "Некорректные параметры лаборатории", "errors": errors},
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
