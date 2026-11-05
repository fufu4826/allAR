# C4 — Docker delivery package: Dockerfile, compose, backup (Codex · gpt-6.1-terra · effort medium · sandbox workspace-write)

## Role
DevOps engineer on "AllAR". University IT staff will deploy your files on a server whose OS is **unknown** (Linux or Windows with Docker). They receive the code from GitHub and the database dump + media archive separately. Everything must run with only Docker Engine ≥ 24 and Compose v2 — no host scripts, no PowerShell, no cron on the host.

## Context
- Repo root = cwd. App: `web/` (Next.js 16.4, Node 24). Read `web/node_modules/next/dist/docs/` on `output: 'standalone'` and self-hosting before writing the Dockerfile.
- App needs env: `DATABASE_URL`, `UPLOAD_DIR=/app/uploads`, `NODE_ENV=production`, `TRUST_PROXY`, `PORT=3000`. Health endpoint: `GET /api/health`. Migrations: `node scripts/migrate.mjs` (uses `./drizzle`). Admin creation: `node scripts/create-admin.mjs`.
- Native deps: `@node-rs/argon2` (prebuilt binaries — pick a base image they support), `sharp` is dev-only (not in the runtime image).
- `npm run build` runs `prebuild` → `scripts/copy-decoders.mjs`, which copies 3D decoders from `node_modules/three` into `public/decoders/` (git-ignored) — the build stage must run it, and the runtime image must include the resulting `public/decoders/`.
- `next build` does **not** need the database (verified with an unreachable `DATABASE_URL`); pass a dummy `DATABASE_URL` at build time if a module reads it.
- Server Actions accept bodies up to 260 MB (`next.config.ts`).
- Current draft compose (DB + phpMyAdmin only, tested on a Windows laptop): `deploy/docker-compose.yml`, `deploy/.env.example`, `deploy/init/01-init.sql`. Replace them. Ignore `deploy/*.ps1` (laptop-only tools; leave them untouched).
- Your sandbox may have no network or Docker: write files carefully; the reviewer builds and runs them on a test machine.

## Goal
`docker compose up -d --build` in `deploy/` on a clean machine gives a running site with database, automatic migrations, and daily backups.

## Files
1. `web/Dockerfile` — multi-stage:
   - `deps`: `node:24-bookworm-slim`, `npm ci`.
   - `build`: copy source, `npm run build` with `output: 'standalone'` (set it in `web/next.config.ts`).
   - `runtime`: `node:24-bookworm-slim`; copy `.next/standalone`, `.next/static`, `public`, `drizzle/`, `scripts/migrate.mjs`, `scripts/create-admin.mjs` and only the node_modules those two scripts need (`drizzle-orm`, `mysql2`, `@node-rs/argon2` and their deps). Run as non-root user `app` (uid 10001). `ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0`. `HEALTHCHECK` with `node -e` fetching `/api/health` (no curl/wget dependency).
   - Entrypoint script `web/docker-entrypoint.sh`: wait for DB (retry migrate up to 30× every 2 s), run migrations, then `exec node server.js`. LF line endings (add `.gitattributes` rule `*.sh text eol=lf`).
2. `web/.dockerignore`: node_modules, .next, .env*, tests, data, `*.md`.
3. `deploy/docker-compose.yml` services:
   - `mariadb`: `mariadb:12.3`, command flags `--character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-time-zone=+00:00` (the app pins sessions to UTC; Drizzle writes UTC), env from `.env` (`DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` with `:?` required markers), volume `db_data`, healthcheck `healthcheck.sh --connect --innodb_initialized`, **no published ports**, network `internal`.
   - `web`: build `../web`, image `allar-web:${APP_VERSION:-latest}`, `depends_on: mariadb: condition: service_healthy`, env `DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@mariadb:3306/${DB_NAME}`, `UPLOAD_DIR=/app/uploads`, `TRUST_PROXY=${TRUST_PROXY:-true}`; volume `uploads:/app/uploads`; ports `"${WEB_BIND:-127.0.0.1}:${WEB_PORT:-3000}:3000"`; restart `unless-stopped`; `mem_limit: 1536m` (admin uploads up to 260 MB are buffered in memory).
   - `backup`: image `mariadb:12.3` (has `mariadb-dump`), mounts `uploads` read-only and `./backups:/backups`; runs `deploy/backup/backup.sh` in a loop that sleeps until `${BACKUP_TIME:-02:00}` (TZ `Asia/Bangkok`) each day: `mariadb-dump --single-transaction --routines --events --triggers` of `$DB_NAME` → `db_YYYY-MM-DD_HHMM.sql.gz` (verify with `gzip -t`), plus `uploads_YYYY-MM-DD_HHMM.tar.gz`; delete files older than `${BACKUP_KEEP_DAYS:-30}`; log one line per run to stdout. `restart: unless-stopped`. Also supports `docker compose run --rm backup now` for a one-off backup.
   - `phpmyadmin`: `phpmyadmin:5.2.3`, `profiles: ["tools"]`, port `127.0.0.1:${PMA_PORT:-8080}:80`, `UPLOAD_LIMIT: 128M`.
   - Volumes `db_data`, `uploads` (named, project-prefixed). Network `internal`.
4. `deploy/backup/backup.sh` and `deploy/backup/restore.sh` (POSIX sh, LF): restore takes `db_<…>.sql.gz` and/or `uploads_<…>.tar.gz`; refuses to run without `--yes`; restores DB into `$DB_NAME` and uploads into the volume; usage: `docker compose run --rm backup restore --yes /backups/db_….sql.gz`.
5. `deploy/import-bundle.sh`: one-time import of the separately delivered `allar_db.sql.gz` and `uploads.zip` (verifies `SHA256SUMS.txt` first) via `docker compose run --rm backup` — so it works the same on Linux and Windows.
6. `deploy/.env.example`: every variable above with comments (Thai), empty passwords, instruction to generate with `openssl rand -base64 24`.
7. Remove `deploy/init/01-init.sql` usage (charset is set by command flags; DB is created by the entrypoint env).

## Rules
- No secrets in any file. No host bind-mounts except `./backups`. Nothing listens on 0.0.0.0 by default.
- Do not modify app source except `web/next.config.ts` (`output: 'standalone'` only) and adding `web/docker-entrypoint.sh`, `web/Dockerfile`, `web/.dockerignore`, `.gitattributes`.
- No commits, pushes, or branch changes.

## Acceptance (reviewer runs on the test machine; you check syntax)
1. `docker compose config` valid with a filled `.env`.
2. `docker compose up -d --build` from empty volumes → all services healthy; `curl 127.0.0.1:3000/api/health` → ok; tables exist.
3. `docker compose run --rm backup now` → both archives created; `restore --yes` round-trip restores Thai text byte-identical.
4. `docker compose --profile tools up -d phpmyadmin` → reachable only on 127.0.0.1.
5. Image size of `allar-web` < 400 MB.

## Report (max 15 lines)
Files · anything you could not verify in the sandbox · choices the reviewer should double-check.
