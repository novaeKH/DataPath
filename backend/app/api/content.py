"""Content API: GET /api/content/status, /courses, /items/{id}, /api/atlas.

Ответы содержат только относительные пути vault и готовые данные для UI.
Абсолютные пути файловой системы не возвращаются.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services.content_catalog import ContentCatalogService

router = APIRouter(prefix="/content", tags=["content"])


class ContentStatusResponse(BaseModel):
    vault_files: int = Field(description="Количество .md файлов в vault (без служебных каталогов)")
    total_catalogued: int = Field(description="Материалов в каталоге SQLite")
    published: int = Field(description="Опубликованных материалов (app: include)")
    by_type: dict[str, int] = Field(description="Количество материалов по типам")
    last_sync_at: str | None = Field(description="Время последней синхронизации (ISO)")
    errors: int = Field(description="Ошибок валидации (последний прогон)")
    warnings: int = Field(description="Предупреждений валидации (последний прогон)")


class CourseSummary(BaseModel):
    id: str
    title: str
    slug: str
    area: str | None = None
    difficulty: str | None = None
    estimated_hours: float | None = None
    accent: str | None = None
    icon: str | None = None
    module_count: int = 0
    lesson_count: int = 0
    practice_count: int = 0


class CoursesResponse(BaseModel):
    courses: list[CourseSummary]


class LinkInfo(BaseModel):
    target_id: str | None = None
    source_id: str | None = None
    relation: str
    kind: str


class IssueInfo(BaseModel):
    severity: str
    code: str
    message: str


class ContentItemResponse(BaseModel):
    id: str
    path: str = Field(description="Относительный путь в content/vault")
    type: str
    title: str
    slug: str
    area: str | None = None
    status: str | None = None
    language: str | None = None
    publish: bool
    rag: str | None = None
    rag_collection: str | None = None
    course_id: str | None = None
    module_id: str | None = None
    module_order: int | None = None
    lesson_order: int | None = None
    content_path: str | None = None
    practice_kind: str | None = None
    skill_ids: list | None = None
    difficulty: str | None = None
    estimated_minutes: int | None = None
    estimated_hours: float | None = None
    accent: str | None = None
    icon: str | None = None
    aliases: list | None = None
    tags: list | None = None
    prerequisites: list | None = None
    validation_status: str
    issues: list[IssueInfo] = Field(default_factory=list)
    links: dict = Field(default_factory=dict)


class AtlasNode(BaseModel):
    id: str
    label: str
    type: str
    area: str | None = None
    publish: bool
    status: str = "not_started"
    course_id: str | None = None
    module_id: str | None = None
    x: float
    y: float


class AtlasEdge(BaseModel):
    source: str
    target: str
    relation: str
    kind: str


class AtlasLayout(BaseModel):
    width: int
    height: int
    mode: str


class AtlasResponse(BaseModel):
    nodes: list[AtlasNode]
    edges: list[AtlasEdge]
    prerequisites: list[AtlasEdge]
    areas: list[str]
    node_types: list[str]
    routes: dict
    layout: AtlasLayout


def get_catalog_service() -> ContentCatalogService:
    return ContentCatalogService()


CatalogDep = Annotated[ContentCatalogService, Depends(get_catalog_service)]


@router.get("/status", response_model=ContentStatusResponse)
def content_status(service: CatalogDep) -> ContentStatusResponse:
    return ContentStatusResponse(**service.status())


@router.get("/courses", response_model=CoursesResponse)
def content_courses(service: CatalogDep) -> CoursesResponse:
    return CoursesResponse(courses=[CourseSummary(**c) for c in service.courses()])


@router.get("/items/{content_id}", response_model=ContentItemResponse)
def content_item(content_id: str, service: CatalogDep) -> ContentItemResponse:
    data = service.item(content_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Content item {content_id!r} не найден")
    return ContentItemResponse(**data)


@router.get("/atlas", response_model=AtlasResponse)
def content_atlas(service: CatalogDep) -> AtlasResponse:
    return AtlasResponse(**service.atlas())


# GET /api/atlas — отдельный путь без префикса /content (см. задание Фазы 2).
atlas_router = APIRouter(tags=["atlas"])


@atlas_router.get("/atlas", response_model=AtlasResponse)
def atlas(service: CatalogDep) -> AtlasResponse:
    return AtlasResponse(**service.atlas())
