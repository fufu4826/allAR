"""Print paragraph text of .docx files and count embedded images.

Usage: python tools/bundle/docx_text.py <file.docx> [...]
"""
import re
import sys
import zipfile

for path in sys.argv[1:]:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
        images = [n for n in z.namelist() if n.startswith("word/media/")]
    paras = []
    for p in re.findall(r"<w:p[ >].*?</w:p>", xml, flags=re.S):
        text = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p)).strip()
        if text:
            paras.append(text)
    print(f"===== {path}  ({len(paras)} paragraphs, {len(images)} images)")
    print("\n".join(paras))
