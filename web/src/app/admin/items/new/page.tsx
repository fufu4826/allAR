import { Suspense } from "react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities } from "@/db/schema";
import ItemForm from "../ItemForm";

async function NewItemContent() {
  await requireAdmin();

  const [commList, colList] = await Promise.all([
    db.select().from(communities).orderBy(asc(communities.sortOrder), asc(communities.name)),
    db.select().from(collections).orderBy(asc(collections.sortOrder), asc(collections.name)),
  ]);

  const collectionGroups = commList.map((comm) => ({
    communityName: comm.name,
    collections: colList
      .filter((c) => c.communityId === comm.id)
      .map((c) => ({ id: c.id, name: c.name })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/items" className="text-xs text-muted hover:text-ink">
          ← กลับไปหน้ารายการชิ้นงาน
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">เพิ่มชิ้นงาน 3D ใหม่</h1>
        <p className="text-sm text-muted">
          อัปโหลดโมเดล 3D (.glb), ไฟล์ AR (.usdz), รูปภาพตัวอย่าง และไฟล์เสียงบรรยาย
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <ItemForm collectionGroups={collectionGroups} />
      </div>
    </div>
  );
}

export default function NewItemPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดแบบฟอร์ม…</div>}>
      <NewItemContent />
    </Suspense>
  );
}
