# C3 — Admin authentication, sessions, audit, upload validation (Codex · gpt-6.1-terra · effort medium · sandbox workspace-write)

## Role
Senior application-security engineer and Next.js 16 developer on "AllAR", a Thai university website. You write the security core that other developers (and an AI agent writing the admin UI) will call. A security reviewer (Claude) checks every line against OWASP ASVS L1; correctness beats brevity.

## Context
- Repo root = cwd. Next.js app in `web/` (Next.js 16.4, React 19.3, `cacheComponents: true`). **Read `web/AGENTS.md` and the relevant docs in `web/node_modules/next/dist/docs/` (cookies, Server Actions, `redirect`, `headers`, route handlers) before coding** — APIs differ from older Next.js.
- DB layer exists (task C1): `web/src/db/schema.ts` has `admins`, `sessions` (id = SHA-256 hex of token), `login_attempts`, `audit_logs`; `web/src/db/index.ts` exports `db`.
- Packages already installed: `@node-rs/argon2`, `file-type`. Your sandbox may have no network — do not run `npm install`.
- Media are stored under env `UPLOAD_DIR` and referenced as `/uploads/<relative path>`.
- University policy requires OWASP Top 10 compliance, audit logging, and minimal personal data (PDPA).

## Goal
A small, well-tested security core: password hashing, DB-backed sessions, login with rate limiting, route protection, audit logging, and safe file uploads.

## Files to create
1. `web/src/lib/auth.ts` (`import 'server-only'`)
   - `hashPassword(pw)` / `verifyPassword(hash, pw)` — argon2id via `@node-rs/argon2` (memoryCost 19456, timeCost 2, parallelism 1). Reject passwords < 12 chars or > 128 chars in `hashPassword`.
   - `createSession(adminId)`: 32 random bytes → base64url token; store only `sha256(token)` hex as `sessions.id`; expires in 8 h (sliding: extend when < 4 h left, at most once per request); set cookie `allar_session` — `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` when `NODE_ENV === 'production'` **or** request is HTTPS, `Max-Age` matching expiry.
   - `getCurrentAdmin()`: read cookie → hash → join `admins` where `is_active`; expired → delete row, return null. Wrap in React `cache()` so one request hits the DB once. Must never be inside `'use cache'`.
   - `requireAdmin()`: `getCurrentAdmin()` or `redirect('/admin/login')`.
   - `destroySession()`: delete row + clear cookie.
   - `login(username, password, ip, userAgent)`: returns `{ ok: true } | { ok: false, reason: 'invalid' | 'locked' }`.
     - Lockout: ≥ 5 failed attempts for that username **or** ≥ 20 for that IP in the last 15 min → `locked` (do not reveal which).
     - Always run `verifyPassword` (against a fixed dummy hash when the user does not exist) to avoid timing-based user enumeration.
     - Record every attempt in `login_attempts`; on success update `last_login_at`, create session, `audit(..., 'login', 'admin', id)`.
   - `getClientIp()`: first value of `x-forwarded-for` only if env `TRUST_PROXY=true`, else the socket/`x-real-ip` fallback Next exposes; truncate to 45 chars.
2. `web/src/lib/audit.ts` (`server-only`): `audit(adminId | null, action, entity, entityId?, detail?)` → insert into `audit_logs` with IP. Strip any key named like `password|token|secret` from `detail` before saving. Never throws (log a one-line error instead).
3. `web/src/lib/uploads.ts` (`server-only`):
   - `saveUpload(file: File, kind: 'model'|'usdz'|'image'|'audio'): Promise<string>`
     - Limits: model 100 MB, usdz 100 MB, image 15 MB, audio 30 MB → throw `UploadError` with a Thai message.
     - Detect type from **magic bytes** with `file-type` (glb: check header `glTF` manually since file-type may not know it; usdz: zip signature + `.usdz` extension). Allowed: glb; usdz; jpeg/png/webp; mp3/wav/m4a. Ignore the client-supplied MIME and filename except for nothing more than logging.
     - Save as `<kind>s/<yyyy>/<mm>/<random 16 bytes hex>.<ext>` under `UPLOAD_DIR`, created with `mkdir -p`; write to a temp file then `rename`. Return `/uploads/<relative path>`.
   - `deleteUpload(path)`: only accepts `/uploads/...`; resolve and verify it stays inside `UPLOAD_DIR`; ignore missing files.
   - `export class UploadError extends Error`.
4. `web/src/app/admin/login/page.tsx` + `actions.ts`: Thai login form (username, password), `useActionState`, generic error "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", locked message "ลองใหม่อีกครั้งใน 15 นาที". On success redirect to `/admin`. Already logged in → redirect `/admin`. Mark the page `robots: noindex`.
5. `web/src/app/admin/layout.tsx`: shell with Thai nav (แดชบอร์ด, ชุมชน, ชิ้นงาน, ผู้ดูแล, บันทึกการใช้งาน, ออกจากระบบ). It must **not** call `requireAdmin()` itself (the login page lives under it) — each admin page calls it. Logout is a Server Action form.
6. `web/scripts/create-admin.mjs`: plain Node ESM (runs inside the Docker image, no tsx): `node scripts/create-admin.mjs <username> <display name>`; reads the password from stdin without echo (or env `ADMIN_PASSWORD` for automation); validates length; refuses if the username exists; uses argon2id with the same parameters; prints only "admin created: <username>".
7. Security headers in `web/next.config.ts` `headers()`: for all routes `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(self), microphone=(), geolocation=()` (camera is needed for AR); for `/admin/:path*` also `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
8. `web/src/lib/auth.test.ts` (Node's built-in `node:test` run via `tsx --test`): unit tests for hashing round-trip, password length rules, token→hash, `deleteUpload` path traversal rejection, magic-byte detection with tiny fixture buffers (glb header, png header, fake .exe renamed .png → rejected). No DB needed for these tests. Add npm script `test` = `tsx --test src/**/*.test.ts`.

## Rules
- Server Actions are CSRF-protected by Next's Origin check — do not disable it; do not add `serverActions.allowedOrigins` wildcards.
- Never log passwords, tokens, cookie values, or hashes. Generic errors to the client; details only in server logs without secrets.
- No new dependencies beyond those listed. Only touch the files listed above plus `web/package.json` (scripts only). No commits, pushes, or branch changes.

## Acceptance
1. `npx tsc --noEmit`, `npm run lint`, `npm test` pass.
2. Mark as "not run: no DB access" if needed — reviewer will: create an admin with the script, log in, see `/admin` (any placeholder page calling `requireAdmin()`), fail 6 times → locked, confirm `sessions.id` is a 64-char hex and the cookie flags are correct.

## Report (max 15 lines)
Files · test results · every place you made a security trade-off and why.
