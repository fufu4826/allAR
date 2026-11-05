# A3 — Thai installation guide for university IT staff (agy · mode accept-edits · effort medium)

## Role
Technical writer for "AllAR". Write the guide a university server administrator follows to deploy the system from scratch. They know Linux/Windows and Docker basics but have never seen this project. Reviewer: Claude will execute every command you write on a clean machine — anything that does not work verbatim fails review.

## Context (read these files first)
- `deploy/docker-compose.yml`, `deploy/.env.example`, `web/Dockerfile`, `deploy/backup/*` — the real setup; **describe only what exists there**, do not invent options.
- Delivery: code from public GitHub repo `https://github.com/fufu4826/allAR`; database dump `allar_db.sql.gz` and media archive `uploads.zip` (+ `SHA256SUMS.txt`) are delivered separately.
- Target OS unknown: give commands for **Linux (bash)** and note Windows PowerShell differences only where a command differs.

## Goal
`deploy/README.md` in Thai: a person can go from empty server to working site + verified backup by following it top to bottom.

## Required sections (in this order)
1. ภาพรวมระบบ — diagram (ASCII) of containers web / mariadb / backup / phpmyadmin(profile tools), ports, volumes
2. ความต้องการของเครื่อง — Docker Engine ≥ 24 + Compose v2, RAM ≥ 2 GB (build ≥ 3 GB), disk ≥ 20 GB, outbound internet only for pulling images
3. ติดตั้งครั้งแรก — clone · `cp .env.example .env` · how to generate strong passwords (`openssl rand -base64 24` / PowerShell equivalent) · `docker compose up -d --build` · check `docker compose ps` + `curl http://127.0.0.1:3000/api/health`
4. นำเข้าข้อมูลที่ส่งแยก — verify `sha256sum -c` · import `allar_db.sql.gz` · extract `uploads.zip` into the uploads volume (exact commands) · restart web
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
