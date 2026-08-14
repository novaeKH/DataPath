"""Content API: GET /api/content/status, /courses, /courses/{id}, /items/{id},
/lessons/{id}, /api/atlas.

Ответы содержат только относительные пути vault и готовые данные для UI.
Абсолютные пути файловой системы не возвращаются.

Фаза 3 добавляет:
- GET /api/content/courses/{course_id} — курс с модулями, уроками и кейсами;
- GET /api/content/lessons/{lesson_id} — урок с нормализованными сценами.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.reviews import get_review_queue_service as reviews_get_review_queue_service
from app.services.content_catalog import ContentCatalogService
from app.services.lesson_content import LessonContentService
from app.services.reviews.queue import ReviewQueueService

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
    mastery_percent: int = 0
    review_due: bool = False
    review_due_count: int = 0
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


def get_lesson_service() -> LessonContentService:
    return LessonContentService()


CatalogDep = Annotated[ContentCatalogService, Depends(get_catalog_service)]
LessonDep = Annotated[LessonContentService, Depends(get_lesson_service)]
get_review_queue_service = reviews_get_review_queue_service
ReviewQueueDep = Annotated[ReviewQueueService, Depends(get_review_queue_service)]


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


# --- Фаза 3: курс и урок со сценами ---


class LessonRef(BaseModel):
    id: str
    title: str
    lesson_order: int | None = None
    estimated_minutes: int | None = None
    difficulty: str | None = None
    skills: list[str] = Field(default_factory=list)
    laboratory_ids: list[str] = Field(default_factory=list)


class CourseModule(BaseModel):
    id: str
    title: str
    order: int | None = None
    estimated_minutes: int | None = None
    lessons: list[LessonRef] = Field(default_factory=list)


class CourseCaseRef(BaseModel):
    id: str
    title: str
    practice_kind: str | None = None
    estimated_minutes: int | None = None
    difficulty: str | None = None


class CourseDetailResponse(BaseModel):
    id: str
    title: str
    slug: str
    area: str | None = None
    difficulty: str | None = None
    estimated_hours: float | None = None
    accent: str | None = None
    icon: str | None = None
    modules: list[CourseModule] = Field(default_factory=list)
    cases: list[CourseCaseRef] = Field(default_factory=list)
    first_lesson_id: str | None = None
    last_lesson_id: str | None = None


class LessonScene(BaseModel):
    id: str
    type: str
    title: str | None = None
    display_title: str | None = None
    markdown: str | None = None
    intro: str | None = None
    formula: str | None = None
    explanation: str | None = None
    language: str | None = None
    code: str | None = None
    caption: str | None = None
    callout_type: str | None = None
    question: str | None = None
    lab_id: str | None = None
    lab_title: str | None = None
    demo_id: str | None = None
    checkpoint_kind: str | None = None
    assessment_type: str | None = None
    # Фаза 6A: метаданные сцены
    word_count: int = 0
    source_content_id: str | None = None
    source_heading: str | None = None
    semantic_role: str | None = None
    contains_formula: bool = False
    contains_code: bool = False
    contains_visual: bool = False


class HeadingResolution(BaseModel):
    """Диагностика source_heading: exact | normalized | fallback | missing."""

    requested_heading: str | None = None
    status: str
    selected_heading: str | None = None
    known_alias: str | None = None


class LessonMaterialRef(BaseModel):
    id: str
    title: str
    type: str
    path: str


class ModuleRef(BaseModel):
    id: str
    title: str
    order: int | None = None


class CourseRef(BaseModel):
    id: str
    title: str


class LessonPrerequisiteRef(BaseModel):
    id: str
    title: str
    course_id: str | None = None


class LessonDetailResponse(BaseModel):
    id: str
    title: str
    slug: str
    module: ModuleRef | None = None
    course: CourseRef | None = None
    estimated_minutes: int | None = None
    difficulty: str | None = None
    skills: list[str] = Field(default_factory=list)
    prerequisites: list[LessonPrerequisiteRef] = Field(default_factory=list)
    previous_lesson_id: str | None = None
    next_lesson_id: str | None = None
    scenes: list[LessonScene] = Field(default_factory=list)
    laboratory_ids: list[str] = Field(default_factory=list)
    materials: list[LessonMaterialRef] = Field(default_factory=list)
    # Фаза 6A: диагностика source_heading + source metadata (обратно совместимо)
    heading_resolution: list[HeadingResolution] = Field(
        default_factory=list,
        description="Статусы source_heading (exact/normalized/fallback/missing)",
    )
    source_content_id: str | None = None
    source_path: str | None = None


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
def content_course_detail(course_id: str, service: LessonDep) -> CourseDetailResponse:
    data = service.course_detail(course_id)
    if data is None:
        raise HTTPException(
            status_code=404, detail=f"Курс {course_id!r} не найден или не опубликован"
        )
    return CourseDetailResponse(**data)


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
def content_lesson_detail(lesson_id: str, service: LessonDep) -> LessonDetailResponse:
    data = service.lesson(lesson_id)
    if data is None:
        raise HTTPException(
            status_code=404, detail=f"Урок {lesson_id!r} не найден или не опубликован"
        )
    return LessonDetailResponse(**data)


@router.get("/atlas", response_model=AtlasResponse)
def content_atlas(service: CatalogDep, reviews: ReviewQueueDep) -> AtlasResponse:
    return AtlasResponse(**service.atlas(review_counts=reviews.overdue_counts_by_lesson()))


# GET /api/atlas — отдельный путь без префикса /content (см. задание Фазы 2).
atlas_router = APIRouter(tags=["atlas"])


@atlas_router.get("/atlas", response_model=AtlasResponse)
def atlas(service: CatalogDep, reviews: ReviewQueueDep) -> AtlasResponse:
    return AtlasResponse(**service.atlas(review_counts=reviews.overdue_counts_by_lesson()))
