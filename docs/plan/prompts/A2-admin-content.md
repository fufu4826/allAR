# A2 — Admin content management UI (agy · mode accept-edits · effort high)

## Role
Senior Next.js 16 developer on "AllAR". Build the admin screens on top of an **existing, reviewed** auth and upload layer. Reviewer: Claude. Security-critical helpers already exist (task C3, reviewed by Claude) — you must call them, never reimplement or bypass them.

## Context
- Read `web/AGENTS.md` and `web/node_modules/next/dist/docs/` (Server Actions / `"use server"`, forms, `revalidateTag`, `redirect`, `cookies`) before coding. `cacheComponents: true` is on.
- Provided by task C3 (read them first, do not edit):
  - `web/src/lib/auth.ts` → `requireAdmin(): Promise<Admin>` (redirects to `/admin/login` if no session), `getCurrentAdmin()`.
  - `web/src/lib/audit.ts` → `audit(adminId, action, entity, entityId, detail?)`.
  - `web/src/lib/uploads.ts` → `saveUpload(file: File, kind: 'model'|'usdz'|'image'|'audio'): Promise<string>` (validates type/size by magic bytes, returns `/uploads/...` path) and `deleteUpload(path)`.
  - `web/src/app/admin/login/*` and `web/src/app/admin/layout.tsx` (shell + nav).
- Data: `web/src/db/schema.ts`; public queries use `cacheTag('content')`.
- UI language: **Thai**. Reuse the site's Tailwind tokens (`brand`, `brand-dark`, `brand-soft`, `ink`, `muted`, `line`, `paper`) and look of existing pages.

## Goal
Admins can create, edit, reorder, publish/unpublish and delete communities, collections and items (with model/USDZ/image/audio uploads), and manage admin accounts — without touching code.

## Pages (all under `web/src/app/admin/`, each page calls `await requireAdmin()` first)
1. `/admin` — dashboard: counts per table, last 10 audit entries.
2. `/admin/communities` — list (name, published, item count, sort) · `/new` · `/[id]` edit form: name, short name, slug (a–z, 0–9, `-`), location, description, lat/lng (number inputs + link "เปิด Google Maps"), color, cover image upload, published toggle, sort order. Delete with confirm dialog (warn it deletes all collections/items).
3. `/admin/communities/[id]/collections` — list + add/edit/delete collections of that community (name, description, image, sort).
4. `/admin/items` — table filterable by community and collection, search by name · `/new` · `/[id]` edit: collection select, name, description (textarea, keep line breaks), model `.glb` upload, optional `.usdz` upload, thumbnail image, audio, featured toggle, published toggle, sort. Show `<model-viewer>` preview of the current model using the existing `web/src/components/ModelViewer.tsx`.
5. `/admin/admins` — list, add admin (username, display name, temporary password ≥ 12 chars), deactivate/activate, reset password. An admin cannot deactivate themself. Password hashing: call `hashPassword()` from `web/src/lib/auth.ts`.
6. `/admin/audit` — paginated audit log (50/page), filter by entity.

## Implementation rules
- Mutations only through Server Actions in `actions.ts` files next to the pages. Each action: `const admin = await requireAdmin()` → validate input with a small hand-written validator (no new deps; trim strings, max lengths from the schema, reject bad slugs/coords) → DB write → `audit(...)` → `revalidateTag('content')` → `redirect`/return state.
- File inputs: on replace, `saveUpload` the new file first, update DB, then `deleteUpload` the old path. On delete of an item/collection/community, delete its files after the DB delete succeeds.
- Forms use `useActionState` for inline Thai error messages; disable submit while pending; max upload sizes shown in the UI (model 100 MB, usdz 100 MB, image 15 MB, audio 30 MB).
- IDs: `crypto.randomUUID().replaceAll('-', '')`.
- No client-side-only checks for security; the server action is the source of truth.
- No new dependencies. Do not edit `web/src/lib/auth.ts`, `audit.ts`, `uploads.ts`, `web/src/db/*`, `web/src/app/admin/login/*`. No commits, pushes, branch changes.

## Acceptance
1. `npx tsc --noEmit`, `npm run lint`, `npm run build` pass.
2. Logged in as a test admin (the reviewer provides one in the dev DB), you can: create community "ชุมชนทดสอบ" → add a collection → add an item with a `.glb`, thumbnail and `.mp3` → publish → it appears on `/` map and `/c/<slug>` without restarting; edit it; delete it and its files disappear from `UPLOAD_DIR`.
3. Every mutation creates exactly one audit row.
4. Visiting any `/admin/*` page logged out redirects to `/admin/login`.

## Report (max 15 lines)
Pages/actions created · acceptance results · known gaps.
