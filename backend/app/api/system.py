"""GET /api/system/status — технический статус системы.

ВНИМАНИЕ: ответ никогда не содержит абсолютных путей файловой системы.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.backup import BackupService
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


def get_backup_service() -> BackupService:
    return BackupService()


router = APIRouter(tags=["system"])


@router.get("/system/status", response_model=SystemStatusResponse)
def system_status(
    service: Annotated[SystemStatusService, Depends(get_system_service)],
) -> SystemStatusResponse:
    return service.get_status()


@router.get("/system/backup")
def export_backup(
    service: Annotated[BackupService, Depends(get_backup_service)],
) -> dict:
    return service.export()


@router.post("/system/restore")
def restore_backup(
    payload: dict,
    service: Annotated[BackupService, Depends(get_backup_service)],
) -> dict:
    try:
        restored = service.restore(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"status": "restored", "rows": restored}
