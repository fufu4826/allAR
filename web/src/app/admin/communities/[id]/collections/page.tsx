import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities, items } from "@/db/schema";
import CollectionManager from "./CollectionManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function CollectionsContent({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, id))
    .limit(1);

  if (!community) {
    notFound();
  }

  const [colRows, itemRows] = await Promise.all([
    db
      .select()
      .from(collections)
      .where(eq(collections.communityId, id))
      .orderBy(asc(collections.sortOrder), asc(collections.name)),
    db
      .select({ id: items.id, collectionId: items.collectionId })
      .from(items),
  ]);

  const collectionsWithCounts = colRows.map((col) => ({
    id: col.id,
    name: col.name,
    description: col.description,
    imagePath: col.imagePath,
    sortOrder: col.sortOrder,
    itemCount: itemRows.filter((it) => it.collectionId === col.id).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/admin/communities" className="hover:text-ink">
            จัดการชุมชน
          </Link>
          <span>/</span>
          <Link href={`/admin/communities/${community.id}`} className="hover:text-ink">
            {community.name}
          </Link>
          <span>/</span>
          <span className="text-ink">แหล่งเรียนรู้</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          จัดการแหล่งเรียนรู้ ({community.name})
        </h1>
        <p className="text-sm text-muted">
          จัดการกลุ่มเนื้อหาและแหล่งเรียนรู้ประจำชุมชน
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <CollectionManager
          communityId={community.id}
          communityName={community.name}
          collections={collectionsWithCounts}
        />
      </div>
    </div>
  );
}

export default function CollectionsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={<div className="py-12 text-center text-muted">กำลังโหลดรายการแหล่งเรียนรู้…</div>}
    >
      <CollectionsContent params={params} />
    </Suspense>
  );
}
