import { Suspense } from "react";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { admins, auditLogs, collections, communities, items } from "@/db/schema";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "สร้าง", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "แก้ไข", color: "bg-blue-50 text-blue-700 border-blue-200" },
  delete: { label: "ลบ", color: "bg-red-50 text-red-700 border-red-200" },
  login: { label: "เข้าสู่ระบบ", color: "bg-purple-50 text-purple-700 border-purple-200" },
  activate: { label: "เปิดใช้งาน", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  deactivate: { label: "ระงับการใช้งาน", color: "bg-amber-50 text-amber-700 border-amber-200" },
  reset_password: { label: "รีเซ็ตรหัสผ่าน", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

const ENTITY_LABELS: Record<string, string> = {
  community: "ชุมชน",
  collection: "แหล่งเรียนรู้",
  item: "ชิ้นงาน 3D",
  admin: "ผู้ดูแล",
};

async function Dashboard() {
  const admin = await requireAdmin();

  const [
    [commTotal],
    [commPublished],
    [colTotal],
    [itemTotal],
    [itemPublished],
    [itemFeatured],
    [adminTotal],
    [adminActive],
    recentLogs,
  ] = await Promise.all([
    db.select({ value: count() }).from(communities),
    db.select({ value: count() }).from(communities).where(eq(communities.isPublished, true)),
    db.select({ value: count() }).from(collections),
    db.select({ value: count() }).from(items),
    db.select({ value: count() }).from(items).where(eq(items.isPublished, true)),
    db.select({ value: count() }).from(items).where(eq(items.isFeatured, true)),
    db.select({ value: count() }).from(admins),
    db.select({ value: count() }).from(admins).where(eq(admins.isActive, true)),
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
      .orderBy(desc(auditLogs.createdAt))
      .limit(10),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">แดชบอร์ดจัดการระบบ</h1>
          <p className="text-sm text-muted">
            ยินดีต้อนรับคุณ <span className="font-medium text-ink">{admin.displayName}</span> (@{admin.username})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/communities/new"
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark"
          >
            + เพิ่มชุมชน
          </Link>
          <Link
            href="/admin/items/new"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm hover:border-brand hover:text-brand"
          >
            + เพิ่มชิ้นงาน 3D
          </Link>
        </div>
      </div>

      {/* Counts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Communities */}
        <Link
          href="/admin/communities"
          className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex items-center justify-between text-muted">
            <span className="text-sm font-medium">ชุมชน</span>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">
              {commPublished.value} เผยแพร่
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-ink">{commTotal.value}</p>
          <p className="mt-1 text-xs text-muted">ชุมชนทั้งหมดในระบบ →</p>
        </Link>

        {/* Collections */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-sm font-medium">แหล่งเรียนรู้</span>
            <span className="text-xs text-muted">กลุ่มเนื้อหา</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-ink">{colTotal.value}</p>
          <p className="mt-1 text-xs text-muted">กระจายตามแต่ละชุมชน</p>
        </div>

        {/* Items */}
        <Link
          href="/admin/items"
          className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex items-center justify-between text-muted">
            <span className="text-sm font-medium">ชิ้นงาน 3D / AR</span>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-dark">
              {itemPublished.value} เผยแพร่
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-ink">{itemTotal.value}</p>
          <p className="mt-1 text-xs text-muted">
            แนะนำ {itemFeatured.value} ชิ้นงาน · จัดการชิ้นงาน →
          </p>
        </Link>

        {/* Admins */}
        <Link
          href="/admin/admins"
          className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <div className="flex items-center justify-between text-muted">
            <span className="text-sm font-medium">ผู้ดูแลระบบ</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {adminActive.value} ใช้งาน
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-ink">{adminTotal.value}</p>
          <p className="mt-1 text-xs text-muted">จัดการบัญชีผู้ดูแล →</p>
        </Link>
      </div>

      {/* Recent Audit Logs */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">บันทึกการใช้งานล่าสุด (10 รายการ)</h2>
            <p className="text-xs text-muted">ติดตามประวัติการสร้าง แก้ไข ลบ และเข้าสู่ระบบ</p>
          </div>
          <Link
            href="/admin/audit"
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            ดูทั้งหมด ({recentLogs.length > 0 ? "ประวัติทั้งหมด" : "0"}) →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">วันและเวลา</th>
                <th className="px-4 py-3">ผู้ดูแล</th>
                <th className="px-4 py-3">การกระทำ</th>
                <th className="px-4 py-3">ข้อมูลเป้าหมาย</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    ยังไม่มีบันทึกการใช้งาน
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => {
                  const actionMeta = ACTION_LABELS[log.action] ?? {
                    label: log.action,
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                  };
                  const entityLabel = ENTITY_LABELS[log.entity] ?? log.entity;

                  return (
                    <tr key={String(log.id)} className="hover:bg-brand-soft/30">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                        {log.adminDisplayName ? (
                          <span>
                            {log.adminDisplayName}{" "}
                            <span className="text-xs text-muted">(@{log.adminUsername})</span>
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
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="font-medium text-ink">{entityLabel}</span>
                        {log.entityId && (
                          <span className="ml-1 text-xs text-muted">
                            ({log.entityId.slice(0, 10)}…)
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted">
                        {log.ip || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
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
