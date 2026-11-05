"""List or rewrite paragraphs in a .docx by matching their visible text.

Usage:
  python tools/bundle/docx_patch.py list  <file.docx> <regex>
  python tools/bundle/docx_patch.py apply <file.docx> <edits.json>

edits.json: [{"find": "<substring of paragraph text>", "replace": "<new full paragraph text>"}, ...]
Matching ignores zero-width spaces. The rewritten paragraph keeps the formatting of its
first text run; the other runs are dropped. Every "find" must match exactly one paragraph.
"""
import json
import re
import shutil
import sys
import zipfile
from xml.sax.saxutils import escape

ZW = "​"
mode, path = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(path) as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}
xml = files["word/document.xml"].decode("utf-8")
PARA = re.compile(r"<w:p[ >].*?</w:p>", re.S)
RUN = re.compile(r"<w:r[ >](?:(?!</w:r>).)*?<w:t[ >].*?</w:r>", re.S)


def text_of(p: str) -> str:
    return "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p)).replace(ZW, "")


if mode == "list":
    pat = re.compile(sys.argv[3])
    for i, p in enumerate(PARA.findall(xml)):
        t = text_of(p)
        if pat.search(t):
            print(f"[{i}] {t}")
    sys.exit(0)

edits = json.load(open(sys.argv[3], encoding="utf-8"))
paras = PARA.findall(xml)
for e in edits:
    hits = [p for p in paras if e["find"] in text_of(p)]
    if len(hits) != 1:
        sys.exit(f"'{e['find']}' matched {len(hits)} paragraphs")
    p = hits[0]
    runs = RUN.findall(p)
    first = runs[0]
    new_run = re.sub(r"<w:t[^>]*>[^<]*</w:t>", lambda m: f'<w:t xml:space="preserve">{escape(e["replace"])}</w:t>', first, count=1)
    new_run = re.sub(r"(</w:t>).*?(?=</w:r>)", r"\1", new_run, flags=re.S)  # drop extra <w:t>/<w:tab> after the first
    np_ = p.replace(first, new_run, 1)
    for r in runs[1:]:
        np_ = np_.replace(r, "", 1)
    xml = xml.replace(p, np_, 1)
    paras = PARA.findall(xml)
    print("ok:", e["find"][:40])
files["word/document.xml"] = xml.encode("utf-8")
shutil.copyfile(path, path + ".bak")
with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, files[n])
