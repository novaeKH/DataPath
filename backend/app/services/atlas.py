"""Построение данных Atlas для GET /api/atlas.

Backend отдаёт готовую структуру (узлы, рёбра, маршруты, области, типы)
и детерминированную раскладку — frontend только рисует SVG.

Раскладка детерминированная: зависит только от данных каталога, без
случайности и force-directed поведения. При обновлении страницы позиции
узлов не меняются.

Направления рёбер:
- prerequisite: source → target (source нужно знать до target);
- applied_in: lesson → concept (концепция применяется в уроке);
- link: обычная ссылка.
"""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    ContentItem,
    ContentLink,
    LessonProgress,
    SkillAssessment,
)
from app.services.knowledge_model import (
    STATE_DEVELOPING,
    STATE_EXPLORING,
    STATE_NEEDS_ATTENTION,
    STATE_NOT_STARTED,
    STATE_STRONG,
)

# Типы, которые участвуют в Atlas (курс и теория вокруг него).
ATLAS_TYPES: frozenset[str] = frozenset({"course", "module", "lesson", "practice", "concept"})

# Геометрия детерминированной раскладки.
COL_WIDTH = 280
ROW_HEIGHT = 96
ROUTE_X0 = 60
ROUTE_Y0 = 60
MODULE_OFFSET_X = 220
LESSON_OFFSET_Y = 150
KNOWLEDGE_OFFSET_X = 120
KNOWLEDGE_COL_WIDTH = 320

# Пороги для агрегации состояния узла (согласованы с knowledge_model.py).
NODE_STRONG_MIN = 3
NODE_DEVELOPING_MIN = 2
NODE_NEEDS_ATTENTION_SCORE = 0.45


def aggregate_node_state(
    assessments: list[SkillAssessment],
    lesson_progress: LessonProgress | None,
) -> tuple[str, str]:
    """Состояние узла Atlas по связанным навыкам и прогрессу урока.

    При отсутствии evidence — not_started. Урок, начатый без измерений,
    получает exploring (изучается). Остальное — те же правила, что в
    KnowledgeModelService (средняя оценка по осям с evidence).
    """
    scored: list[tuple[str, float, int]] = []
    total_evidence = 0
    for assessment in assessments:
        total_evidence += assessment.evidence_count
        for axis, data in (assessment.axes or {}).items():
            if data.get("evidence_count", 0) > 0:
                scored.append((axis, data["score"], data["evidence_count"]))

    if total_evidence <= 0:
        if lesson_progress is not None:
            return STATE_EXPLORING, "Урок начат, измерений ещё нет."
        return STATE_NOT_STARTED, "Нет измерений — не изучалось."

    avg_score = sum(score for _, score, _ in scored) / len(scored)
    # Учитываем ошибки: если у узла есть needs_attention навык — узел слабый.
    if any(a.state == STATE_NEEDS_ATTENTION for a in assessments):
        return (
            STATE_NEEDS_ATTENTION,
            f"Есть навык с повторяющимися ошибками; средняя оценка {avg_score:.2f}.",
        )
    if total_evidence >= NODE_STRONG_MIN and avg_score >= 0.75:
        return (
            STATE_STRONG,
            f"Уверенное владение: {total_evidence} измерений, средняя оценка {avg_score:.2f}.",
        )
    if total_evidence >= NODE_DEVELOPING_MIN and avg_score >= 0.5:
        return (
            STATE_DEVELOPING,
            f"Развивается: {total_evidence} измерений, средняя оценка {avg_score:.2f}.",
        )
    if total_evidence >= NODE_DEVELOPING_MIN and avg_score < NODE_NEEDS_ATTENTION_SCORE:
        return (
            STATE_NEEDS_ATTENTION,
            f"Низкая оценка {avg_score:.2f} при {total_evidence} измерениях.",
        )
    return (
        STATE_EXPLORING,
        f"Изучается: {total_evidence} измерений, средняя оценка {avg_score:.2f}.",
    )


