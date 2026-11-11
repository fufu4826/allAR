import { Suspense } from "react";
import Link from "next/link";
import { and, desc, gte, ne, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { communities, items, pageStats } from "@/db/schema";
import { thaiDay } from "@/lib/stats";

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

const RANGES = [
  { value: "7", label: "7 วันล่าสุด" },
  { value: "30", label: "30 วันล่าสุด" },
  { value: "all", label: "ทั้งหมด" },
];

const views = sql<number>`CAST(SUM(CASE WHEN ${pageStats.event} = 'view' THEN ${pageStats.count} ELSE 0 END) AS SIGNED)`;
const ars = sql<number>`CAST(SUM(CASE WHEN ${pageStats.event} = 'ar' THEN ${pageStats.count} ELSE 0 END) AS SIGNED)`;
/** First day of a window of `count` days ending today (Thai time). */
const daysAgo = (count: number) => thaiDay(Date.now() - (count - 1) * 86_400_000);
const n = (v: unknown) => Number(v ?? 0).toLocaleString("th-TH");

async function StatsContent({ searchParams }: PageProps) {
  await requireAdmin();
  const { days: daysParam } = await searchParams;
  const range = RANGES.some((r) => r.value === daysParam) ? daysParam! : "30";
  const days = range === "all" ? null : Number(range);
  const since = days ? daysAgo(days) : "1970-01-01";
  const inRange = gte(pageStats.day, since);

  const [totals, perSite, siteViews, topItems, daily, siteRows, itemRows] = await Promise.all([
    db.select({ views, ars }).from(pageStats).where(inRange),
    // Everything opened at a site: its own page plus its item pages.
    db.select({ slug: pageStats.slug, views, ars }).from(pageStats).where(inRange).groupBy(pageStats.slug),
    db.select({ slug: pageStats.slug, views }).from(pageStats).where(and(inRange, sql`${pageStats.itemId} = ''`)).groupBy(pageStats.slug),
    db
      .select({ slug: pageStats.slug, itemId: pageStats.itemId, views, ars })
      .from(pageStats)
      .where(and(inRange, ne(pageStats.itemId, "")))
      .groupBy(pageStats.slug, pageStats.itemId)
      .orderBy(desc(views), desc(ars))
      .limit(20),
    db
      .select({ day: pageStats.day, views, ars })
      .from(pageStats)
      .where(gte(pageStats.day, daysAgo(30)))
      .groupBy(pageStats.day)
      .orderBy(desc(pageStats.day)),
    db.select({ slug: communities.slug, name: communities.shortName, sortOrder: communities.sortOrder }).from(communities),
    db.select({ id: items.id, name: items.name }).from(items),
  ]);

  const siteName = new Map(siteRows.map((s) => [s.slug, s.name]));
  const itemName = new Map(itemRows.map((i) => [i.id, i.name]));
  const siteOwnViews = new Map(siteViews.map((s) => [s.slug, Number(s.views)]));
  const sites = [...siteRows]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => {
      const row = perSite.find((p) => p.slug === s.slug);
      return { ...s, views: Number(row?.views ?? 0), ars: Number(row?.ars ?? 0), pageViews: siteOwnViews.get(s.slug) ?? 0 };
    });
  const maxDaily = Math.max(1, ...daily.map((d) => Number(d.views)));
  const total = totals[0] ?? { views: 0, ars: 0 };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">สถิติการเข้าชม</h1>
          <p className="text-sm text-muted">
            นับเมื่อมีผู้เปิดหน้าแหล่งเรียนรู้หรือหน้าชิ้นงาน และเมื่อกดปุ่ม &quot;ดูใน AR&quot; ไม่เก็บข้อมูลส่วนตัวของผู้เข้าชม
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="ช่วงเวลา">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/stats?days=${r.value}`}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                range === r.value ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-muted">จำนวนครั้งที่เปิดหน้า</span>
          <p className="mt-2 text-3xl font-bold text-ink">{n(total.views)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <span className="text-sm font-medium text-muted">จำนวนครั้งที่กด &quot;ดูใน AR&quot;</span>
          <p className="mt-2 text-3xl font-bold text-ink">{n(total.ars)}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">แยกตามแหล่งเรียนรู้</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs text-muted">
              <tr>
                <th className="px-4 py-3">แหล่งเรียนรู้</th>
                <th className="px-4 py-3 text-right">เปิดหน้าแหล่งเรียนรู้</th>
                <th className="px-4 py-3 text-right">เปิดทุกหน้ารวมชิ้นงาน</th>
                <th className="px-4 py-3 text-right">กดดูใน AR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sites.map((s) => (
                <tr key={s.slug}>
                  <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{n(s.pageViews)}</td>
                  <td className="px-4 py-3 text-right font-mono">{n(s.views)}</td>
                  <td className="px-4 py-3 text-right font-mono">{n(s.ars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">ชิ้นงานยอดนิยม 20 อันดับ</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs text-muted">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">ชิ้นงาน</th>
                <th className="px-4 py-3">แหล่งเรียนรู้</th>
                <th className="px-4 py-3 text-right">เปิดหน้า</th>
                <th className="px-4 py-3 text-right">กดดูใน AR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {topItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    ยังไม่มีข้อมูลในช่วงเวลานี้
                  </td>
                </tr>
              ) : (
                topItems.map((t, i) => (
                  <tr key={`${t.slug}/${t.itemId}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/c/${t.slug}/${t.itemId}`} target="_blank" className="text-brand hover:underline">
                        {itemName.get(t.itemId) ?? "(ชิ้นงานถูกลบแล้ว)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{siteName.get(t.slug) ?? t.slug}</td>
                    <td className="px-4 py-3 text-right font-mono">{n(t.views)}</td>
                    <td className="px-4 py-3 text-right font-mono">{n(t.ars)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">รายวัน 30 วันล่าสุด</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs text-muted">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">เปิดหน้า</th>
                <th className="px-4 py-3 text-right">กดดูใน AR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {daily.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted">
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                daily.map((d) => (
                  <tr key={d.day}>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                      {new Date(`${d.day}T00:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" })}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 rounded-full bg-brand" style={{ width: `${Math.max(2, (Number(d.views) / maxDaily) * 240)}px` }} />
                        <span className="font-mono text-xs">{n(d.views)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{n(d.ars)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function StatsPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดสถิติ…</div>}>
      <StatsContent {...props} />
    </Suspense>
  );
}
