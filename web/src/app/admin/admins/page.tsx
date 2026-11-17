import { Suspense } from "react";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { admins } from "@/db/schema";
import AdminManager from "./AdminManager";

export const metadata = { title: "ผู้ดูแล" };

async function AdminsListContent() {
  const currentAdmin = await requireAdmin();

  const adminRows = await db
    .select({
      id: admins.id,
      username: admins.username,
      displayName: admins.displayName,
      isActive: admins.isActive,
      lastLoginAt: admins.lastLoginAt,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .orderBy(desc(admins.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">ผู้ดูแล</h1>
        <p className="text-sm text-muted">
          เพิ่มบัญชีให้คนในทีม รีเซ็ตรหัสผ่านให้คนที่ลืม และระงับบัญชีที่ไม่ใช้แล้ว
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <AdminManager currentAdminId={currentAdmin.id} admins={adminRows} />
      </div>
    </div>
  );
}

export default function AdminsPage() {
  return (
    <Suspense
      fallback={<div className="py-12 text-center text-muted">กำลังโหลดรายการผู้ดูแล…</div>}
    >
      <AdminsListContent />
    </Suspense>
  );
}
