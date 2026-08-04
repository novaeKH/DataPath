from __future__ import annotations
from pathlib import Path
import json, re, sys, yaml, unicodedata

ROOT = Path(__file__).resolve().parents[1]
errors=[]; warnings=[]; ids={}; files={}

def read(path): return path.read_text("utf-8")
def fm(path):
    text=read(path)
    if not text.startswith("---\n"):
        return None
    end=text.find("\n---\n",4)
    if end<0: return None
    try: return yaml.safe_load(text[4:end]) or {}
    except Exception as e:
        errors.append(f"YAML: {path.relative_to(ROOT)}: {e}")
        return {}

for p in ROOT.rglob("*.md"):
    rel_parts=p.relative_to(ROOT).parts
    if any(part.startswith('.') for part in rel_parts) or '90 Шаблоны' in rel_parts:
        continue
    rel=p.relative_to(ROOT).as_posix(); files[p.stem]=rel
    if unicodedata.normalize("NFC", rel)!=rel:
        errors.append(f"Path is not NFC: {rel}")
    data=fm(p)
    if data is None:
        errors.append(f"No frontmatter: {rel}"); continue
    for key in ["title","id","type","area","status","schema_version","language","rag","app"]:
        if key not in data: errors.append(f"Missing {key}: {rel}")
    nid=data.get("id")
    if nid:
        if nid in ids: errors.append(f"Duplicate id {nid}: {ids[nid]} and {rel}")
        ids[nid]=rel
    if data.get("rag")=="include" and not data.get("rag_collection"):
        warnings.append(f"RAG include without collection: {rel}")
    if data.get("type")=="solution" and data.get("rag")!="exclude":
        errors.append(f"Solution must be excluded from RAG: {rel}")
    if data.get("type")=="lesson":
        for key in ["course_id","module_id","content_path","skill_ids","estimated_minutes"]:
            if not data.get(key): errors.append(f"Lesson missing {key}: {rel}")
        cp=data.get("content_path")
        if cp and not (ROOT/cp).exists(): errors.append(f"Missing content_path {cp}: {rel}")

# Check generated catalog references.
cat=ROOT/"_meta/generated/app_catalog.json"
if cat.exists():
    try: json.loads(cat.read_text("utf-8"))
    except Exception as e: errors.append(f"Invalid app catalog: {e}")
else: warnings.append("app_catalog.json missing; run build_catalog.py")

print(f"Validated {len(ids)} Markdown IDs")
for w in warnings: print("WARN",w)
for e in errors: print("ERROR",e)
if errors:
    sys.exit(1)
print("OK")
