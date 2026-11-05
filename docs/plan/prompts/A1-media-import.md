# A1 — Download & optimize Phu Phan media (agy · mode accept-edits · effort medium)

## Role
You are a Node.js tooling developer on "AllAR" (Thai 3D/AR community museum site). You write a one-off but re-runnable media pipeline. A reviewer (Claude) runs and checks it; list anything unclear in your report.

## Context
- Repo root = cwd. App in `web/`. Media URLs are listed in `web/src/data/phuphan.json` as paths beginning `/r2/…`; the real public origin is `https://pub-b7cd49a1aa5b4bb1ba339dfd78d4ec75.r2.dev/` (replace the `/r2/` prefix with it).
- Contents: 41 `.glb` models (~5–25 MB each), thumbnails/covers (`.jpg`/`.png`, some 6000 px wide), 20 `.wav` narration files, 1 landing cover.
- After this task the app will serve files from `UPLOAD_DIR` under URL `/uploads/<same relative path>` — so **keep relative paths identical**, only file extensions may change.

## Goal
`web/scripts/import-media.mjs` downloads every referenced file once into `data-bundle/originals/` and writes optimized copies to `data-bundle/uploads/`, then updates the paths in `phuphan.json` to the optimized file names.

## Steps
1. devDependencies in `web/`: `sharp`, `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `meshoptimizer`. Nothing else.
2. Download: collect every `/r2/…` path from `phuphan.json` (settings.cover, settings.logo, collections[].image, items[].model/thumbnail/audio). Download into `<repo>/data-bundle/originals/<relative path>`; skip files that already exist with the same `Content-Length`; max 4 parallel downloads; retry 3× with backoff; fail loudly on any non-200.
3. Images (`.jpg/.jpeg/.png`): with sharp, auto-rotate, resize to max width 1600 (no upscaling), encode WebP quality 80 → `data-bundle/uploads/<path with .webp>`. Also write a 480-px-wide thumbnail `<name>.thumb.webp` next to it.
4. Models (`.glb`): with glTF-Transform: `dedup`, `prune`, resize all textures to max 2048 px, convert textures to WebP (quality 85) using sharp as the encoder, `meshopt` compression (register `EXTMeshoptCompression` with `MeshoptEncoder`) → `data-bundle/uploads/<same path>.glb`. If optimization throws for a file, copy the original unchanged and record it as a warning — never stop the whole run.
5. Audio (`.wav`): copy unchanged for now (conversion is a later decision).
6. Rewrite `web/src/data/phuphan.json`: replace each `/r2/<path>` with `/uploads/<optimized relative path>` (e.g. `.jpg` → `.webp`). Write atomically (temp file + rename). Keep formatting 2-space JSON.
7. Write `data-bundle/media-report.json`: per file original bytes, optimized bytes, warnings; and print a summary table (count, total MB before/after per type).
8. Add npm script `media:import` = `node scripts/import-media.mjs`.

## Rules
- Network access only to the R2 origin above.
- Never delete anything in `data-bundle/originals/`. Re-running must be safe and fast (skip work whose output exists and is newer than its input).
- `data-bundle/` must be git-ignored (add `data-bundle/` to the repo-root `.gitignore` if missing). Do not commit, push, or switch branches.
- Do not modify any other source file.

## Acceptance
1. `npm run media:import` completes; summary shows 41 models, 20 audio, all images.
2. Total optimized model size ≤ 50 % of originals (report the real number either way).
3. No image in `data-bundle/uploads/` wider than 1600 px.
4. Every `/uploads/…` path in `phuphan.json` exists under `data-bundle/uploads/`; no `/r2/` left.
5. Second run finishes in < 30 s with nothing re-downloaded.
6. `npx tsc --noEmit`, `npm run lint` pass.

## Report (max 15 lines)
Summary table · warnings (which files kept unoptimized and why) · deviations.
