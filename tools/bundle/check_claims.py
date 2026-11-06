"""Fail when banned claims appear in the web source.

Usage (repo root): python tools/bundle/check_claims.py [--list PATH] [--root PATH]
  --list  phrases file, UTF-8, one per line, '#' starts a comment (default tools/bundle/banned_claims.txt)
  --root  directory to scan (default web/src); its 'data' folder (field teams' own data) is skipped
Exit code 1 if any phrase is found, else 0.
"""
import argparse
import os
import sys

EXTS = {".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".json", ".html"}
SKIP_DIRS = {"node_modules", ".next"}


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", default="tools/bundle/banned_claims.txt")
    ap.add_argument("--root", default="web/src")
    args = ap.parse_args()

    with open(args.list, encoding="utf-8") as f:
        phrases = [s.strip() for s in f if s.strip() and not s.lstrip().startswith("#")]

    hits = 0
    root = os.path.normpath(args.root)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d for d in dirnames
            if d not in SKIP_DIRS and not (os.path.normpath(dirpath) == root and d == "data")
        ]
        for name in sorted(filenames):
            if os.path.splitext(name)[1] not in EXTS:
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8", errors="replace") as f:
                for lineno, line in enumerate(f, 1):
                    for phrase in phrases:
                        if phrase in line:
                            hits += 1
                            print(f"{path.replace(os.sep, '/')}:{lineno}: {phrase}")

    if hits:
        print(f"check_claims: {hits} hit(s)")
        return 1
    print("check_claims: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
