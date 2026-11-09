"""Turn the extracted Tha Wat inventories into seed data + optimized images.

Input : data-bundle/incoming/extract/<slug>/items.json (+ img_*.*) from docx_items.py
Output: web/src/data/<slug>.json (same shape as phuphan.json) and
        data-bundle/uploads/thawat/<slug>/<id>.webp  (1200px, used as thumbnail/photo)

Usage (repo root): python tools/bundle/build_thawat.py
"""
import hashlib
import json
import os
import re

from PIL import Image, ImageOps

ROOT = os.getcwd()
EXTRACT = os.path.join(ROOT, "data-bundle", "incoming", "extract")
UPLOADS = os.path.join(ROOT, "data-bundle", "uploads")
# /uploads is served immutable for 30 days, so changed pictures need a new file name.
# watnuea -v2: the photos were sideways (Word rotation not applied by docx_items.py before 2026-11-09).
IMAGE_VERSION = {"watnuea": "-v2"}
DATA = os.path.join(ROOT, "web", "src", "data")
# 3D models sent by the field team, named by the item number (`no`) in the inventory document.
# Optimized by web/scripts/optimize-media.mjs into uploads/thawat/<slug>/models/<item id>.glb;
# an item gets its model only if that file exists. Checked one by one against the item photos (2026-11-09).
# Wat Klang: 16.glb has no item in the document and 28.1.glb is a second scan of item 28 (beads on a plate),
# so both are held back.

# Obvious typos in the source documents (spelling only, meaning unchanged).
TYPOS = {"ปารมารวิชัย": "ปางมารวิชัย", "ทวารดี": "ทวารวดี", "ล้านข้าง": "ล้านช้าง", "ก้อนกลม": "ก้นกลม"}

COLLECTIONS = {
    "watklang": [
        ("prehistoric", "ภาชนะดินเผาก่อนประวัติศาสตร์", "ภาชนะดินเผาลายเชือกทาบและเครื่องใช้สมัยก่อนประวัติศาสตร์ที่พบในเขตบ้านท่าวัด"),
        ("ceramics", "ไหและเครื่องถ้วยเคลือบ", "ไห ชาม ตลับ คนโท และเครื่องถ้วยเคลือบสมัยต่าง ๆ"),
        ("buddha", "พระพุทธรูป", "พระพุทธรูปโลหะและสำริดที่เก็บรักษาในพิพิธภัณฑ์วัดกลางศรีเชียงใหม่"),
        ("other", "ศิลาจารึกและโบราณวัตถุอื่น ๆ", "ศิลาจารึก ลูกปัด กล้องยาสูบดินเผา และโบราณวัตถุอื่น"),
    ],
    "watnuea": [
        ("buddha", "พระพุทธรูป", "พระพุทธรูปศิลปะทวารวดี ลพบุรี ล้านช้าง และรัตนโกสินทร์ ของวัดมหาพรหมโพธิราช"),
        ("architecture", "ชิ้นส่วนสถาปัตยกรรมและใบเสมา", "นาคปัก ใบเสมาหินทราย และชิ้นส่วนสถาปัตยกรรมโบราณที่พบในเขตบ้านท่าวัด"),
    ],
}


def collection_key(slug: str, it: dict) -> str:
    name, style = it["name"], it.get("style", "")
    if slug == "watnuea":
        return "buddha" if ("พระพุทธรูป" in name or "เศียร" in name) else "architecture"
    if "พระพุทธรูป" in name:
        return "buddha"
    if "ศิลาจารึก" in name or "ลูกปัด" in name or "กล้องยาสูบ" in name:
        return "other"
    if "ก่อนประวัติศาสตร์" in name or "ก่อนประวัติศาสตร์" in style:
        return "prehistoric"
    return "ceramics"


def fix(text: str | None) -> str:
    text = (text or "").strip()
    for a, b in TYPOS.items():
        text = text.replace(a, b)
    return re.sub(r"[ \t]{2,}", " ", text)


def describe(it: dict) -> str:
    parts = []
    if it.get("features"):
        parts.append(fix(it["features"]))
    facts = []
    if it.get("size") and it["size"] not in ("-", ""):
        size = "\n".join(re.sub(r"\s+", " ", s).strip() for s in it["size"].splitlines() if s.strip())
        facts.append(f"ขนาด: {size}")
    if it.get("style") and it["style"].strip(" -"):
        facts.append(f"แบบศิลปะ/อายุสมัย: {fix(it['style'])}")
    if it.get("reg"):
        facts.append(f"เลขทะเบียน: {it['reg']}")
    if it.get("history") and it["history"].strip(" -"):
        facts.append(f"ประวัติ: {fix(it['history'])}")
    if facts:
        parts.append("\n".join(facts))
    return "\n\n".join(parts) or "อยู่ระหว่างรวบรวมข้อมูล"


def save_image(src: str, dest_rel: str) -> str:
    dest = os.path.join(UPLOADS, *dest_rel.split("/"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    im.thumbnail((1200, 1200))
    im.save(dest, "WEBP", quality=82, method=6)
    return "/uploads/" + dest_rel


def model_url(slug: str, item_id: str) -> str | None:
    rel = f"thawat/{slug}/models/{item_id}.glb"
    return "/uploads/" + rel if os.path.isfile(os.path.join(UPLOADS, *rel.split("/"))) else None


for slug, cols in COLLECTIONS.items():
    source = json.load(open(os.path.join(EXTRACT, slug, "items.json"), encoding="utf-8"))
    names = [fix(i["name"]) for i in source]
    collections = [
        {"id": hashlib.md5(f"{slug}:col:{key}".encode()).hexdigest(), "name": name, "description": desc, "image": None}
        for key, name, desc in cols
    ]
    col_id = {key: c["id"] for (key, _, _), c in zip(cols, collections)}
    items = []
    for it, name in zip(source, names):
        item_id = hashlib.md5(f"{slug}:item:{it['no']}".encode()).hexdigest()
        if names.count(name) > 1:
            regs = [s.get("reg") for s, n in zip(source, names) if n == name]
            unique_reg = it.get("reg") and slug == "watnuea" and regs.count(it["reg"]) == 1
            name = f"{name} (เลขที่ {it['reg']})" if unique_reg else f"{name} (ลำดับที่ {it['no']})"
        photo = save_image(os.path.join(EXTRACT, slug, it["images"][0]), f"thawat/{slug}/{item_id}{IMAGE_VERSION.get(slug, '')}.webp") if it["images"] else None
        items.append({
            "id": item_id,
            "collectionId": col_id[collection_key(slug, it)],
            "name": name,
            "description": describe(it),
            "model": model_url(slug, item_id),
            "thumbnail": photo,
            "audio": None,
        })
    for c in collections:  # first item photo becomes the category image
        first = next((i for i in items if i["collectionId"] == c["id"] and i["thumbnail"]), None)
        c["image"] = first["thumbnail"] if first else None
    cover = items[10]["thumbnail"] if slug == "watklang" else items[0]["thumbnail"]
    out = {"settings": {"cover": cover, "recommended": []}, "collections": collections, "items": items}
    with open(os.path.join(DATA, f"{slug}.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    per = {c["name"]: sum(1 for i in items if i["collectionId"] == c["id"]) for c in collections}
    print(slug, len(items), "items", per, "cover", cover, "models", sum(1 for i in items if i["model"]))
