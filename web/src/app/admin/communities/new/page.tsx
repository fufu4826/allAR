import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import CommunityForm from "../CommunityForm";

async function NewCommunityContent() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/communities" className="text-xs text-muted hover:text-ink">
          ← กลับไปหน้ารายการชุมชน
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">เพิ่มชุมชนใหม่</h1>
        <p className="text-sm text-muted">
          สร้างชุมชนเพื่อเป็นพื้นที่รวบรวมแหล่งเรียนรู้และชิ้นงาน 3D / AR
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <CommunityForm />
      </div>
    </div>
  );
}

export default function NewCommunityPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดแบบฟอร์ม…</div>}>
      <NewCommunityContent />
    </Suspense>
  );
}
