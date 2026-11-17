import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { communities } from "@/db/schema";
import CommunityForm from "../CommunityForm";

export const metadata = { title: "แก้ข้อมูลแหล่งเรียนรู้" };

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditCommunityContent({ params }: PageProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/communities" className="text-xs text-muted hover:text-ink">
            ← แหล่งเรียนรู้ทั้งหมด
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">แก้ข้อมูลแหล่งเรียนรู้</h1>
          <p className="text-sm text-muted">
            {community.shortName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/communities/${community.id}/collections`}
            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-medium text-ink shadow-sm hover:border-brand hover:text-brand"
          >
            หมวดหมู่ →
          </Link>
          <a
            href={`/c/${community.slug}`}
            target="_blank"
            rel="noopener"
            className="rounded-full border border-line bg-white px-4 py-2 text-xs font-medium text-muted shadow-sm hover:border-brand hover:text-brand"
          >
            ดูหน้าเว็บ ↗
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <CommunityForm initialData={community} />
      </div>
    </div>
  );
}

export default function EditCommunityPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">กำลังโหลด…</div>}>
      <EditCommunityContent params={params} />
    </Suspense>
  );
}
