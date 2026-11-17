import { Suspense } from "react";
import Link from "next/link";
import { asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { admins, auditLogs, collections, communities, items, pageStats } from "@/db/schema";
import { thaiDay } from "@/lib/stats";
import { actionMeta, describeTarget } from "./labels";

export const metadata = { title: { absolute: "แดชบอร์ด · ผู้ดูแลระบบ" } };

/** First day (Thai time) of the last 7 days, today included. */
const weekStartDay = () => thaiDay(Date.now() - 6 * 86_400_000);
const n = (v: unknown) => Number(v ?? 0).toLocaleString("th-TH");
const sumEvent = (event: string) =>
  sql<number>`CAST(COALESCE(SUM(CASE WHEN ${pageStats.event} = ${event} THEN ${pageStats.count} ELSE 0 END), 0) AS SIGNED)`;

function Card({ href, title, value, badge, note }: { href?: string; title: string; value: string; badge?: string; note: string }) {
  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-1 text-muted">
        <span className="text-sm font-medium">{title}</span>
        {badge && <span className="whitespace-nowrap rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark">{badge}</span>}
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </>
  );
  const cls = "rounded-2xl border border-line bg-white p-5 shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} transition hover:border-brand hover:shadow-md`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();
  const weekStart = weekStartDay();

  const [siteRows, colRows, itemRows, [adminActive], [week], recentLogs, adminRows] = await Promise.all([
    db.select({ id: communities.id, slug: communities.slug, name: communities.shortName, isPublished: communities.isPublished, videoPath: communities.videoPath, coverPath: communities.coverPath })
      .from(communities).orderBy(asc(communities.sortOrder)),
    db.select({ id: collections.id, name: collections.name, communityId: collections.communityId }).from(collections),
    db.select({ id: items.id, name: items.name, collectionId: items.collectionId, isPublished: items.isPublished, isFeatured: items.isFeatured, thumbnailPath: items.thumbnailPath })
      .from(items),
    db.select({ value: count() }).from(admins).where(eq(admins.isActive, true)),
    db.select({ views: sumEvent("view"), ars: sumEvent("ar"), videos: sumEvent("video") }).from(pageStats).where(gte(pageStats.day, weekStart)),
    db.select({
        id: auditLogs.id, action: auditLogs.action, entity: auditLogs.entity, entityId: auditLogs.entityId,
        detail: auditLogs.detail, createdAt: auditLogs.createdAt, adminDisplayName: admins.displayName, adminUsername: admins.username,
      })
      .from(auditLogs).leftJoin(admins, eq(auditLogs.adminId, admins.id))
      .orderBy(desc(auditLogs.createdAt)).limit(8),
    db.select({ id: admins.id, username: admins.username }).from(admins),
  ]);

  const siteOf = new Map(colRows.map((c) => [c.id, c.communityId]));
  const perSite = siteRows.map((s) => {
    const own = itemRows.filter((i) => siteOf.get(i.collectionId) === s.id);
    return { ...s, items: own.length, published: own.filter((i) => i.isPublished).length, collections: colRows.filter((c) => c.communityId === s.id).length };
  });
  const names = new Map<string, string>([
    ...siteRows.map((s) => [s.id, s.name] as [string, string]),
    ...colRows.map((c) => [c.id, c.name] as [string, string]),
    ...itemRows.map((i) => [i.id, i.name] as [string, string]),
    ...adminRows.map((a) => [a.id, `@${a.username}`] as [string, string]),
  ]);

  const drafts = itemRows.filter((i) => !i.isPublished).length;
  const noThumb = itemRows.filter((i) => !i.thumbnailPath).length;
  const todo = [
    ...perSite.filter((s) => s.items === 0).map((s) => ({ text: `${s.name} ยังไม่มีชิ้นงาน 3D`, href: `/admin/items/new` })),
    ...perSite.filter((s) => !s.videoPath).map((s) => ({ text: `${s.name} ยังไม่มีวีดิทัศน์แนะนำ`, href: `/admin/communities/${s.id}` })),
    ...perSite.filter((s) => !s.coverPath).map((s) => ({ text: `${s.name} ยังไม่มีภาพปก`, href: `/admin/communities/${s.id}` })),
    ...(drafts ? [{ text: `ชิ้นงาน ${n(drafts)} ชิ้นยังเป็นฉบับร่าง (ผู้เข้าชมมองไม่เห็น)`, href: "/admin/items?status=draft" }] : []),
    ...(noThumb ? [{ text: `ชิ้นงาน ${n(noThumb)} ชิ้นยังไม่มีภาพตัวอย่าง`, href: "/admin/items?status=nothumb" }] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">แดชบอร์ด</h1>
          <p className="text-sm text-muted">
            สวัสดีคุณ <span className="font-medium text-ink">{admin.displayName}</span> (@{admin.username})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/items/new" className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark">
            + เพิ่มชิ้นงาน 3D
          </Link>
          <Link href="/admin/help" className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:border-brand">
            วิธีใช้
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card href="/admin/items" title="ชิ้นงาน 3D" value={n(itemRows.length)} badge={`${n(itemRows.length - drafts)} เผยแพร่`} note={`แนะนำ ${n(itemRows.filter((i) => i.isFeatured).length)} ชิ้น`} />
        <Card href="/admin/communities" title="แหล่งเรียนรู้" value={n(siteRows.length)} badge={`${n(siteRows.filter((s) => s.isPublished).length)} เผยแพร่`} note={`${n(colRows.length)} หมวดหมู่`} />
        <Card href="/admin/stats?days=7" title="เข้าชม 7 วันล่าสุด" value={n(week?.views)} note={`ดูใน AR ${n(week?.ars)} · เล่นวีดิทัศน์ ${n(week?.videos)}`} />
        <Card href="/admin/admins" title="ผู้ดูแลที่ใช้งานอยู่" value={n(adminActive.value)} note="จัดการบัญชีผู้ดูแล" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">แหล่งเรียนรู้ทั้ง 5 แห่ง</h2>
          <ul className="mt-3 divide-y divide-line">
            {perSite.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <Link href={`/admin/communities/${s.id}`} className="w-full font-medium text-ink hover:text-brand sm:w-auto sm:min-w-0 sm:flex-1">
                  {s.name}
                </Link>
                <span className="mr-auto text-xs text-muted sm:mr-0">{n(s.items)} ชิ้นงาน · {n(s.collections)} หมวดหมู่</span>
                <Link href={`/admin/items?community=${s.id}`} className="rounded-full border border-line px-3 py-1 text-xs hover:border-brand">ชิ้นงาน</Link>
                <a href={`/c/${s.slug}`} target="_blank" rel="noopener" className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-brand">ดูหน้าเว็บ ↗</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">สิ่งที่ยังขาด</h2>
          {todo.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-700">ข้อมูลครบทุกแหล่งแล้ว</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {todo.map((t) => (
                <li key={t.text}>
                  <Link href={t.href} className="flex items-start gap-2 text-ink hover:text-brand">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    {t.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">แก้ไขล่าสุด</h2>
          <Link href="/admin/audit" className="text-sm font-medium text-brand hover:text-brand-dark">ดูทั้งหมด →</Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ยังไม่มีบันทึก</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recentLogs.map((log) => {
              const meta = actionMeta(log.action);
              return (
                <li key={String(log.id)} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  <span className="min-w-0 flex-1 text-ink">{describeTarget(log, names)}</span>
                  <span className="text-xs text-muted">
                    {log.adminDisplayName ?? "ระบบ"} · {new Date(log.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดข้อมูล…</div>}>
      <Dashboard />
    </Suspense>
  );
}
