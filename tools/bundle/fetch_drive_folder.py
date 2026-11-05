"""Download a public Google Drive folder file by file, continuing past failures.

Usage: python tools/bundle/fetch_drive_folder.py <folder-url> <output-dir>
Writes <output-dir>/_failed.txt listing files that could not be fetched.
"""
import os
import sys

import gdown

url, out = sys.argv[1], sys.argv[2]
files = gdown.download_folder(url, output=out, skip_download=True, quiet=True)
ok, failed = 0, []
for f in files:
    if os.path.exists(f.local_path) and os.path.getsize(f.local_path) > 0:
        ok += 1
        continue
    os.makedirs(os.path.dirname(f.local_path), exist_ok=True)
    try:
        res = gdown.download(id=f.id, output=f.local_path, quiet=True)
    except Exception as e:  # noqa: BLE001 - keep going, record the failure
        res = None
        print("FAIL", f.path, type(e).__name__)
    if res:
        ok += 1
    else:
        failed.append(f"{f.id}\t{f.path}")
with open(os.path.join(out, "_failed.txt"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(failed))
print(f"total {len(files)}, ok {ok}, failed {len(failed)}")
