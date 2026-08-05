"""Progress API: сводка, навыки, уроки, лаборатории (Фаза 4).

Все ответы — только агрегированные данные и относительные пути;
абсолютные пути файловой системы не принимаются и не возвращаются.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.content import get_catalog_service as content_get_catalog_service
from app.api.labs import get_lab_registry as labs_get_lab_registry
from app.db.models import ContentItem  # noqa: F401  (тип для документации)
from app.services.content_catalog import ContentCatalogService
from app.services.knowledge_model import score_level
from app.services.labs.registry import LabRegistry
from app.services.progress import ProgressService

router = APIRouter(prefix="/progress", tags=["progress"])


def get_progress_service() -> ProgressService:
    return ProgressService()


get_catalog_service = content_get_catalog_service
get_lab_registry = labs_get_lab_registry


ProgressDep = Annotated[ProgressService, Depends(get_progress_service)]
CatalogDep = Annotated[ContentCatalogService, Depends(get_catalog_service)]
LabRegistryDep = Annotated[LabRegistry, Depends(get_lab_registry)]


class SceneCompleteRequest(BaseModel):
    skill_id: str | None = None
    scene_type: str | None = None
    outcome: str = "completed"


class SceneCompleteResponse(BaseModel):
    lesson_id: str
    scene_id: str
    current_scene_id: str | None
    completed_scenes: list[str]
    started_at: str
    completed_at: str | None
    event_id: int


class LessonCompleteResponse(BaseModel):
    lesson_id: str
    completed_at: str
    skills: list[dict[str, Any]]


class LabRecordRequest(BaseModel):
    lesson_id: str | None = None
    parameters: dict[str, Any] = {}
    result_summary: dict[str, Any] | None = None
    score: float | None = Field(default=None, ge=0.0, le=1.0)


class LabRecordResponse(BaseModel):
    lab_id: str
    lesson_id: str | None
    score: float
    created_at: str
    deduplicated: bool
    evidence: list[dict[str, Any]]


def _validate_lesson(service: CatalogDep, lesson_id: str) -> None:
    item = service.item(lesson_id)
    if item is None or item["type"] != "lesson":
        raise HTTPException(status_code=404, detail=f"Урок {lesson_id!r} не найден")


@router.get("/summary")
def progress_summary(service: ProgressDep) -> dict[str, Any]:
    return service.summary()


@router.get("/skills")
def progress_skills(service: ProgressDep) -> dict[str, Any]:
    skills = service.skills_overview()
    for skill in skills:
        skill["level"] = score_level(
            max(
                (axis["score"] for axis in skill["axes"].values()),
                default=0.0,
            )
        )
    return {"skills": skills}


@router.get("/skills/{skill_id}")
def progress_skill(skill_id: str, service: ProgressDep) -> dict[str, Any]:
    detail = service.skill_detail(skill_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Навык {skill_id!r} не найден")
    axes = detail["axes"]
    detail["levels"] = {axis: score_level(data["score"]) for axis, data in axes.items()}
    return detail


@router.get("/lessons/{lesson_id}")
def progress_lesson(lesson_id: str, service: ProgressDep) -> dict[str, Any]:
    progress = service.lesson_progress(lesson_id)
    if progress is None:
        raise HTTPException(status_code=404, detail=f"Прогресс урока {lesson_id!r} не найден")
    return progress


@router.post(
    "/lessons/{lesson_id}/scenes/{scene_id}/complete",
    response_model=SceneCompleteResponse,
)
def complete_scene(
    lesson_id: str,
    scene_id: str,
    payload: SceneCompleteRequest,
    service: ProgressDep,
    catalog: CatalogDep,
) -> SceneCompleteResponse:
    _validate_lesson(catalog, lesson_id)
    # scene_id: только короткий стабильный идентификатор сцены, без путей.
    if not scene_id or scene_id.startswith("/") or "\\" in scene_id:
        raise HTTPException(status_code=422, detail="Некорректный scene_id")
    data = service.complete_scene(
        lesson_id,
        scene_id,
        skill_id=payload.skill_id,
        scene_type=payload.scene_type,
        outcome=payload.outcome,
    )
    return SceneCompleteResponse(**data)


@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse)
def complete_lesson(
    lesson_id: str,
    service: ProgressDep,
    catalog: CatalogDep,
) -> LessonCompleteResponse:
    _validate_lesson(catalog, lesson_id)
    try:
        data = service.complete_lesson(lesson_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return LessonCompleteResponse(**data)


@router.post("/labs/{lab_id}/record", response_model=LabRecordResponse)
def record_lab(
    lab_id: str,
    payload: LabRecordRequest,
    service: ProgressDep,
    registry: LabRegistryDep,
) -> LabRecordResponse:
    if registry.get(lab_id) is None:
        raise HTTPException(status_code=404, detail=f"Лаборатория {lab_id!r} не найдена")
    data = service.record_lab(
        lab_id,
        payload.parameters,
        payload.result_summary,
        score=payload.score,
        lesson_id=payload.lesson_id,
    )
    return LabRecordResponse(**data)
