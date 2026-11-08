"""Build Tha Rae seed data + media manifest from the team's form.

Input : data-bundle/incoming/tharae/tharae-team.xlsx (export of the Google Sheet
        "แบบฟอร์มส่งข้อมูล - ท่าแร่") and the files downloaded into
        data-bundle/incoming/tharae/{โมเดล,ภาพ,เสียง}/
Output: web/src/data/tharae.json (same shape as nonhom.json)
        data-bundle/incoming/tharae/manifest.json for web/scripts/optimize-media.mjs
        (models and images; the mp3 narrations are copied as they are)
Usage (repo root): python tools/bundle/build_tharae.py
"""
import hashlib
import json
import os
import re
import shutil

from openpyxl import load_workbook

ROOT = os.getcwd()
SRC = os.path.join(ROOT, "data-bundle", "incoming", "tharae")
UPLOADS = os.path.join(ROOT, "data-bundle", "uploads")
SLUG = "tharae"

# Typos found by the liaison team (2026-11-09); fixed here so the team's form stays as sent.
FIXES = [
    ("ท่าเเร่", "ท่าแร่"),  # เ+เ instead of แ
    ("เป็็น", "เป็น"),
    ("คริตชน", "คริสตชน"),
]
DESC_FIXES = {
    # Item 21 starts with the object's short name; the form's own title is ตู้ศีลมหาสนิท.
    "ตู้ศีลมหาสนิท": [("ศีลมหาสนิท หรือตู้ศีล", "ตู้ศีลมหาสนิท หรือตู้ศีล", 1)],
}
NAME_FIXES = {"คุณพ่อซาเวียร์เกโก": "คุณพ่อซาเวียร์ เกโก"}  # matches the spelling in its description
# Featured on the home page: one per category plus the Christmas star (all 27 are marked featured).
FEATURED = ["คุณพ่อซาเวียร์ เกโก", "ชุดกาซูลา", "ดาวมือถือ", "ระฆังประวัติศาสตร์"]


def fix(text: str) -> str:
    for a, b in FIXES:
        text = text.replace(a, b)
    return text


def clean_name(text) -> str:
    text = re.sub(r"\s+", " ", fix(str(text or ""))).strip()
    return NAME_FIXES.get(text, text)


def clean_desc(text) -> str:
    """Trim each paragraph (the form starts lines with tabs/spaces) and collapse inner runs of spaces."""
    lines = [re.sub(r"[ \t ]+", " ", line).strip() for line in fix(str(text or "")).splitlines()]
    return "\n".join(line for line in lines if line)


def rows(sheet):
    ws = wb[sheet]
    values = [list(r) for r in ws.iter_rows(values_only=True)]
    return [r for r in values[1:] if any(c not in (None, "") for c in r)]


wb = load_workbook(os.path.join(SRC, "tharae-team.xlsx"), data_only=True)
com = rows("ชุมชน")[0]
cats = rows("หมวดหมู่")
items_rows = rows("รายการ")


def h(key: str) -> str:
    return hashlib.md5(f"{SLUG}:{key}".encode()).hexdigest()


manifest = []
copied_audio = 0


def add(kind: str, src_rel: str, dest_rel: str) -> str | None:
    src = os.path.join(SRC, *src_rel.split("/"))
    if not os.path.isfile(src):
        print("MISSING", src_rel)
        return None
    manifest.append({"src": src, "dest": os.path.join(UPLOADS, *dest_rel.split("/")), "kind": kind})
    return "/uploads/" + dest_rel


def copy_audio(src_rel: str, dest_rel: str) -> str | None:
    global copied_audio
    src = os.path.join(SRC, *src_rel.split("/"))
    if not os.path.isfile(src):
        print("MISSING", src_rel)
        return None
    dest = os.path.join(UPLOADS, *dest_rel.split("/"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copyfile(src, dest)
    copied_audio += 1
    return "/uploads/" + dest_rel


collections = [
    {"id": h(f"col:{clean_name(c[0])}"), "name": clean_name(c[0]), "description": clean_desc(c[1]), "image": None}
    for c in cats
]
col_id = {c["name"]: c["id"] for c in collections}
items = []
for r in items_rows:
    name, cat, desc = clean_name(r[1]), clean_name(r[2]), clean_desc(r[3])
    for a, b, n in DESC_FIXES.get(name, []):
        desc = desc.replace(a, b, n)
    glb, img, mp3 = (str(r[i]).strip() if r[i] else "" for i in (9, 10, 12))
    item_id = h(f"item:{glb or name}")
    items.append({
        "id": item_id,
        "collectionId": col_id[cat],
        "name": name,
        "description": desc,
        "model": add("model", f"โมเดล/{glb}", f"{SLUG}/models/{item_id}.glb") if glb else None,
        "thumbnail": add("image", f"ภาพ/{img}", f"{SLUG}/images/{item_id}.webp") if img else None,
        "audio": copy_audio(f"เสียง/{mp3}", f"{SLUG}/audio/{item_id}.mp3") if mp3 else None,
    })
for c in collections:
    first = next((i for i in items if i["collectionId"] == c["id"] and i["thumbnail"]), None)
    c["image"] = first["thumbnail"] if first else None

# The form names the cover cover1.png, but the file in the folder is cover.png.
cover_file = next((f for f in (str(com[6] or "").strip(), "cover.png") if f and os.path.isfile(os.path.join(SRC, "ภาพ", f))), None)
cover = add("photo", f"ภาพ/{cover_file}", f"{SLUG}/cover.webp") if cover_file else None
missing_featured = [n for n in FEATURED if not any(i["name"] == n for i in items)]
assert not missing_featured, missing_featured
out = {
    "settings": {"cover": cover, "recommended": [i["id"] for n in FEATURED for i in items if i["name"] == n]},
    "community": {"name": clean_name(com[0]), "shortName": clean_name(com[1]), "location": clean_name(com[2]),
                  "description": clean_desc(com[3]), "lat": round(float(com[4]), 6), "lng": round(float(com[5]), 6)},
    "collections": collections,
    "items": items,
}
with open(os.path.join(ROOT, "web", "src", "data", f"{SLUG}.json"), "w", encoding="utf-8", newline="\n") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
with open(os.path.join(SRC, "manifest.json"), "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=1)
print(f"{len(items)} items, {len(collections)} collections, {len(manifest)} media files in manifest, {copied_audio} mp3 copied")
