import { Suspense } from "react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities } from "@/db/schema";
import ItemForm from "../ItemForm";

export const metadata = { title: "เพิ่มชิ้นงาน 3D" };

interface PageProps {
  searchParams: Promise<{ collection?: string }>;
}

async function NewItemContent({ searchParams }: PageProps) {
  await requireAdmin();
  const { collection } = await searchParams;

  const [commList, colList] = await Promise.all([
    db.select().from(communities).orderBy(asc(communities.sortOrder), asc(communities.name)),
    db.select().from(collections).orderBy(asc(collections.sortOrder), asc(collections.name)),
  ]);

  const collectionGroups = commList.map((comm) => ({
    communityName: comm.shortName,
    collections: colList
      .filter((c) => c.communityId === comm.id)
      .map((c) => ({ id: c.id, name: c.name })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/items" className="text-xs text-muted hover:text-ink">
          ← ชิ้นงานทั้งหมด
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">เพิ่มชิ้นงาน 3D ใหม่</h1>
        <p className="text-sm text-muted">
          ต้องมีอย่างน้อย: หมวดหมู่ ชื่อ คำอธิบาย และไฟล์โมเดล .glb
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <ItemForm collectionGroups={collectionGroups} defaultCollectionId={typeof collection === "string" ? collection : undefined} />
      </div>
    </div>
  );
}

export default function NewItemPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดแบบฟอร์ม…</div>}>
      <NewItemContent {...props} />
    </Suspense>
  );
}
