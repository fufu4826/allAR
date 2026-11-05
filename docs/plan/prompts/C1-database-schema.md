# C1 — Database schema, migrations, seed (Codex · gpt-6.1-terra · effort medium · sandbox workspace-write)

## Role
You are a senior TypeScript/Next.js developer on "AllAR", a Thai university website that shows 3D/AR models of museum objects, products and local wisdom from 5 communities in Sakon Nakhon. You are working alone in a git worktree. A reviewer (Claude) will check your work; nobody can answer questions mid-task, so follow this spec exactly and list anything unclear in your report.

## Context
- Repo root = your cwd. The Next.js app is in `web/` (Next.js 16.4, React 19.3, TypeScript, Tailwind 4, `cacheComponents: true`).
- **Next.js 16 differs from your training data.** Read `web/AGENTS.md` first and consult `web/node_modules/next/dist/docs/` before using any Next.js API.
- Today the site reads static data: `web/src/data/communities.ts` (types `Community`, `Collection`, `Item` + 4 placeholder communities) and `web/src/data/phuphan.json` (community 1: 10 collections, 41 items; ids are 32-char hex or short slugs like `garden`).
- Database: MariaDB 12.3, charset `utf8mb4`, collation `utf8mb4_unicode_ci`. A dev database is reachable at the URL in env var `DATABASE_URL` (already set in `web/.env.local`; never print or copy its value).
- Do NOT change any page or component in this task. Only add the data layer.

## Goal
Add a Drizzle ORM data layer for MariaDB with migrations and an idempotent seed that loads the current static data.

## Steps
1. Packages are **already installed by the reviewer**: `drizzle-orm`, `mysql2`, `server-only` (dependencies) and `drizzle-kit`, `tsx` (devDependencies). Your sandbox may have no network: do not run `npm install`; if something is missing, stop and report it.
2. Create `web/src/db/schema.ts` with these tables (snake_case columns, all `created_at`/`updated_at` as `timestamp` default now, `updated_at` on update now):
   - `communities`: `id` varchar(32) PK · `slug` varchar(64) unique · `name` varchar(255) · `short_name` varchar(120) · `location` varchar(255) · `description` text · `lat` decimal(9,6) · `lng` decimal(9,6) · `color` varchar(7) · `cover_path` varchar(500) null · `sort_order` int default 0 · `is_published` boolean default false
   - `collections`: `id` varchar(32) PK · `community_id` FK→communities.id ON DELETE CASCADE · `name` varchar(255) · `description` text · `image_path` varchar(500) null · `sort_order` int default 0
   - `items`: `id` varchar(32) PK · `collection_id` FK→collections.id ON DELETE CASCADE · `name` varchar(255) · `description` text · `model_path` varchar(500) null · `usdz_path` varchar(500) null · `thumbnail_path` varchar(500) null · `audio_path` varchar(500) null · `is_featured` boolean default false · `sort_order` int default 0 · `is_published` boolean default true
   - `admins`: `id` varchar(32) PK · `username` varchar(64) unique · `display_name` varchar(120) · `password_hash` varchar(255) · `is_active` boolean default true · `last_login_at` timestamp null
   - `sessions`: `id` char(64) PK (SHA-256 hex of the token, never the raw token) · `admin_id` FK→admins.id ON DELETE CASCADE · `expires_at` timestamp · `ip` varchar(45) · `user_agent` varchar(255)
   - `login_attempts`: `id` bigint auto-increment PK · `username` varchar(64) · `ip` varchar(45) · `success` boolean · `created_at` · index on (`username`, `created_at`) and (`ip`, `created_at`)
   - `audit_logs`: `id` bigint auto-increment PK · `admin_id` varchar(32) null FK→admins.id ON DELETE SET NULL · `action` varchar(32) · `entity` varchar(32) · `entity_id` varchar(64) null · `detail` json null · `ip` varchar(45) null · `created_at`
   Add indexes on every FK column and on `items.is_featured`.
3. Create `web/drizzle.config.ts` (dialect `mysql`, schema `./src/db/schema.ts`, out `./drizzle`, credentials from `process.env.DATABASE_URL`).
4. Create `web/src/db/index.ts`: a single shared `mysql2/promise` pool (`connectionLimit: 10`, `charset: 'utf8mb4'`) cached on `globalThis` in dev, exported as `db = drizzle(pool, { schema, mode: 'default' })`. Import `server-only` at the top.
5. Generate the first migration with drizzle-kit into `web/drizzle/` and commit-ready SQL files (do not hand-edit generated SQL).
6. Create `web/scripts/migrate.mjs`: plain Node ESM (no tsx, it must run inside the production Docker image) using `drizzle-orm/mysql2/migrator` with `migrationsFolder: './drizzle'`; exits non-zero on failure; prints only "migrations applied".
7. Create `web/scripts/seed.ts` (run with tsx) that upserts (INSERT … ON DUPLICATE KEY UPDATE) from `src/data/phuphan.json` and the 5 communities in `src/data/communities.ts`:
   - Community 1 `phuphan`: `is_published = true`, `sort_order = 1`; communities 2–5: `is_published = false`, `sort_order = 2..5`, keep their placeholder name/position/color.
   - Item `is_featured = true` for ids in `phuphan.settings.recommended`.
   - Paths: convert `/r2/<path>` to `/uploads/<path>` (files are moved there by task A1). Keep `null` as `null`.
   - Running the seed twice must not duplicate rows; print counts per table at the end.
8. Add npm scripts in `web/package.json`: `db:generate`, `db:migrate` (`node scripts/migrate.mjs`), `db:seed` (`tsx scripts/seed.ts`). Make the scripts load `.env.local` (use Node's `--env-file-if-exists=.env.local`).

## Rules
- Never print, log, or hard-code `DATABASE_URL` or any password. Do not create `.env*` files.
- Do not modify files outside `web/src/db/`, `web/drizzle/`, `web/drizzle.config.ts`, `web/scripts/migrate.mjs`, `web/scripts/seed.ts`, `web/package.json`, `web/package-lock.json`.
- Do not git commit, push, or change branches.
- TypeScript strict; no `any`.

## Acceptance (run all, in `web/`)
If the database is unreachable from your sandbox, run what you can (4, 5, and `npm run db:generate`), mark 1–3 as "not run: no DB access" — the reviewer runs them against the dev DB.
1. `npm run db:migrate` → "migrations applied"
2. `npm run db:seed` → communities 5, collections 10, items 41, featured 10
3. `npm run db:seed` again → same counts (idempotent)
4. `npx tsc --noEmit` and `npm run lint` → no errors
5. `npm run build` → succeeds (pages still use static data in this task)

## Report (max 15 lines)
Files created/changed · each acceptance command with its result line · anything you were unsure about or deviated from.
