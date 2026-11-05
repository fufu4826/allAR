# C2 — Public pages read from the database + file serving (Codex · gpt-6.1-terra · effort medium · sandbox workspace-write)

## Role
Senior Next.js 16 developer on "AllAR". Replace the static data source with database queries without changing what users see. Reviewer: Claude.

## Context
- Read `web/AGENTS.md` and the relevant guides in `web/node_modules/next/dist/docs/` **before coding**: especially `01-app/02-guides/instant-navigation.md`, `01-app/03-api-reference/04-functions/generate-static-params.md`, the `use cache` directive, `cacheTag`/`revalidateTag`, and route handlers. This app has `cacheComponents: true`; every `params` access must sit inside `<Suspense>` (see how `web/src/app/c/[slug]/page.tsx` already wraps it).
- Data layer from task C1: `web/src/db/schema.ts`, `web/src/db/index.ts` (`db`). Media live in `UPLOAD_DIR` (env; dev default `../data-bundle/uploads` relative to `web/`) and are referenced in the DB as `/uploads/<relative path>`.
- Current pages: `/` (map + community cards + featured), `/c/[slug]`, `/c/[slug]/[itemId]`, `/search`, `/about`. Components in `web/src/components/`.

## Goal
Same UI, but data comes from MariaDB through cached query functions, and files are served from `UPLOAD_DIR`.

## Steps
1. Create `web/src/lib/queries.ts` (`import 'server-only'`) exporting: `getCommunities()`, `getCommunity(slug)`, `getCommunityWithContent(slug)` (collections + published items, ordered by `sort_order` then name), `getItem(slug, itemId)`, `getFeaturedItems(limit)`, `getSearchIndex()`. Each uses `'use cache'` + `cacheTag('content')` + `cacheLife('hours')`. Return plain serializable objects matching the existing `Community`/`Collection`/`Item` shapes (move those types to `web/src/lib/types.ts`; convert decimal lat/lng to numbers; unpublished communities keep `placeholder: true`).
2. Update every page/component to use these functions. Keep markup and Tailwind classes as they are. `generateStaticParams` must return at least one param (Cache Components rule) — query the DB; if empty return a placeholder param and `notFound()` for it.
3. Route handler `web/src/app/uploads/[...path]/route.ts`: serve files from `UPLOAD_DIR`.
   - Resolve with `path.resolve` and reject anything that escapes `UPLOAD_DIR` (`..`, absolute, NUL) → 404.
   - Content-Type by extension from an allow-list only: glb `model/gltf-binary`, gltf `model/gltf+json`, usdz `model/vnd.usdz+zip`, webp/jpg/png, mp3 `audio/mpeg`, wav `audio/wav`, m4a `audio/mp4`. Others → 404.
   - Support `Range` requests (206, `Content-Range`, `Accept-Ranges: bytes`) — required for audio seeking on iOS.
   - Stream with `fs.createReadStream` → web `ReadableStream`; `Cache-Control: public, max-age=2592000, immutable`; `X-Content-Type-Options: nosniff`.
4. `web/src/app/api/health/route.ts`: returns `{ status: 'ok' }` 200 after `SELECT 1` succeeds, else 503 `{ status: 'db_error' }` (no error details).
5. Remove the `/r2/:path*` rewrite from `web/next.config.ts`. Delete `web/src/data/communities.ts` only after nothing imports it (keep `phuphan.json`; the seed uses it).
6. Map pins, featured list, search must still work. Search stays client-side over the index returned by `getSearchIndex()`.

## Rules
- No new dependencies. Do not touch `web/src/db/*`, `web/drizzle/*`, `web/scripts/*`.
- Never log query results or env values. No commits, pushes, or branch changes.

## Acceptance
Your sandbox may have no network or DB access. Run what you can (`tsc`, `lint`); mark DB-dependent checks "not run: no DB access" — the reviewer runs them.
1. `npx tsc --noEmit`, `npm run lint`, `npm run build` pass (DB reachable via `.env.local`).
2. `npm run dev`: `/`, `/c/phuphan`, `/c/phuphan/00fc2ad9ac8e4d38aa9dc14b67f21c25`, `/search?q=คราม`, `/about` render like before; browser console has no errors.
3. `curl -I /uploads/<a real .glb>` → 200 `model/gltf-binary`; with `Range: bytes=0-99` → 206; `/uploads/../.env.local` → 404.
4. `/api/health` → 200 `{"status":"ok"}`.

## Report (max 15 lines)
Files changed · acceptance results · anything that differs visually or behaviourally from before.
