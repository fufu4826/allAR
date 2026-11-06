# D1 — Port the front-end team's design into the app, data from the DB (Codex · gpt-6.1-terra · effort medium · sandbox workspace-write)

## Role
Senior Next.js engineer on "AllAR". The front-end team built a polished **static HTML prototype** ("AR.HERITAGE — 5 แหล่งเรียนรู้สำคัญ"). Your job: make the real app look and behave like that prototype, while keeping every real feature (DB content, 3D/AR viewer, audio, search, admin, uploads, Docker build). The prototype is the visual spec; the database is the content source.

## Context (read first)
- Repo root = cwd. App in `web/` (Next.js 16.4 App Router, React 19.3, Tailwind v4, Drizzle + MariaDB). **Read `web/AGENTS.md` and the relevant guides in `web/node_modules/next/dist/docs/` before writing code** — this Next.js differs from your training data (`cacheComponents`, `'use cache'` + `cacheTag('content')`, request data inside `<Suspense>`, `await connection()` before DB reads so `next build` needs no DB, `generateStaticParams` must return ≥1 param).
- Prototype (read-only, outside the repo): `D:\allAR\data-bundle\incoming\AR-Heritage\` — `index.html`, `style.css`, `script.js` (home); `phuphan.html` / `nonhom.html` / `tharae.html` / `watklang.html` / `watnuea.html` + `community.css`, `community.js`, `phuphan-theme.css`, `nonhom-theme.css` (community pages); `assets/` (logos, two SVG patterns, illustrated province map PNG). Its data is hardcoded and its model links point to an old external site — ignore those links.
- Existing app: `web/src/app/page.tsx` (home with Leaflet map), `c/[slug]/page.tsx` (community), `c/[slug]/[itemId]/page.tsx` (item: `ModelViewer`, audio), `search/`, `about/`, `admin/**` (all server actions call `requireAdmin()` first; audit via `web/src/lib/audit.ts`; uploads via `web/src/lib/uploads.ts`), queries in `web/src/lib/queries.ts`, types in `web/src/lib/types.ts`, schema `web/src/db/schema.ts`, seed `web/scripts/seed.ts` (source `web/src/data/communities.ts` + `phuphan.json`).
- Content facts for the 5 identities (prototype order = sort order):
  1. `tharae` ชุมชนท่าแร่ — THA RAE COMMUNITY — tags สถาปัตยกรรม • ศรัทธา • ประเพณี — location ตำบลท่าแร่ อำเภอเมืองสกลนคร จังหวัดสกลนคร — story and tagline in `tharae.html`.
  2. `watklang` วัดกลางศรีเชียงใหม่ (ชุมชนท่าวัด) — WAT KLANG SI CHIANG MAI — ศิลปกรรม • สถาปัตยกรรม • ชุมชน — `watklang.html`.
  3. `watnuea` วัดมหาพรหมโพธิราช (วัดเหนือ, ชุมชนท่าวัด) — WAT MAHA PHROM PHOTHIRAT — โบราณสถาน • พุทธศิลป์ • ประวัติศาสตร์ — `watnuea.html`.
  4. `nonhom` ชุมชนโนนหอม — NON HOM COMMUNITY — ผ้าคราม • ภูมิปัญญา • วิถีชุมชน — `nonhom.html`.
  5. `phuphan` ศูนย์ศึกษาการพัฒนาภูพานฯ — PHU PHAN DEVELOPMENT STUDY CENTRE — เกษตร • ธรรมชาติ • การเรียนรู้ — existing data (10 collections, 41 items).
  Use approximate coordinates (mark `// approximate — verify with the community` in the seed): tharae 17.2408, 104.1617; watklang 17.0794, 104.1694; watnuea 17.0868, 104.1716; nonhom 17.1100, 104.0400; phuphan keep existing.
- Organizer facts (from the project's own document): organizer สถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร; address เลขที่ 680 ถนนนิตโย ตำบลธาตุเชิงชุม อำเภอเมือง จังหวัดสกลนคร 47000, โทร 042-970021, อีเมล saraban@snru.ac.th. The prototype's footer email `intern.arproject@example.ac.th` is a placeholder — do not use it.

## Goal
Public pages match the prototype's look (layout, colours, typography, section order, per-community themes, responsive behaviour, mobile nav), driven by DB data; news and gallery are managed in admin; everything still builds in Docker without a DB.

## Tasks
1. **Schema + migration** (`npm run db:generate` → new file in `web/drizzle/`, never edit 0000):
   - `communities`: add `englishName` varchar(120) null, `tagline` varchar(255) null, `tags` varchar(255) null (stored "a • b • c"), `theme` varchar(32) not null default 'default' (one of `phuphan`, `nonhom`, `tharae`, `watklang`, `watnuea`, `default`).
   - `news`: id varchar(32) pk, communityId FK → communities (set null), title, summary text, body text, category varchar(64), coverPath null, publishedAt datetime null, isPublished bool default false, sortOrder, createdAt, updatedAt.
   - `gallery_images`: id varchar(32) pk, communityId FK (set null), imagePath, caption, category enum-like varchar(32) (`fieldwork` ลงพื้นที่ชุมชน, `modeling` การสร้างโมเดล 3D, `testing` ทดลองระบบ AR), sortOrder, isPublished default true, createdAt.
2. **Seed** (idempotent, keep upsert style): communities 2–5 become `tharae`, `watklang`, `watnuea`, `nonhom` with the content above, **published**, no items yet (empty state). Keep the old ids if that is simpler, but slugs must change. Add the prototype's news cards as **unpublished drafts** (`isPublished=false`) linked to their community. No gallery seed (prototype gallery has no real images).
3. **Static assets**: copy logos, both SVG patterns and the illustrated map PNG into `web/public/brand/` (optimize the map PNG to WebP ≤ 400 KB and keep the PNG for the "download HD" button). No CDN at runtime: replace Font Awesome with inline SVG icons (a small `Icon` component), load Space Grotesk with `next/font/google` like Prompt, and use the existing self-hosted `@google/model-viewer` (never the googleapis script).
4. **Theme system**: CSS variables per theme (`[data-theme="nonhom"]` etc.) ported from `community.css` + `*-theme.css`; create matching themes for tharae/watklang/watnuea in the prototype's style (their hero uses the brand gradient; give each a distinct accent and reuse the icon from the home cards). Brand stays `#e9773e` + Prompt.
5. **Home** (`/`): navbar with SNRU + institute logos and mobile menu; hero; featured 3D showcase (featured items from DB in the self-hosted `ModelViewer`, with "ดูใน AR" going to the item page); 5 identity cards (from DB, ordered); province map section with the illustrated map, legend linking to each community, fullscreen and download-HD buttons — keep the existing Leaflet map as a second tab "แผนที่จริง (OpenStreetMap)"; news (latest 3 published, empty state if none); gallery with category filter + lightbox (empty state if none); organizations section and footer (put their text in `web/src/content/site.ts` so it is easy to edit; keep the prototype's organization entries but add a `// TODO: confirm with the project owner` comment above them).
6. **Community page** (`/c/[slug]`): the prototype community layout — themed hero with pattern art, story, location card (address + "ค้นหาบนแผนที่" → Google Maps URL from lat/lng), news for that community, then the 3D collection with category tabs (collections) and model cards linking to **our** item pages `/c/[slug]/[itemId]`. Empty states when there is nothing yet.
7. **Item page**: restyle in the community's theme; keep `ModelViewer`, AR button, audio guide and all current data. Add `/news` (list) and `/news/[id]` (detail) pages.
8. **Admin**: add "ข่าวสาร" and "แกลเลอรี" sections in the existing admin style: list/create/edit/delete/publish, image upload through `saveUpload` (kind image), audit log on every mutation, `requireAdmin()` first in every action, `revalidateTag("content",{expire:0})` + `updateTag` like the existing actions. Extend the community form with englishName, tagline, tags, theme (select).
9. Remove now-unused code; keep `/about` (restyle) and `/search` (restyle).

## Rules
- Do not change auth, uploads security, the uploads route, Docker/deploy files, or the existing migration. Do not add runtime CDN requests. Add no new npm dependencies unless unavoidable (state why).
- All new query functions in `queries.ts` use `'use cache'` + `cacheTag('content')`; public pages read the DB only after `await connection()` inside `<Suspense>`.
- Accessibility: real buttons/links, alt text, focus states, `prefers-reduced-motion` respected.
- No commits, pushes, or branch changes.

## Acceptance (run what you can)
1. `npm run lint`, `npx tsc --noEmit`, `npm test` pass; `npm run build` succeeds with `DATABASE_URL=mysql://x:x@127.0.0.1:1/x` (unreachable).
2. If `web/.env.local` points to a reachable DB: `npm run db:migrate && npm run db:seed` work twice in a row.
3. Visual parity with the prototype on 1280px and 390px widths for home and the phuphan / nonhom community pages.

## Report (max 20 lines)
Files changed/added · migration name · anything you could not verify · content you guessed (themes for tharae/watklang/watnuea, coordinates, organization text).
