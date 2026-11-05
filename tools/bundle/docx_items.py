"""Extract museum items (text + photo) from the Tha Wat inventory .docx files.

Each table row of the source document describes one object: an image cell and a
details cell ("ชื่อวัตถุ", "ขนาด", "แบบศิลปะ/อายุสมัย/ฝีมือช่าง", "ลักษณะ", "ประวัติหรือตำนาน").

Usage: python tools/bundle/docx_items.py <file.docx> <out-dir>
Writes <out-dir>/items.json and the row images as <out-dir>/img_<n>.<ext>.
"""
import json
import os
import re
import sys
import zipfile

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
z = zipfile.ZipFile(src)
doc = z.read("word/document.xml").decode("utf-8")
rels = z.read("word/_rels/document.xml.rels").decode("utf-8")
rel_target = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
rel_target.update({k: v for v, k in re.findall(r'Target="([^"]+)"[^>]*Id="([^"]+)"', rels)})

LABELS = [
    ("name", r"ชื่อวัตถุ"),
    ("size", r"ขนาด"),
    ("style", r"แบบศิลปะ/อายุสมัย/ฝีมือช่าง"),
    ("features", r"ลักษณะ"),
    ("history", r"ประวัติหรือตำนาน"),
]


def para_texts(xml: str) -> list[str]:
    out_ = []
    for p in re.findall(r"<w:p[ >].*?</w:p>", xml, flags=re.S):
        t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p)).replace("&quot;", '"').replace("&amp;", "&").strip()
        if t:
            out_.append(t)
    return out_


def parse_details(lines: list[str]) -> dict:
    data: dict = {"no": None, "reg": None}
    current = None
    for line in lines:
        m = re.match(r"^(\d+)\s*(\*\*)?$", line)
        if m and data["no"] is None:
            data["no"] = int(m.group(1))
            data["incomplete"] = bool(m.group(2))
            continue
        m = re.match(r"^(เลขที่|กศช\.)\s*(.*)$", line)
        if m and current is None:
            reg = (m.group(1) + " " + m.group(2)).strip() if m.group(1) == "กศช." else m.group(2).strip()
            data["reg"] = None if re.fullmatch(r"[.\s/]*", reg) else reg
            continue
        for key, label in LABELS:
            m = re.match(rf"^{label}\s*[:：]?\s*(.*)$", line)
            if m:
                current = key
                value = m.group(1).strip(" :-")
                data[key] = value
                break
        else:
            if current:
                joiner = "\n" if current == "size" else " "
                data[current] = (data.get(current, "") + joiner + line).strip()
            elif line.startswith("("):
                data["note"] = line
    return data


items = []
for row in re.findall(r"<w:tr[ >].*?</w:tr>", doc, flags=re.S):
    cells = re.findall(r"<w:tc>.*?</w:tc>", row, flags=re.S)
    images = []
    for cell in cells:
        images += [rel_target[r] for r in re.findall(r'r:embed="([^"]+)"', cell) if r in rel_target]
    lines = para_texts(row)
    if not any(re.match(r"^ชื่อวัตถุ", ln) for ln in lines):
        continue
    # A row may hold two objects (two number lines); split on the number lines.
    chunks, cur = [], []
    for ln in lines:
        if re.match(r"^\d+\s*(\*\*)?$", ln) and cur:
            chunks.append(cur)
            cur = []
        cur.append(ln)
    if cur:
        chunks.append(cur)
    for idx, chunk in enumerate(chunks):
        data = parse_details(chunk)
        if not data.get("name"):
            continue
        data["images"] = images if len(chunks) == 1 else images[idx: idx + 1]
        items.append(data)

for it in items:
    saved = []
    for k, target in enumerate(it.pop("images")):
        name = target.split("/")[-1]
        ext = name.rsplit(".", 1)[-1].lower()
        dest = f"img_{it['no']:02d}_{k}.{ext}"
        with open(os.path.join(out, dest), "wb") as fh:
            fh.write(z.read("word/" + target.lstrip("/").replace("word/", "")))
        saved.append(dest)
    it["images"] = saved

with open(os.path.join(out, "items.json"), "w", encoding="utf-8") as fh:
    json.dump(items, fh, ensure_ascii=False, indent=2)
print(f"{src}: {len(items)} items, {sum(len(i['images']) for i in items)} images")
for it in items:
    print(it["no"], "|", it.get("name"), "|", len(it["images"]), "img |", "incomplete" if it.get("incomplete") else "")
