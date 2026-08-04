from __future__ import annotations
from pathlib import Path
import json, re, yaml

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_meta" / "generated"
OUT.mkdir(parents=True, exist_ok=True)

def read_fm(path: Path):
    text = path.read_text("utf-8")
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    return yaml.safe_load(text[4:end]) or {}

items=[]
for p in sorted(ROOT.rglob("*.md")):
    rel_parts = p.relative_to(ROOT).parts
    if any(part.startswith('.') for part in rel_parts) or '90 Шаблоны' in rel_parts:
        continue
    fm=read_fm(p)
    if not fm.get("id"):
        continue
    items.append({
        "id": fm["id"],
        "title": fm.get("title", p.stem),
        "type": fm.get("type"),
        "area": fm.get("area"),
        "path": p.relative_to(ROOT).as_posix(),
        "rag": fm.get("rag", "exclude"),
        "rag_collection": fm.get("rag_collection"),
        "app": fm.get("app", "exclude"),
        "course_id": fm.get("course_id"),
        "module_id": fm.get("module_id"),
        "skill_ids": fm.get("skill_ids", []),
        "estimated_minutes": fm.get("estimated_minutes"),
    })

catalog={
    "schema_version": 2,
    "courses": [x for x in items if x["type"]=="course" and x["app"]=="include"],
    "modules": [x for x in items if x["type"]=="module" and x["app"]=="include"],
    "lessons": [x for x in items if x["type"]=="lesson" and x["app"]=="include"],
    "cases": [x for x in items if x["type"]=="practice" and x["app"]=="include"],
}
(OUT/"app_catalog.json").write_text(json.dumps(catalog,ensure_ascii=False,indent=2),"utf-8")
(OUT/"content_manifest.json").write_text(json.dumps({"schema_version":2,"items":items},ensure_ascii=False,indent=2),"utf-8")
print(f"Built catalog: {len(catalog['courses'])} course, {len(catalog['modules'])} modules, {len(catalog['lessons'])} lessons, {len(catalog['cases'])} cases")
