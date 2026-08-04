"""GET /api/system/status — технический статус системы.

ВНИМАНИЕ: ответ никогда не содержит абсолютных путей файловой системы.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.system import SystemStatusService


class DatabaseStatus(BaseModel):
    available: bool


class VaultStatus(BaseModel):
    exists: bool
    markdown_files: int


class SystemStatusResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: DatabaseStatus
    vault: VaultStatus
    ollama: str
    chromadb: str


def get_system_service() -> SystemStatusService:
    return SystemStatusService()


router = APIRouter(tags=["system"])


@router.get("/system/status", response_model=SystemStatusResponse)
def system_status(
    service: Annotated[SystemStatusService, Depends(get_system_service)],
) -> SystemStatusResponse:
    return service.get_status()
