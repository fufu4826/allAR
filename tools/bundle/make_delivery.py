"""Build the data bundle for สวท. from a database dump and a copy of the uploads volume.

Usage (from repo root):
  python tools/bundle/make_delivery.py <dump.sql> <uploads dir> <out dir>

Writes <out dir>/allar_db.sql.gz, uploads.zip and SHA256SUMS.txt (the three files
deploy/import-bundle.sh expects). Only files the database references go into the zip, since
the site serves nothing else from /uploads; every referenced file must exist, or nothing is
written. Unreferenced files (left over from replaced uploads) are listed and left out.
"""
import gzip
import hashlib
import os
import re
import shutil
import sys
import zipfile


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    dump, uploads, out = sys.argv[1:]
    sql = open(dump, encoding="utf-8").read()
    if "Dump completed" not in sql:
        sys.exit("dump looks incomplete (no 'Dump completed' line)")
    if re.search(r"INSERT INTO `(admins|sessions|login_attempts|audit_logs)`", sql):
        sys.exit("dump contains admin, session or audit rows; it must carry content only")

    refs = sorted(set(re.findall(r"/uploads/([^'\",)\\]+)", sql)))
    files = sorted(
        os.path.relpath(os.path.join(d, f), uploads).replace(os.sep, "/")
        for d, _, names in os.walk(uploads)
        for f in names
    )
    missing = [r for r in refs if r not in set(files)]
    unreferenced = sorted(set(files) - set(refs))
    print(f"referenced {len(refs)}, missing {len(missing)}, files {len(files)}, unreferenced {len(unreferenced)}")
    for m in missing:
        print("  missing:", m)
    for u in unreferenced:
        print("  left out (unreferenced):", u)
    if missing:
        sys.exit(1)

    os.makedirs(out, exist_ok=True)
    db_gz = os.path.join(out, "allar_db.sql.gz")
    with open(dump, "rb") as src, gzip.open(db_gz, "wb", compresslevel=9) as dst:
        shutil.copyfileobj(src, dst)

    zip_path = os.path.join(out, "uploads.zip")
    total = 0
    # Media is already compressed (webp, glb with meshopt, mp4): store it as is.
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_STORED, allowZip64=True) as z:
        for f in refs:
            path = os.path.join(uploads, f)
            total += os.path.getsize(path)
            z.write(path, f)
    with zipfile.ZipFile(zip_path) as z:
        bad = z.testzip()
        if bad:
            sys.exit(f"zip check failed at {bad}")

    with open(os.path.join(out, "SHA256SUMS.txt"), "w", encoding="ascii", newline="\n") as s:
        for name in ("allar_db.sql.gz", "uploads.zip"):
            s.write(f"{sha256(os.path.join(out, name))} *{name}\n")
    print(f"wrote {db_gz} ({os.path.getsize(db_gz) / 1e3:.0f} KB)")
    print(f"wrote {zip_path} ({os.path.getsize(zip_path) / 1e6:.1f} MB, {len(refs)} files, {total / 1e6:.1f} MB of media)")


if __name__ == "__main__":
    main()