class AtlasBuilder:
    """Собирает payload Atlas из каталога."""

    def build(self, db: Session) -> dict:
        items = {item.id: item for item in db.scalars(select(ContentItem)).all()}
        links = db.scalars(select(ContentLink)).all()
        assessments = {a.skill_id: a for a in db.scalars(select(SkillAssessment)).all()}
        lesson_progress = {p.lesson_id: p for p in db.scalars(select(LessonProgress)).all()}

        # Замыкание: опубликованные объекты курса + связанная теория.
        in_scope: set[str] = {
            item.id for item in items.values() if item.publish and item.type in ATLAS_TYPES
        }
        changed = True
        while changed:
            changed = False
            for link in links:
                src = items.get(link.source_id)
                dst = items.get(link.target_id)
                if src is None or dst is None:
                    continue
                if (
                    link.source_id in in_scope
                    and dst.type in ATLAS_TYPES
                    and dst.id not in in_scope
                ):
                    in_scope.add(dst.id)
                    changed = True
                if (
                    link.target_id in in_scope
                    and src.type in ATLAS_TYPES
                    and src.id not in in_scope
                ):
                    in_scope.add(src.id)
                    changed = True

        nodes = [items[i] for i in in_scope]
        node_types = sorted({n.type for n in nodes})
        areas = sorted({n.area for n in nodes if n.area})

        # Рёбра только между узлами в области Atlas.
        edges: list[dict] = []
        prerequisites: list[dict] = []
        for link in links:
            if link.source_id not in in_scope or link.target_id not in in_scope:
                continue
            edge = {
                "source": link.source_id,
                "target": link.target_id,
                "relation": link.relation,
                "kind": link.kind,
            }
            if link.relation == "prerequisite":
                prerequisites.append(edge)
            else:
                edges.append(edge)

        routes = self._build_routes(items, in_scope)
        layout = self._layout(nodes, routes)

        # Навыки, связанные с каждым узлом (для состояния).
        node_skills = self._node_skills(items, links, in_scope)

        return {
            "nodes": [
                {
                    "id": node.id,
                    "label": node.title,
                    "type": node.type,
                    "area": node.area,
                    "publish": node.publish,
                    "status": self._node_status(
                        node,
                        node_skills.get(node.id, []),
                        assessments,
                        lesson_progress,
                    ),
                    "course_id": node.course_id,
                    "module_id": node.module_id,
                    "x": layout["positions"][node.id][0],
                    "y": layout["positions"][node.id][1],
                }
                for node in sorted(nodes, key=lambda n: n.id)
            ],
            "edges": sorted(edges, key=lambda e: (e["source"], e["target"], e["relation"])),
            "prerequisites": sorted(prerequisites, key=lambda e: (e["source"], e["target"])),
            "areas": areas,
            "node_types": node_types,
            "routes": routes,
            "layout": {
                "width": layout["width"],
                "height": layout["height"],
                "mode": "deterministic",
            },
        }

    @staticmethod
    def _node_skills(
        items: dict[str, ContentItem],
        links: list[ContentLink],
        in_scope: set[str],
    ) -> dict[str, list[str]]:
        """Навыки узла: собственные + навыки связанных уроков.

        - lesson: собственные skill_ids;
        - concept/practice: собственные + навыки уроков, связанных ребром;
        - course/module: навыки уроков курса/модуля (агрегация дочерних).
        """
        result: dict[str, list[str]] = {}
        for item_id in in_scope:
            item = items[item_id]
            skills = list(item.skill_ids or [])
            result[item_id] = skills

        # Связанные уроки (для concept/practice): урок → концепция.
        for link in links:
            if link.relation not in {"applied_in", "link"}:
                continue
            src = items.get(link.source_id)
            dst = items.get(link.target_id)
            if src is None or dst is None:
                continue
            if src.type == "lesson" and dst.id in result and src.id in in_scope:
                result[dst.id].extend(src.skill_ids or [])
            if dst.type == "lesson" and src.id in result and dst.id in in_scope:
                result[src.id].extend(dst.skill_ids or [])

        # Агрегация курса/модуля по дочерним урокам.
        for item_id in in_scope:
            item = items[item_id]
            if item.type == "course":
                children = [
                    c for c in items.values() if c.course_id == item.id and c.type == "lesson"
                ]
            elif item.type == "module":
                children = [
                    c for c in items.values() if c.module_id == item.id and c.type == "lesson"
                ]
            else:
                continue
            for child in children:
                result[item_id].extend(child.skill_ids or [])

        # Уникализация и порядок.
        return {key: list(dict.fromkeys(values)) for key, values in result.items()}

    def _node_status(
        self,
        node: ContentItem,
        skills: list[str],
        assessments: dict[str, SkillAssessment],
        lesson_progress: dict[str, LessonProgress],
    ) -> str:
        """Состояние узла: только статус (без причины — причина в карточке)."""
        related = [assessments[s] for s in skills if s in assessments]
        progress = lesson_progress.get(node.id)
        state, _ = aggregate_node_state(related, progress)
        return state

    @staticmethod
    def _build_routes(items: dict[str, ContentItem], in_scope: set[str]) -> dict:
        """Маршруты курсов: модули по порядку, уроки/кейсы по порядку внутри модуля."""
        courses = [item for item in items.values() if item.type == "course" and item.id in in_scope]
        routes: dict[str, dict] = {}
        for course in sorted(courses, key=lambda c: c.path):
            modules = sorted(
                (
                    item
                    for item in items.values()
                    if item.course_id == course.id and item.type == "module"
                ),
                key=lambda m: (m.module_order if m.module_order is not None else 10**6, m.path),
            )
            lessons = sorted(
                (
                    item
                    for item in items.values()
                    if item.course_id == course.id and item.type == "lesson"
                ),
                key=lambda lesson: (
                    lesson.module_order if lesson.module_order is not None else 10**6,
                    lesson.lesson_order if lesson.lesson_order is not None else 10**6,
                    lesson.path,
                ),
            )
            cases = sorted(
                (
                    item
                    for item in items.values()
                    if item.course_id == course.id and item.type == "practice"
                ),
                key=lambda p: (p.module_order if p.module_order is not None else 10**6, p.path),
            )
            lessons_by_module: dict[str, list[str]] = defaultdict(list)
            for lesson in lessons:
                key = lesson.module_id or "standalone"
                lessons_by_module[key].append(lesson.id)
            routes[course.id] = {
                "modules": [m.id for m in modules],
                "lessons": dict(lessons_by_module),
                "cases": [c.id for c in cases],
            }
        return routes

    def _layout(self, nodes: list[ContentItem], routes: dict) -> dict:
        """Детерминированная раскладка: полоса маршрута курса + полоса знаний."""
        positions: dict[str, tuple[float, float]] = {}
        max_y = ROUTE_Y0

        by_id = {n.id: n for n in nodes}

        # Полоса маршрута: курс → модули (колонки) → уроки/кейсы.
        course = next((n for n in sorted(nodes, key=lambda n: n.path) if n.type == "course"), None)
        if course is not None:
            positions[course.id] = (ROUTE_X0, ROUTE_Y0)
            route = routes.get(course.id)
            if route:
                # Модули в порядке; кейсы привязываются к колонке по module_order.
                modules_by_order: dict[int, str] = {}
                for module_id in route["modules"]:
                    module = by_id.get(module_id)
                    if module is not None and module.module_order is not None:
                        modules_by_order[module.module_order] = module_id
                cases_by_column: dict[str, list[str]] = defaultdict(list)
                for case_id in route["cases"]:
                    case = by_id.get(case_id)
                    if case is None:
                        continue
                    if case.module_id is not None:
                        cases_by_column[case.module_id].append(case_id)
                    elif case.module_order is not None and case.module_order in modules_by_order:
                        cases_by_column[modules_by_order[case.module_order]].append(case_id)
                    else:
                        cases_by_column["standalone"].append(case_id)
                for col, module_id in enumerate(route["modules"]):
                    module_x = ROUTE_X0 + MODULE_OFFSET_X + col * COL_WIDTH
                    positions[module_id] = (module_x, ROUTE_Y0)
                    lesson_ids = route["lessons"].get(module_id, [])
                    case_ids = cases_by_column.get(module_id, [])
                    for row, item_id in enumerate([*lesson_ids, *case_ids]):
                        positions[item_id] = (
                            module_x,
                            ROUTE_Y0 + LESSON_OFFSET_Y + row * ROW_HEIGHT,
                        )
                        max_y = max(max_y, ROUTE_Y0 + LESSON_OFFSET_Y + row * ROW_HEIGHT)

        # Полоса знаний: концепции и практика по областям.
        knowledge = [n for n in nodes if n.id not in positions]
        if knowledge:
            area_groups: dict[str, list[ContentItem]] = defaultdict(list)
            for node in knowledge:
                area_groups[node.area or "other"].append(node)
            area_order = sorted(area_groups)
            knowledge_x = ROUTE_X0 + MODULE_OFFSET_X + (len(positions) + 2) * COL_WIDTH
            row_base = ROUTE_Y0 + 40
            for col, area in enumerate(area_order):
                x = knowledge_x + col * KNOWLEDGE_COL_WIDTH
                for row, node in enumerate(sorted(area_groups[area], key=lambda n: n.id)):
                    positions[node.id] = (x, row_base + row * ROW_HEIGHT)
                    max_y = max(max_y, row_base + row * ROW_HEIGHT)

        width = max((x for x, _ in positions.values()), default=ROUTE_X0) + 160
        height = max_y + 120
        return {"positions": positions, "width": int(width), "height": int(height)}
