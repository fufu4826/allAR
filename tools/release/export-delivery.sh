#!/bin/sh
# Export the installable part of this repository into a working copy of the delivery repository.
#
# Usage (from the repository root):
#   sh tools/release/export-delivery.sh <delivery working copy> [git ref, default HEAD]
#
# Only committed files are exported (git archive), so local .env files, data and build output can
# never leak. Shipped: deploy/, web/ and .gitattributes, plus the README and .gitignore templates
# in tools/release/. Development-only files (team guides, design prototypes, data tools, CI) stay
# here. The export stops before writing anything if a shipped file mentions a test server or an
# internal tool (see BANNED below).
set -eu

target=${1:?usage: export-delivery.sh <delivery working copy> [git ref]}
ref=${2:-HEAD}
here=$(cd "$(dirname "$0")" && pwd)
root=$(git -C "$here" rev-parse --show-toplevel)

[ -d "$target/.git" ] || { echo "not a git working copy: $target" >&2; exit 1; }

stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT HUP INT TERM

git -C "$root" archive --format=tar "$ref" deploy web .gitattributes | tar -xf - -C "$stage"
# Notes for development tools, not part of the product.
rm -f "$stage/web/AGENTS.md" "$stage/web/CLAUDE.md"
cp "$here/README.delivery.md" "$stage/README.md"
cp "$here/gitignore.delivery" "$stage/.gitignore"

# Traces that must not reach the delivery repository: development-tool notes, the test server's
# domain, and personal or machine paths. Narration file names from the source data are allowed.
BANNED='claude|anthropic|codex|antigravity|chatgpt|openai|copilot|co-authored-by|generated with|AGENTS\.md|AI-GUIDE|livecraft|trycloudflare|azure|20\.194\.|nitipat|kafu|C:\\Users|D:\\allAR'
if found=$(grep -rniE "$BANNED" "$stage" \
    --exclude=package-lock.json --exclude='*.png' --exclude='*.jpg' --exclude='*.webp' \
    --exclude='*.glb' --exclude='*.ico' --exclude='*.woff' --exclude='*.woff2'); then
  echo "export stopped: shipped files contain internal traces:" >&2
  echo "$found" | cut -c1-200 >&2
  exit 1
fi

# Replace the working tree (keep .git), then copy the export in.
find "$target" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$stage"/. "$target"/

# Every exported file must be committable: a too-broad .gitignore rule would silently drop
# source files (migrations, the uploads route) from the delivery repository.
ignored=$(cd "$stage" && find . -type f | sed 's|^\./||' | git -C "$target" check-ignore --no-index --stdin || true)
if [ -n "$ignored" ]; then
  echo "export stopped: the delivery .gitignore hides exported files:" >&2
  echo "$ignored" >&2
  exit 1
fi
echo "exported $(git -C "$root" rev-parse --short "$ref") to $target ($(find "$stage" -type f | wc -l | tr -d ' ') files)"
