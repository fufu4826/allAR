"""Build Non Hom seed data + media manifest from the team's form data.

Input : data-bundle/incoming/nonhom/mapped.json (same rows as the Google Sheet
        "แบบฟอร์มส่งข้อมูล - โนนหอม") and the files downloaded into
        data-bundle/incoming/nonhom/{โมเดล,ภาพ}/
Output: web/src/data/nonhom.json (same shape as phuphan.json)
        data-bundle/incoming/nonhom/manifest.json for web/scripts/optimize-media.mjs
Usage (repo root): python tools/bundle/build_nonhom.py
"""
import hashlib
import json
import os

ROOT = os.getcwd()
SRC = os.path.join(ROOT, "data-bundle", "incoming", "nonhom")
UPLOADS = os.path.join(ROOT, "data-bundle", "uploads")
SLUG = "nonhom"

data = json.load(open(os.path.join(SRC, "mapped.json"), encoding="utf-8"))
com, cats, rows = data["com"][0], data["cat"], data["items"]


def h(key: str) -> str:
    return hashlib.md5(f"{SLUG}:{key}".encode()).hexdigest()


manifest = []


def add(kind: str, src_rel: str, dest_rel: str) -> str | None:
    src = os.path.join(SRC, *src_rel.split("/"))
    if not os.path.isfile(src):
        print("MISSING", src_rel)
        return None
    manifest.append({"src": src, "dest": os.path.join(UPLOADS, *dest_rel.split("/")), "kind": kind})
    return "/uploads/" + dest_rel


collections = [
    {"id": h(f"col:{c[0]}"), "name": c[0], "description": c[1], "image": None} for c in cats
]
col_id = {c["name"]: c["id"] for c in collections}
items = []
for r in rows:
    name, cat, desc, glb, img = r[1], r[2], r[3], r[9], r[10]
    item_id = h(f"item:{glb or name}")
    items.append({
        "id": item_id,
        "collectionId": col_id[cat],
        "name": name,
        "description": desc,
        "model": add("model", f"โมเดล/{glb}", f"{SLUG}/models/{item_id}.glb") if glb else None,
        "thumbnail": add("image", f"ภาพ/{img}", f"{SLUG}/images/{item_id}.webp") if img else None,
        "audio": None,
    })
for c in collections:
    first = next((i for i in items if i["collectionId"] == c["id"] and i["thumbnail"]), None)
    c["image"] = first["thumbnail"] if first else None

cover = add("photo", f"ภาพ/{com[6]}", f"{SLUG}/cover.webp") if com[6] else None
out = {
    "settings": {"cover": cover, "recommended": []},
    "community": {"name": com[0], "shortName": com[1], "location": com[2], "description": com[3],
                  "lat": float(com[4]), "lng": float(com[5])},
    "collections": collections,
    "items": items,
}
with open(os.path.join(ROOT, "web", "src", "data", f"{SLUG}.json"), "w", encoding="utf-8", newline="\n") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
with open(os.path.join(SRC, "manifest.json"), "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=1)
print(f"{len(items)} items, {len(collections)} collections, {len(manifest)} media files in manifest")
