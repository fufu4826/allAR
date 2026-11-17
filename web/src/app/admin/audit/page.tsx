import { Suspense } from "react";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { admins, auditLogs, collections, communities, items } from "@/db/schema";
import { actionMeta, describeDetail, describeTarget, ENTITY_FILTERS } from "../labels";

export const metadata = { title: "บันทึกการแก้ไข" };

interface PageProps {
  searchParams: Promise<{ entity?: string; page?: string }>;
}

const PAGE_SIZE = 50;

async function AuditContent({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const entity = typeof sp.entity === "string" && ENTITY_FILTERS.some((e) => e.value && e.value === sp.entity) ? sp.entity : "";
  const currentPage = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const where = entity ? eq(auditLogs.entity, entity) : undefined;

  const [[totalRow], logRows, siteRows, colRows, itemRows, adminRows] = await Promise.all([
    db.select({ total: count() }).from(auditLogs).where(where),
    db
      .select({
        id: auditLogs.id, action: auditLogs.action, entity: auditLogs.entity, entityId: auditLogs.entityId,
        detail: auditLogs.detail, ip: auditLogs.ip, createdAt: auditLogs.createdAt,
        adminDisplayName: admins.displayName, adminUsername: admins.username,
      })
      .from(auditLogs)
      .leftJoin(admins, eq(auditLogs.adminId, admins.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset((currentPage - 1) * PAGE_SIZE),
    db.select({ id: communities.id, name: communities.shortName }).from(communities),
    db.select({ id: collections.id, name: collections.name }).from(collections),
    db.select({ id: items.id, name: items.name }).from(items),
    db.select({ id: admins.id, username: admins.username }).from(admins),
  ]);
  const names = new Map<string, string>([
    ...[...siteRows, ...colRows, ...itemRows].map((r) => [r.id, r.name] as [string, string]),
    ...adminRows.map((a) => [a.id, `@${a.username}`] as [string, string]),
  ]);

  const total = totalRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildUrl = (p: number, ent = entity) => {
    const params = new URLSearchParams();
    if (ent) params.set("entity", ent);
    if (p > 1) params.set("page", String(p));
    const str = params.toString();
    return `/admin/audit${str ? `?${str}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">บันทึกการแก้ไข</h1>
        <p className="text-sm text-muted">ใครเพิ่ม แก้ ลบ หรือเข้าสู่ระบบเมื่อไร ทั้งหมด {total.toLocaleString("th-TH")} รายการ</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">ประเภท:</span>
        {ENTITY_FILTERS.map((ent) => (
          <Link
            key={ent.value}
            href={buildUrl(1, ent.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              entity === ent.value ? "bg-brand text-white shadow-sm" : "border border-line bg-white text-ink hover:border-brand"
            }`}
          >
            {ent.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {logRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">ไม่พบบันทึกในหมวดนี้</p>
        ) : (
          <ul className="divide-y divide-line">
            {logRows.map((log) => {
              const meta = actionMeta(log.action);
              const detail = describeDetail(log);
              return (
                <li key={String(log.id)} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[9.5rem_7.5rem_1fr_auto] sm:items-center sm:gap-4">
                  <span className="text-xs text-muted">
                    {new Date(log.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}
                  </span>
                  <span>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink">{describeTarget(log, names)}</span>
                    {detail && <span className="block truncate text-xs text-muted" title={detail}>{detail}</span>}
                  </span>
                  <span className="text-xs text-muted sm:text-right">
                    โดย {log.adminDisplayName ?? "ระบบ"}
                    {log.ip && log.ip !== "direct" && <span className="ml-1 font-mono">· {log.ip}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-paper px-4 py-3 text-xs text-muted">
            <div>
              รายการที่ {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} จาก {total}
            </div>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link href={buildUrl(currentPage - 1)} className="rounded-full border border-line bg-white px-3 py-1.5 font-medium text-ink hover:border-brand">← ก่อนหน้า</Link>
              ) : (
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-gray-300">← ก่อนหน้า</span>
              )}
              <span className="px-2 font-medium text-ink">หน้า {currentPage} / {totalPages}</span>
              {currentPage < totalPages ? (
                <Link href={buildUrl(currentPage + 1)} className="rounded-full border border-line bg-white px-3 py-1.5 font-medium text-ink hover:border-brand">ถัดไป →</Link>
              ) : (
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-gray-300">ถัดไป →</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดบันทึก…</div>}>
      <AuditContent searchParams={searchParams} />
    </Suspense>
  );
}
