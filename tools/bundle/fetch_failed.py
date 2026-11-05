"""Retry files listed in <dir>/_failed.txt via Drive's direct download, or Docs export.

Usage: python tools/bundle/fetch_failed.py <dir> [<dir> ...]
Writes <dir>/_failed2.txt with files that still could not be fetched.
"""
import os
import sys
import urllib.request

URLS = [
    "https://drive.usercontent.google.com/download?id={id}&export=download&confirm=t",
    "https://docs.google.com/document/d/{id}/export?format=docx",
    "https://docs.google.com/spreadsheets/d/{id}/export?format=xlsx",
    "https://docs.google.com/presentation/d/{id}/export/pptx",
]


def fetch(file_id: str, dest: str) -> bool:
    for tpl in URLS:
        try:
            with urllib.request.urlopen(tpl.format(id=file_id), timeout=300) as r:
                if "text/html" in r.headers.get("Content-Type", ""):
                    continue
                tmp = dest + ".part"
                with open(tmp, "wb") as fh:
                    while chunk := r.read(1 << 20):
                        fh.write(chunk)
                os.replace(tmp, dest)
                return True
        except Exception:  # noqa: BLE001 - try the next form
            continue
    return False


for d in sys.argv[1:]:
    still = []
    lines = open(os.path.join(d, "_failed.txt"), encoding="utf-8").read().splitlines()
    for line in filter(None, lines):
        file_id, rel = line.split("\t", 1)
        dest = os.path.join(d, rel.replace("\\", os.sep))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not fetch(file_id, dest):
            still.append(line)
            print("STILL FAILED", rel)
    open(os.path.join(d, "_failed2.txt"), "w", encoding="utf-8").write("\n".join(still))
    print(f"{d}: retried {len(lines)}, still failed {len(still)}")
