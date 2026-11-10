import { Suspense } from "react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { collections, communities, items } from "@/db/schema";

async function CommunitiesList() {
  await requireAdmin();

  const [commList, colList, itemList] = await Promise.all([
    db.select().from(communities).orderBy(asc(communities.sortOrder), asc(communities.name)),
    db.select({ id: collections.id, communityId: collections.communityId }).from(collections),
    db.select({ id: items.id, collectionId: items.collectionId }).from(items),
  ]);

  const communitiesWithCounts = commList.map((comm) => {
    const myColIds = new Set(colList.filter((c) => c.communityId === comm.id).map((c) => c.id));
    const itemCount = itemList.filter((i) => myColIds.has(i.collectionId)).length;
    return {
      ...comm,
      collectionCount: myColIds.size,
      itemCount,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">จัดการชุมชน</h1>
          <p className="text-sm text-muted">
            ชุมชนทั้งหมด {communitiesWithCounts.length} แห่งในระบบ (จำนวนแหล่งเรียนรู้คงที่ตามโครงการ เพิ่มหรือลบไม่ได้)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">ชุมชน</th>
              <th className="px-4 py-3">สลัก (URL)</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">ชิ้นงาน</th>
              <th className="px-4 py-3 text-center">ลำดับ</th>
              <th className="px-4 py-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {communitiesWithCounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  ยังไม่มีข้อมูลชุมชน
                </td>
              </tr>
            ) : (
              communitiesWithCounts.map((comm) => (
                <tr key={comm.id} className="hover:bg-brand-soft/20">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {comm.coverPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comm.coverPath}
                          alt=""
                          className="size-12 rounded-xl border border-line object-cover"
                        />
                      ) : (
                        <div
                          className="grid size-12 place-items-center rounded-xl text-white text-xs font-bold"
                          style={{ backgroundColor: comm.color || "#e9773e" }}
                        >
                          {comm.shortName.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-ink">{comm.name}</div>
                        <div className="text-xs text-muted">
                          {comm.shortName} · {comm.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    <Link
                      href={`/c/${comm.slug}`}
                      target="_blank"
                      className="text-brand hover:underline"
                    >
                      /c/{comm.slug} ↗
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    {comm.isPublished ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        ● เผยแพร่แล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        ○ ฉบับร่าง
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted">
                    <div className="font-medium text-ink">{comm.itemCount} ชิ้นงาน</div>
                    <div>{comm.collectionCount} แหล่งเรียนรู้</div>
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-xs text-muted">
                    {comm.sortOrder}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/communities/${comm.id}/collections`}
                        className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
                      >
                        แหล่งเรียนรู้ ({comm.collectionCount})
                      </Link>
                      <Link
                        href={`/admin/communities/${comm.id}`}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-brand"
                      >
                        แก้ไข
                      </Link>
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

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลดรายการชุมชน…</div>}>
      <CommunitiesList />
    </Suspense>
  );
}
