import { Suspense } from "react";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { admins, auditLogs } from "@/db/schema";

interface PageProps {
  searchParams: Promise<{
    entity?: string;
    page?: string;
  }>;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "สร้าง", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "แก้ไข", color: "bg-blue-50 text-blue-700 border-blue-200" },
  delete: { label: "ลบ", color: "bg-red-50 text-red-700 border-red-200" },
  login: { label: "เข้าสู่ระบบ", color: "bg-purple-50 text-purple-700 border-purple-200" },
  activate: { label: "เปิดใช้งาน", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  deactivate: { label: "ระงับการใช้งาน", color: "bg-amber-50 text-amber-700 border-amber-200" },
  reset_password: { label: "รีเซ็ตรหัสผ่าน", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

const ENTITIES = [
  { value: "", label: "ทั้งหมด" },
  { value: "community", label: "ชุมชน" },
  { value: "collection", label: "แหล่งเรียนรู้" },
  { value: "item", label: "ชิ้นงาน 3D" },
  { value: "admin", label: "ผู้ดูแล" },
];

const ENTITY_LABELS: Record<string, string> = {
  community: "ชุมชน",
  collection: "แหล่งเรียนรู้",
  item: "ชิ้นงาน 3D",
  admin: "ผู้ดูแล",
};

const PAGE_SIZE = 50;

async function AuditContent({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const entity = typeof sp.entity === "string" ? sp.entity.trim() : "";
  const currentPage = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const conditions = [];
  if (entity && ["community", "collection", "item", "admin"].includes(entity)) {
    conditions.push(eq(auditLogs.entity, entity));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[totalCountResult], logRows] = await Promise.all([
    db.select({ total: count() }).from(auditLogs).where(whereClause),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        detail: auditLogs.detail,
        ip: auditLogs.ip,
        createdAt: auditLogs.createdAt,
        adminDisplayName: admins.displayName,
        adminUsername: admins.username,
      })
      .from(auditLogs)
      .leftJoin(admins, eq(auditLogs.adminId, admins.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset((currentPage - 1) * PAGE_SIZE),
  ]);

  const total = totalCountResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildUrl = (p: number, ent?: string) => {
    const params = new URLSearchParams();
    const e = ent !== undefined ? ent : entity;
    if (e) params.set("entity", e);
    if (p > 1) params.set("page", String(p));
    const str = params.toString();
    return `/admin/audit${str ? `?${str}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">บันทึกการใช้งานระบบ (Audit Log)</h1>
          <p className="text-sm text-muted">
            ประวัติการเปลี่ยนแปลงข้อมูลและการเข้าใช้งานของผู้ดูแล ({total} รายการ)
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">กรองตามประเภท:</span>
        {ENTITIES.map((ent) => {
          const isActive = entity === ent.value;
          return (
            <Link
              key={ent.value}
              href={buildUrl(1, ent.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-brand text-white shadow-sm"
                  : "border border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {ent.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">วันและเวลา</th>
              <th className="px-4 py-3">ผู้ดำเนินการ</th>
              <th className="px-4 py-3">การกระทำ</th>
              <th className="px-4 py-3">ข้อมูลเป้าหมาย</th>
              <th className="px-4 py-3">รายละเอียด</th>
              <th className="px-4 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  ไม่พบบันทึกการใช้งานในหมวดนี้
                </td>
              </tr>
            ) : (
              logRows.map((log) => {
                const actionMeta = ACTION_LABELS[log.action] ?? {
                  label: log.action,
                  color: "bg-gray-100 text-gray-700 border-gray-200",
                };
                const entityLabel = ENTITY_LABELS[log.entity] ?? log.entity;

                let detailDisplay = "-";
                if (log.detail && typeof log.detail === "object") {
                  try {
                    const entries = Object.entries(log.detail as Record<string, unknown>);
                    detailDisplay = entries
                      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                      .join(", ");
                  } catch {
                    detailDisplay = JSON.stringify(log.detail);
                  }
                }

                return (
                  <tr key={String(log.id)} className="hover:bg-brand-soft/20">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-ink">
                      {log.adminDisplayName ? (
                        <span>
                          {log.adminDisplayName}{" "}
                          <span className="text-muted">(@{log.adminUsername})</span>
                        </span>
                      ) : (
                        <span className="text-muted">ระบบ</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${actionMeta.color}`}
                      >
                        {actionMeta.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      <span className="font-semibold text-ink">{entityLabel}</span>
                      {log.entityId && (
                        <span className="ml-1 font-mono text-[11px] text-muted">
                          [{log.entityId.slice(0, 10)}]
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-muted" title={detailDisplay}>
                      {detailDisplay}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {log.ip || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-paper px-4 py-3 text-xs text-muted">
            <div>
              แสดงรายการที่ {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(currentPage * PAGE_SIZE, total)} จากทั้งหมด {total} รายการ
            </div>
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildUrl(currentPage - 1)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 font-medium text-ink hover:border-brand"
                >
                  ← หน้าก่อนหน้า
                </Link>
              ) : (
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-gray-300">
                  ← หน้าก่อนหน้า
                </span>
              )}

              <span className="px-2 font-medium text-ink">
                หน้า {currentPage} / {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={buildUrl(currentPage + 1)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 font-medium text-ink hover:border-brand"
                >
                  หน้าถัดไป →
                </Link>
              ) : (
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-gray-300">
                  หน้าถัดไป →
                </span>
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
    <Suspense
      fallback={<div className="py-12 text-center text-muted">กำลังโหลดบันทึกการใช้งาน…</div>}
    >
      <AuditContent searchParams={searchParams} />
    </Suspense>
  );
}
