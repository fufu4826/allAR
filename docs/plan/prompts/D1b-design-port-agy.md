# D1b — Port the prototype UI into the Next.js app (agy · accept-edits)

## Role
Front-end engineer on "AllAR". The design team built a static HTML prototype. Make the real Next.js app look **the same**, with content from the database. The full spec is `docs/plan/prompts/D1-design-port.md` (read it). Its task 1 is done: schema, migration `web/drizzle/0001_dazzling_annihilus.sql`, `web/src/lib/queries.ts` (community fields, news and gallery queries), `web/src/lib/types.ts`, the admin community form, and assets in `web/public/brand/`. Keep those, and build everything else.

## Method (follow it; it is the fastest way to get the exact look)
1. **Reuse the prototype CSS as-is.**
   - Copy `D:\allAR\data-bundle\incoming\AR-Heritage\style.css` → `web/src/app/(site)/heritage.css`.
   - Copy `community.css` + `phuphan-theme.css` + `nonhom-theme.css` → `web/src/app/(site)/community.css`.
   - Import them only in the public layout, not in admin.
   - Fix the asset URLs to `/brand/...` and change font-family to `var(--font-prompt)` / `var(--font-space-grotesk)`.
   - Write themes for `tharae`, `watklang` and `watnuea` in the same style. Accent colours: tharae `#a45247`, watklang `#b47a32`, watnuea `#765a8c`. Each community page sets `data-community` / `data-theme` the way the prototype `<body>` does.
2. **Convert the HTML to TSX with the same structure and class names.**
   - `index.html` → home `/`.
   - The community HTML pages → `/c/[slug]`.
   - Replace hardcoded content with DB data from `queries.ts`. Keep the static text that is not data (headings, subtitles) word for word.
3. **Port `script.js` / `community.js` behaviour into small client components:**
   - navbar scroll state and mobile menu toggle;
   - scroll-spy;
   - map fullscreen / zoom;
   - gallery filter + lightbox;
   - collection category tabs;
   - the action modal, only if still used.
   - Respect `prefers-reduced-motion`.
4. **Icons:** Font Awesome classes are used everywhere. Install `@fortawesome/fontawesome-free` (self-hosted CSS + webfonts, no CDN) and import `@fortawesome/fontawesome-free/css/all.min.css` in the public layout.
5. **Route group:**
   - Move public pages under `web/src/app/(site)/`: home, `c/`, `search/`, `about/`, `news/`. Give it its own layout with the prototype's announcement bar, navbar (SNRU + institute logos) and footer.
   - `admin/` keeps its current look; it must not load heritage.css.
   - The root `layout.tsx` keeps only html/body, fonts (`next/font/google` Prompt + Space Grotesk as CSS variables) and globals.

## Page content
- **Home:** sections in this order: hero, ar-showcase, identity-map, news, gallery, organization, footer.
  - Hero: keep the prototype's text and buttons. The 5 community chips come from the DB.
  - ar-showcase: identity cards from the DB, in order: number, name, tags, link to `/c/<slug>`. Then a featured 3D viewer below. Use the existing `web/src/components/ModelViewer.tsx` (self-hosted decoders), never the googleapis script. Show featured items and let the user switch between them. "ดูใน AR" links to the item page.
  - identity-map: `/brand/sakon_nakhon_5identities_map.webp`, the legend linking to the communities, fullscreen, and download of the PNG. Add a toggle to the existing Leaflet map (`web/src/components/CommunityMap.tsx`) labelled "แผนที่จริง (OpenStreetMap)".
  - news: the latest 3 published from the DB, with an empty state. Link to `/news/[id]` and `/news`.
  - gallery: published images from the DB, with the filter + lightbox and an empty state.
  - organization + footer: move the text to `web/src/content/site.ts` (overwrite the current corrupted file). Keep the prototype's organization entries with a `// TODO: confirm with the project owner` comment. The contact block uses สถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร, เลขที่ 680 ถนนนิตโย ตำบลธาตุเชิงชุม อำเภอเมือง จังหวัดสกลนคร 47000, โทร 042-970021, saraban@snru.ac.th. Do not use the example.ac.th email.
- **`/c/[slug]`:** the prototype community layout.
  - Hero: englishName, name, tagline, tags, pattern art.
  - Story: description.
  - Location: location text and "ค้นหาบนแผนที่" → `https://www.google.com/maps?q=<lat>,<lng>`.
  - News for this community.
  - 3D collection: one category tab per collection; model cards with the thumbnail link to `/c/<slug>/<itemId>`. Show empty states.
- **Item page:** keep all current behaviour (ModelViewer, AR, audio, description) inside the new layout and theme.
- **`/news`, `/news/[id]`, `/search`, `/about`:** prototype style.
- **Admin:** rewrite `web/src/app/admin/content/` (news + gallery CRUD).
  - Fix its corrupted Thai text. Look at the existing community admin pages for the pattern: every server action starts with `requireAdmin()`, writes an audit log entry via `web/src/lib/audit.ts`, saves images via `saveUpload` in `web/src/lib/uploads.ts`, and finishes with `revalidateTag("content",{expire:0})` + `updateTag("content")`.
  - Add the links to `web/src/app/admin/AdminNav.tsx`.
- **Seed:** edit `web/scripts/seed.ts` (currently reverted to the old version). Communities 2–5 become, in order:
  - `tharae` ชุมชนท่าแร่;
  - `watklang` วัดกลางศรีเชียงใหม่;
  - `watnuea` วัดมหาพรหมโพธิราช;
  - `nonhom` ชุมชนโนนหอม.
  - Fill englishName, tagline, tags, location, description and theme from the prototype pages. Mark them published.
  - Use approximate coordinates with a comment: tharae 17.2408, 104.1617; watklang 17.0794, 104.1694; watnuea 17.0868, 104.1716; nonhom 17.1100, 104.0400.
  - phuphan: theme `phuphan`, plus englishName, tagline and tags from `phuphan.html`.
  - Add the prototype's news cards from `index.html` and the community pages as unpublished drafts. Make it idempotent and keep the existing id scheme: rows `community-2`…`community-5` keep their ids, but their slugs change.
  - Also update `web/src/data/communities.ts` if the seed reads from it.

## Rules (important)
- **Write every file as UTF-8.** Thai text must survive. Earlier output on this branch turned Thai into `????`. When you finish, search `web/src` and `web/scripts` for `????` and fix every hit.
- Next.js 16 rules (read `web/AGENTS.md`):
  - read DB data only after `await connection()` inside `<Suspense>`;
  - dynamic routes keep `generateStaticParams` returning ≥1 param (use the existing `__placeholder__` pattern);
  - new query functions use `'use cache'` + `cacheTag('content')`.
- Do not touch auth, `web/src/lib/uploads.ts`, the uploads route, `deploy/`, or `web/Dockerfile`. No runtime CDN requests.
- Check with `cd web && npx tsc --noEmit && npm run lint && npm test`. The dev server is already running on http://localhost:3200 against a real DB. Use it to check your pages. After changing the seed, run `npm run db:seed`.
- Do not commit, push or switch branches.

## Report (max 15 lines)
Files added/changed · what you could not match · anything you guessed.
