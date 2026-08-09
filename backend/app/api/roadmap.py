"""Learning Roadmap API."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.services.roadmap import RoadmapService

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


def get_roadmap_service() -> RoadmapService:
    return RoadmapService()


RoadmapDep = Annotated[RoadmapService, Depends(get_roadmap_service)]


@router.get("")
def roadmap(service: RoadmapDep) -> dict[str, Any]:
    return service.build()
