import { Suspense } from "react";
import Link from "next/link";
import { and, asc, eq, isNull, like, ne, sql, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities, items, pageStats } from "@/db/schema";
import ItemFilter from "./ItemFilter";
import { STATUS_OPTIONS } from "../labels";
import DeleteItemButton from "./DeleteItemButton";

export const metadata = { title: "ชิ้นงาน 3D" };

interface PageProps {
  searchParams: Promise<{ community?: string; collection?: string; q?: string; status?: string }>;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const n = (v: number) => v.toLocaleString("th-TH");

function Badges({ item }: { item: { modelPath: string | null; usdzPath: string | null; audioPath: string | null; thumbnailPath: string | null } }) {
  return (
    <div className="flex flex-wrap gap-1">
      {item.modelPath && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">3D</span>}
      {item.usdzPath && <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">iPhone AR</span>}
      {item.audioPath && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">เสียง</span>}
      {!item.thumbnailPath && <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">ไม่มีภาพ</span>}
    </div>
  );
}

function Status({ isPublished, isFeatured }: { isPublished: boolean; isFeatured: boolean }) {
  return (
    <span className="flex flex-wrap gap-x-2 text-xs">
      {isPublished ? <span className="text-emerald-700">● เผยแพร่</span> : <span className="text-gray-500">○ ฉบับร่าง</span>}
      {isFeatured && <span className="font-medium text-amber-600">⭐ แนะนำ</span>}
    </span>
  );
}

async function ItemsListContent({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const community = str(sp.community);
  const collection = str(sp.collection);
  const q = str(sp.q).slice(0, 100);
  const status = STATUS_OPTIONS.some((o) => o.value === sp.status) ? str(sp.status) : "";

  const [siteRows, colRows] = await Promise.all([
    db.select({ id: communities.id, name: communities.shortName }).from(communities).orderBy(asc(communities.sortOrder)),
    db.select({ id: collections.id, name: collections.name, communityId: collections.communityId }).from(collections).orderBy(asc(collections.sortOrder), asc(collections.name)),
  ]);

  const where: SQL[] = [];
  if (community) where.push(eq(collections.communityId, community));
  if (collection) where.push(eq(items.collectionId, collection));
  if (q) where.push(like(items.name, `%${q.replace(/[%_\\]/g, "\\$&")}%`));
  if (status === "published") where.push(eq(items.isPublished, true));
  if (status === "draft") where.push(eq(items.isPublished, false));
  if (status === "featured") where.push(eq(items.isFeatured, true));
  if (status === "nothumb") where.push(isNull(items.thumbnailPath));

  const views = db
    .select({ itemId: pageStats.itemId, total: sql<number>`CAST(SUM(${pageStats.count}) AS SIGNED)`.as("total") })
    .from(pageStats)
    .where(and(eq(pageStats.event, "view"), ne(pageStats.itemId, "")))
    .groupBy(pageStats.itemId)
    .as("views");

  const rows = await db
    .select({
      id: items.id, name: items.name, description: items.description, modelPath: items.modelPath, usdzPath: items.usdzPath,
      thumbnailPath: items.thumbnailPath, audioPath: items.audioPath, isFeatured: items.isFeatured, isPublished: items.isPublished,
      sortOrder: items.sortOrder, collectionId: items.collectionId, collectionName: collections.name, communityName: communities.shortName,
      communitySlug: communities.slug, views: sql<number>`COALESCE(${views.total}, 0)`,
    })
    .from(items)
    .innerJoin(collections, eq(items.collectionId, collections.id))
    .innerJoin(communities, eq(collections.communityId, communities.id))
    .leftJoin(views, eq(views.itemId, items.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(communities.sortOrder), asc(collections.sortOrder), asc(items.sortOrder), asc(items.name));

  const filtered = !!(community || collection || q || status);
  const newHref = collection ? `/admin/items/new?collection=${collection}` : "/admin/items/new";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">ชิ้นงาน 3D</h1>
          <p className="text-sm text-muted">{filtered ? `พบ ${n(rows.length)} ชิ้นตามตัวกรอง` : `ทั้งหมด ${n(rows.length)} ชิ้น`}</p>
        </div>
        <Link href={newHref} className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark">
          + เพิ่มชิ้นงาน 3D
        </Link>
      </div>

      <ItemFilter communities={siteRows} collections={colRows} initialCommunity={community} initialCollection={collection} initialQuery={q} initialStatus={status} />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white py-10 text-center text-sm text-muted">ไม่พบชิ้นงานตามเงื่อนไขนี้</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <li className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_8rem_7rem_4.5rem_auto] gap-4 bg-paper px-4 py-2.5 text-xs text-muted md:grid">
            <span>ชิ้นงาน</span>
            <span>แหล่งเรียนรู้ / หมวดหมู่</span>
            <span>ไฟล์</span>
            <span>สถานะ</span>
            <span className="text-right">เข้าชม</span>
            <span className="w-[10.5rem] text-right">จัดการ</span>
          </li>
          {rows.map((item) => (
            <li key={item.id} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_8rem_7rem_4.5rem_auto] md:items-center md:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {item.thumbnailPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailPath} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl border border-line object-cover" />
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-bold text-brand-dark">3D</div>
                )}
                <div className="min-w-0">
                  <Link href={`/admin/items/${item.id}`} className="font-semibold text-ink hover:text-brand">{item.name}</Link>
                  <div className="line-clamp-1 text-xs text-muted">{item.description}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 md:hidden">
                    <Status isPublished={item.isPublished} isFeatured={item.isFeatured} />
                    <span className="text-xs text-muted">· {n(Number(item.views))} ครั้ง</span>
                  </div>
                </div>
              </div>
              <div className="text-xs">
                <span className="font-medium text-ink">{item.communityName}</span>
                <span className="text-muted"> · {item.collectionName}</span>
              </div>
              <Badges item={item} />
              <div className="hidden md:block"><Status isPublished={item.isPublished} isFeatured={item.isFeatured} /></div>
              <div className="hidden text-right font-mono text-xs text-muted md:block">{n(Number(item.views))}</div>
              <div className="flex items-start justify-end gap-2">
                <a href={`/c/${item.communitySlug}/${item.id}`} target="_blank" rel="noopener" className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-brand" title="เปิดหน้าชิ้นงานบนเว็บ">
                  ดู ↗
                </a>
                <Link href={`/admin/items/${item.id}`} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-brand">
                  แก้ไข
                </Link>
                <DeleteItemButton id={item.id} name={item.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ItemsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดรายการชิ้นงาน…</div>}>
      <ItemsListContent searchParams={searchParams} />
    </Suspense>
  );
}
