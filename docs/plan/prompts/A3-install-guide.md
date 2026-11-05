# A3 — Thai installation guide for university IT staff (agy · mode accept-edits · effort medium)

## Role
Technical writer for "AllAR". Write the guide a university server administrator follows to deploy the system from scratch. They know Linux/Windows and Docker basics but have never seen this project. Reviewer: Claude will execute every command you write on a clean machine — anything that does not work verbatim fails review.

## Context (read these files first)
- `deploy/docker-compose.yml`, `deploy/.env.example`, `web/Dockerfile`, `deploy/backup/*` — the real setup; **describe only what exists there**, do not invent options.
- Delivery: code from public GitHub repo `https://github.com/fufu4826/allAR`; database dump `allar_db.sql.gz` and media archive `uploads.zip` (+ `SHA256SUMS.txt`) are delivered separately.
- Target OS unknown: give commands for **Linux (bash)** and note Windows PowerShell differences only where a command differs.

## Verified facts (tested on a clean Ubuntu 24.04 + Docker 29 machine — use these exactly; they override anything above or below)
- Compose project name is fixed in the file (`name: allar`): containers `allar-web-1`, `allar-mariadb-1`, `allar-backup-1`; volumes `allar_db_data`, `allar_uploads`. Run every command from the `deploy/` folder.
- Passwords: `openssl rand -hex 24` (NOT base64 — `/` and `+` break `DATABASE_URL`). On a machine without openssl (e.g. Windows): `docker run --rm --entrypoint openssl mariadb:12.3 rand -hex 24`. Fill `DB_ROOT_PASSWORD` and `DB_PASSWORD`; compose refuses to start while they are empty.
- First `docker compose up -d --build` takes about 2–3 minutes on 2 vCPU; images: `allar-web` ≈ 395 MB, `allar-backup` ≈ 460 MB. Web is published on `127.0.0.1:3000` only (`WEB_BIND`/`WEB_PORT`). Health: `curl http://127.0.0.1:3000/api/health` → `{"status":"ok"}`. Migrations run automatically at every web start.
- Import of the delivered bundle (after the stack is up): copy `allar_db.sql.gz`, `uploads.zip`, `SHA256SUMS.txt` into `deploy/backups/` (on Linux Docker creates that folder as root → use `sudo cp`), then `sh import-bundle.sh`. It verifies SHA256SUMS inside the container, imports the DB, unzips media into the uploads volume and restarts web. Windows without sh: `docker compose run --rm backup import` then `docker compose restart web`. Do NOT write manual unzip/mysql commands — the script does it.
- First admin: interactive `docker compose exec web node scripts/create-admin.mjs <ชื่อผู้ใช้> "<ชื่อที่แสดง>"` (asks for the password, 12–128 characters, not echoed), or non-interactive `docker compose exec -T -e ADMIN_PASSWORD='<รหัสผ่าน>' web node scripts/create-admin.mjs <ชื่อผู้ใช้> "<ชื่อที่แสดง>"`. Prints `admin created: <ชื่อผู้ใช้>`. Login page: `/admin/login`. There is no default admin account.
- Backups: daily at `BACKUP_TIME` (Asia/Bangkok) into `deploy/backups/` as `db_YYYY-MM-DD_HHMM.sql.gz` + `uploads_YYYY-MM-DD_HHMM.tar.gz`, files older than `BACKUP_KEEP_DAYS` are deleted. One-off: `docker compose run --rm backup now`. Restore: `docker compose run --rm backup restore --yes /backups/db_<…>.sql.gz /backups/uploads_<…>.tar.gz` (either file alone also works; without `--yes` it refuses) then `docker compose restart web` (the web keeps content in an in-memory cache). Logs: `docker compose logs backup`. Copy `deploy/backups/` off the server regularly.
- Update: `git pull` then `docker compose up -d --build` (backup scripts are baked into the backup image, so `--build` is required). Rollback: `git checkout <tag หรือ commit เดิม>` + `docker compose up -d --build`; take `backup now` before updating.
- phpMyAdmin: `docker compose --profile tools up -d phpmyadmin` → `http://127.0.0.1:8080` on the server only (use `ssh -L 8080:127.0.0.1:8080 <ผู้ใช้>@<เซิร์ฟเวอร์>`), stop with `docker compose --profile tools stop phpmyadmin`. Log in with `DB_USER`/`DB_PASSWORD`.
- Volume data survives `docker compose down`; `docker compose down -v` DELETES the database and media — warn about it in bold.
- Next.js keeps the forwarded header from the proxy (it only fills `x-forwarded-for` when missing), so with nginx `proxy_add_x_forwarded_for` the last hop is the real client IP.

## Goal
`deploy/README.md` in Thai: a person can go from empty server to working site + verified backup by following it top to bottom.

## Required sections (in this order)
1. ภาพรวมระบบ — diagram (ASCII) of containers web / mariadb / backup / phpmyadmin(profile tools), ports, volumes
2. ความต้องการของเครื่อง — Docker Engine ≥ 24 + Compose v2, RAM ≥ 2 GB (build ≥ 3 GB), disk ≥ 20 GB, outbound internet only for pulling images
3. ติดตั้งครั้งแรก — clone · `cp .env.example .env` · how to generate strong passwords (see Verified facts) · `docker compose up -d --build` · check `docker compose ps` + `curl http://127.0.0.1:3000/api/health`
4. นำเข้าข้อมูลที่ส่งแยก — verify `sha256sum -c` · run `import-bundle.sh` (see Verified facts)
5. สร้างผู้ดูแลระบบคนแรก — the exact `docker compose exec web …` command
6. เชื่อมกับโดเมนและ HTTPS — reverse proxy example for nginx (with `client_max_body_size 260m;`, `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` and `X-Forwarded-Proto`, explain that the app trusts only the LAST X-Forwarded-For hop when `TRUST_PROXY=true`, so exactly one proxy must sit in front, MIME types `.glb`/`.usdz`, proxy headers) and a note that AR requires HTTPS
7. สำรองและกู้คืนข้อมูล — where backups land, retention 30 days, how to run one manually, how to restore DB and uploads, monthly restore test
8. อัปเดตเวอร์ชัน — `git pull` · `docker compose up -d --build` (migrations run automatically) · rollback
9. ใช้ phpMyAdmin / ต่อฐานข้อมูลแบบชั่วคราว — `--profile tools`, bound to 127.0.0.1, SSH tunnel example
10. แก้ปัญหาที่พบบ่อย — healthcheck failing, upload too large (proxy limit), Thai text shows `???` (charset), port in use
11. ความปลอดภัย — never commit `.env`, DB not exposed, change default admin password, logs retention

## Rules
- Thai prose, commands in fenced code blocks exactly as typed. Placeholders as `<ชื่อโดเมน>`.
- Never include real passwords or tokens.
- Only edit `deploy/README.md`. No commits, pushes, or branch changes.

## Report (max 10 lines)
Section list · any place where the compose/Dockerfile was unclear so you had to guess.
