import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities, items } from "@/db/schema";
import ItemForm from "../ItemForm";
import DeleteItemButton from "../DeleteItemButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditItemContent({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, id))
    .limit(1);

  if (!item) {
    notFound();
  }

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/items" className="text-xs text-muted hover:text-ink">
            ← กลับไปหน้ารายการชิ้นงาน
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">แก้ไขชิ้นงาน 3D</h1>
          <p className="text-sm text-muted">
            แก้ไขรายละเอียด ไฟล์โมเดล หรือไฟล์มีเดียของ &quot;{item.name}&quot;
          </p>
        </div>
        <DeleteItemButton id={item.id} name={item.name} />
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <ItemForm initialData={item} collectionGroups={collectionGroups} />
      </div>
    </div>
  );
}

export default function EditItemPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดข้อมูลชิ้นงาน…</div>}>
      <EditItemContent params={params} />
    </Suspense>
  );
}
