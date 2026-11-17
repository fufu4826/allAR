import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { PasswordForm, ProfileForm } from "./AccountForms";

export const metadata = { title: "บัญชีของฉัน" };

async function AccountContent() {
  const admin = await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">บัญชีของฉัน</h1>
        <p className="text-sm text-muted">
          ชื่อผู้ใช้ <span className="font-mono">@{admin.username}</span>
          {admin.lastLoginAt && ` · เข้าสู่ระบบล่าสุด ${new Date(admin.lastLoginAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}`}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-ink">ชื่อที่แสดง</h2>
          <ProfileForm displayName={admin.displayName} />
        </section>
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-ink">เปลี่ยนรหัสผ่าน</h2>
          <p className="mb-4 text-xs text-muted">ถ้าได้รหัสผ่านชั่วคราวจากผู้ดูแลคนอื่น ควรเปลี่ยนเป็นรหัสของตัวเองทันที</p>
          <PasswordForm username={admin.username} />
        </section>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลด…</div>}>
      <AccountContent />
    </Suspense>
  );
}
