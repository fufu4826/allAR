import { Suspense } from "react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities, items } from "@/db/schema";

export const metadata = { title: "แหล่งเรียนรู้" };

async function CommunitiesList() {
  await requireAdmin();

  const [siteRows, colRows, itemRows] = await Promise.all([
    db.select().from(communities).orderBy(asc(communities.sortOrder), asc(communities.name)),
    db.select({ id: collections.id, communityId: collections.communityId }).from(collections),
    db.select({ collectionId: items.collectionId, isPublished: items.isPublished }).from(items),
  ]);

  const sites = siteRows.map((site) => {
    const colIds = new Set(colRows.filter((c) => c.communityId === site.id).map((c) => c.id));
    const own = itemRows.filter((i) => colIds.has(i.collectionId));
    return { ...site, collectionCount: colIds.size, itemCount: own.length, draftCount: own.filter((i) => !i.isPublished).length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">แหล่งเรียนรู้</h1>
        <p className="text-sm text-muted">
          แหล่งเรียนรู้ {sites.length} แห่งตามโครงการ แก้ชื่อ ข้อความ ภาพปก วีดิทัศน์ และหมวดหมู่ของแต่ละแห่งได้ (เพิ่มหรือลบแหล่งเรียนรู้ไม่ได้)
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {sites.map((site) => (
          <li key={site.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex gap-4 p-4">
              {site.coverPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.coverPath} alt="" className="h-20 w-28 shrink-0 rounded-xl border border-line object-cover" />
              ) : (
                <div className="grid h-20 w-28 shrink-0 place-items-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: site.color || "#e9773e" }}>
                  ไม่มีภาพปก
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-semibold leading-snug text-ink">{site.shortName}</h2>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{site.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {site.isPublished ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">● เผยแพร่</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">○ ซ่อนอยู่</span>
                  )}
                  <span className="rounded-full bg-paper px-2 py-0.5 text-muted">{site.itemCount} ชิ้นงาน{site.draftCount ? ` (ร่าง ${site.draftCount})` : ""}</span>
                  <span className="rounded-full bg-paper px-2 py-0.5 text-muted">{site.collectionCount} หมวดหมู่</span>
                  <span className={`rounded-full px-2 py-0.5 ${site.videoPath ? "bg-paper text-muted" : "bg-amber-50 text-amber-700"}`}>
                    {site.videoPath ? "มีวีดิทัศน์" : "ยังไม่มีวีดิทัศน์"}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 border-t border-line bg-paper/60 px-4 py-3">
              <Link href={`/admin/communities/${site.id}`} className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-dark">
                แก้ข้อมูล
              </Link>
              <Link href={`/admin/communities/${site.id}/collections`} className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium text-ink hover:border-brand">
                หมวดหมู่ ({site.collectionCount})
              </Link>
              <Link href={`/admin/items?community=${site.id}`} className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium text-ink hover:border-brand">
                ชิ้นงาน ({site.itemCount})
              </Link>
              <a href={`/c/${site.slug}`} target="_blank" rel="noopener" className="ml-auto rounded-full px-3 py-1.5 text-xs text-muted hover:text-brand">
                ดูหน้าเว็บ ↗
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลด…</div>}>
      <CommunitiesList />
    </Suspense>
  );
}
