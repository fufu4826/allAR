import { Suspense } from "react";
import Link from "next/link";
import { and, asc, eq, like } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities, items } from "@/db/schema";
import ItemFilter from "./ItemFilter";
import DeleteItemButton from "./DeleteItemButton";

interface PageProps {
  searchParams: Promise<{
    community?: string;
    collection?: string;
    q?: string;
  }>;
}

async function ItemsListContent({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const communityFilter = typeof sp.community === "string" ? sp.community : "";
  const collectionFilter = typeof sp.collection === "string" ? sp.collection : "";
  const queryFilter = typeof sp.q === "string" ? sp.q.trim() : "";

  // Fetch filter options
  const [commList, colList] = await Promise.all([
    db
      .select({ id: communities.id, name: communities.name })
      .from(communities)
      .orderBy(asc(communities.sortOrder), asc(communities.name)),
    db
      .select({ id: collections.id, name: collections.name, communityId: collections.communityId })
      .from(collections)
      .orderBy(asc(collections.sortOrder), asc(collections.name)),
  ]);

  // Build filter conditions
  const conditions = [];
  if (communityFilter) {
    conditions.push(eq(collections.communityId, communityFilter));
  }
  if (collectionFilter) {
    conditions.push(eq(items.collectionId, collectionFilter));
  }
  if (queryFilter) {
    conditions.push(like(items.name, `%${queryFilter}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const itemRows = await db
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      modelPath: items.modelPath,
      usdzPath: items.usdzPath,
      thumbnailPath: items.thumbnailPath,
      audioPath: items.audioPath,
      isFeatured: items.isFeatured,
      isPublished: items.isPublished,
      sortOrder: items.sortOrder,
      collectionName: collections.name,
      communityName: communities.name,
      communitySlug: communities.slug,
    })
    .from(items)
    .innerJoin(collections, eq(items.collectionId, collections.id))
    .innerJoin(communities, eq(collections.communityId, communities.id))
    .where(whereClause)
    .orderBy(
      asc(communities.sortOrder),
      asc(collections.sortOrder),
      asc(items.sortOrder),
      asc(items.name)
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">จัดการชิ้นงาน 3D / AR</h1>
          <p className="text-sm text-muted">
            พบทั้งหมด {itemRows.length} ชิ้นงาน{" "}
            {queryFilter || communityFilter || collectionFilter ? "(ตรงตามตัวกรอง)" : "ในระบบ"}
          </p>
        </div>
        <Link
          href="/admin/items/new"
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark"
        >
          + เพิ่มชิ้นงาน 3D ใหม่
        </Link>
      </div>

      <ItemFilter
        communities={commList}
        collections={colList}
        initialCommunity={communityFilter}
        initialCollection={collectionFilter}
        initialQuery={queryFilter}
      />

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">ชิ้นงาน</th>
              <th className="px-4 py-3">ชุมชน / แหล่งเรียนรู้</th>
              <th className="px-4 py-3">ไฟล์มีเดีย</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3 text-center">ลำดับ</th>
              <th className="px-4 py-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {itemRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  ไม่พบชิ้นงานตามเงื่อนไขที่ค้นหา
                </td>
              </tr>
            ) : (
              itemRows.map((item) => (
                <tr key={item.id} className="hover:bg-brand-soft/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.thumbnailPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailPath}
                          alt=""
                          className="size-12 rounded-xl border border-line object-cover"
                        />
                      ) : (
                        <div className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-dark text-xs font-bold">
                          3D
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-ink">{item.name}</div>
                        <div className="line-clamp-1 max-w-xs text-xs text-muted">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium text-ink">{item.communityName}</div>
                    <div className="text-muted">{item.collectionName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.modelPath && (
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          GLB
                        </span>
                      )}
                      {item.usdzPath && (
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                          USDZ
                        </span>
                      )}
                      {item.audioPath && (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          🔊 เสียง
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col gap-1">
                      {item.isPublished ? (
                        <span className="text-emerald-700">● เผยแพร่แล้ว</span>
                      ) : (
                        <span className="text-gray-500">○ ฉบับร่าง</span>
                      )}
                      {item.isFeatured && (
                        <span className="font-medium text-amber-600">⭐ แนะนำ</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted">
                    {item.sortOrder}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/c/${item.communitySlug}/${item.id}`}
                        target="_blank"
                        className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-brand"
                        title="ดูหน้าแสดงผลจริง"
                      >
                        ดูผล ↗
                      </Link>
                      <Link
                        href={`/admin/items/${item.id}`}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-brand"
                      >
                        แก้ไข
                      </Link>
                      <DeleteItemButton id={item.id} name={item.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ItemsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดรายการชิ้นงาน…</div>}>
      <ItemsListContent searchParams={searchParams} />
    </Suspense>
  );
}
