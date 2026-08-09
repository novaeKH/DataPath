"""Export the read-only learning catalogue used by native/offline clients."""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app
from app.services.cases.registry import DEFAULT_CASE_REGISTRY
from app.services.practice import RELEASE_PRACTICE_EXERCISES


def _get(client: TestClient, path: str, *, optional: bool = False):
    response = client.get(path)
    if optional and response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()


def build_snapshot() -> dict:
    settings = get_settings()
    client = TestClient(create_app(settings))
    reads: dict[str, object] = {}

    fixed_paths = (
        "/api/system/status",
        "/api/content/status",
        "/api/content/courses",
        "/api/atlas",
        "/api/roadmap",
        "/api/progress/summary",
        "/api/progress/skills",
        "/api/today",
        "/api/practice",
        "/api/cases?mode=standard",
        "/api/reviews/summary",
        "/api/reviews/queue?limit=30",
        "/api/reviews/history?limit=20",
    )
    for path in fixed_paths:
        reads[path] = _get(client, path)

    course_rows = reads["/api/content/courses"]["courses"]  # type: ignore[index]
    lesson_ids: set[str] = set()
    lab_ids: set[str] = set()
    for course in course_rows:  # type: ignore[assignment]
        course_id = course["id"]
        path = f"/api/content/courses/{course_id}"
        detail = _get(client, path)
        reads[path] = detail
        for module in detail["modules"]:
            for lesson in module["lessons"]:
                lesson_ids.add(lesson["id"])

    for lesson_id in sorted(lesson_ids):
        path = f"/api/content/lessons/{lesson_id}"
        detail = _get(client, path)
        reads[path] = detail
        lab_ids.update(detail.get("laboratory_ids", []))
        progress_path = f"/api/progress/lessons/{lesson_id}"
        progress = _get(client, progress_path, optional=True)
        if progress is not None:
            reads[progress_path] = progress
        summary_path = f"/api/reviews/summary?lesson_id={lesson_id}"
        reads[summary_path] = _get(client, summary_path)

    for lab_id in sorted(lab_ids):
        path = f"/api/labs/{lab_id}"
        reads[path] = _get(client, path)

    case_payload = reads["/api/cases?mode=standard"]  # type: ignore[assignment]
    cases = case_payload.get("cases", [])  # type: ignore[union-attr]
    for case in cases:
        case_id = case["id"]
        reads[f"/api/cases/{case_id}?mode=standard"] = _get(
            client, f"/api/cases/{case_id}?mode=standard"
        )
        reads[f"/api/cases/{case_id}/attempts"] = _get(client, f"/api/cases/{case_id}/attempts")

    queue = reads["/api/reviews/queue?limit=30"]  # type: ignore[assignment]
    for item in queue.get("items", []):  # type: ignore[union-attr]
        review_id = item["id"]
        reads[f"/api/reviews/{review_id}"] = _get(client, f"/api/reviews/{review_id}")

    return {
        "format": "datapath-release-snapshot",
        "schema_version": 1,
        "app_version": settings.app_version,
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "reads": reads,
        "practice_runtime": {
            exercise["id"]: {
                "solution": exercise["solution"],
                "required": exercise.get("required", []),
                "ordered": exercise.get("ordered", True),
                "skill_id": exercise["skill_id"],
            }
            for exercise in RELEASE_PRACTICE_EXERCISES
        },
        "case_runtime": {
            case_id: {
                "skill_ids": case.skill_ids,
                "practice_kind": case.practice_kind,
                "conclusion": case.conclusion,
                "questions": [
                    {
                        "id": question.id,
                        "type": question.type,
                        "options": question.options,
                        "correct": question.correct,
                        "numeric_tolerance": question.numeric_tolerance,
                        "weight": question.weight,
                        "explanation": question.explanation,
                        "topic": question.topic,
                    }
                    for question in case.questions
                ],
            }
            for case_id in DEFAULT_CASE_REGISTRY.ids()
            if (case := DEFAULT_CASE_REGISTRY.get(case_id)) is not None
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        default="../frontend/public/data/release-snapshot.json",
        help="Path relative to backend working directory",
    )
    args = parser.parse_args()
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(build_snapshot(), ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Release snapshot: {output} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
