"""Build data-bundle/delivery/uploads.zip from data-bundle/uploads and check it against the DB dump.

Usage (from repo root): python tools/bundle/make_uploads_zip.py
Every /uploads/... path referenced in delivery/allar_db.sql.gz must exist; the zip stores
files relative to the uploads root (the same layout as the uploads volume).
"""
import gzip
import os
import re
import sys
import zipfile

ROOT = os.path.join("data-bundle")
UPLOADS = os.path.join(ROOT, "uploads")
OUT = os.path.join(ROOT, "delivery")

sql = gzip.open(os.path.join(OUT, "allar_db.sql.gz"), "rt", encoding="utf-8").read()
refs = sorted(set(re.findall(r"/uploads/([^'\",)]+)", sql)))
missing = [r for r in refs if not os.path.isfile(os.path.join(UPLOADS, r))]

files = sorted(
    os.path.relpath(os.path.join(d, f), UPLOADS).replace(os.sep, "/")
    for d, _, names in os.walk(UPLOADS)
    for f in names
)
unreferenced = sorted(set(files) - set(refs))
print(f"referenced {len(refs)}, missing {len(missing)}, files {len(files)}, unreferenced {len(unreferenced)}")
for m in missing[:10]:
    print("  missing:", m)
for u in unreferenced[:10]:
    print("  unreferenced:", u)
if missing:
    sys.exit(1)

zip_path = os.path.join(OUT, "uploads.zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_STORED) as z:
    for f in files:
        z.write(os.path.join(UPLOADS, f), f)
print(f"wrote {zip_path} ({os.path.getsize(zip_path) / 1e6:.1f} MB)")
