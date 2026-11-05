import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import PageSkeleton from "@/components/PageSkeleton";
import ModelViewer from "@/components/ModelViewer";
import { communities, getCommunity } from "@/data/communities";

export function generateStaticParams() {
  return communities.flatMap((c) => c.items.map((item) => ({ slug: c.slug, itemId: item.id })));
}

export default function ItemPage({ params }: PageProps<"/c/[slug]/[itemId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ItemPageContent params={params} />
    </Suspense>
  );
}

async function ItemPageContent({ params }: { params: PageProps<"/c/[slug]/[itemId]">["params"] }) {
  const { slug, itemId } = await params;
  const community = getCommunity(slug);
  const item = community?.items.find((i) => i.id === itemId);
  if (!community || !item) notFound();

  const collection = community.collections.find((c) => c.id === item.collectionId);
  const related = community.items.filter((i) => i.collectionId === item.collectionId && i.id !== item.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-brand-dark">หน้าแรก</Link>
        {" / "}
        <Link href={`/c/${community.slug}`} className="hover:text-brand-dark">{community.shortName}</Link>
        {collection && (
          <>
            {" / "}
            <Link href={`/c/${community.slug}#${collection.id}`} className="hover:text-brand-dark">{collection.name}</Link>
          </>
        )}
      </p>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {item.model ? (
          <ModelViewer src={item.model} poster={item.thumbnail} alt={item.name} />
        ) : (
          <div className="grid aspect-square place-items-center rounded-3xl bg-brand-soft text-muted">ยังไม่มีโมเดล 3D</div>
        )}

        <div>
          <p className="text-sm font-medium text-brand-dark">{collection?.name}</p>
          <h1 className="mt-1 text-3xl font-bold">{item.name}</h1>

          {item.audio ? (
            <div className="mt-5 rounded-2xl border border-line bg-white p-4">
              <p className="mb-2 text-sm font-medium">🔊 ฟังเสียงบรรยาย</p>
              <audio controls preload="none" src={item.audio} className="w-full" />
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">ยังไม่มีเสียงบรรยาย</p>
          )}

          <p className="mt-5 whitespace-pre-line leading-relaxed text-ink/90">{item.description}</p>

          <div className="mt-6 rounded-2xl bg-brand-soft p-4 text-sm">
            <p className="font-medium">วิธีดูใน AR</p>
            <p className="mt-1 text-muted">
              เปิดหน้านี้บนมือถือ กดปุ่ม “ดูใน AR” แล้วส่องกล้องไปที่พื้น โมเดลจะวางลงในพื้นที่จริง
              (Android ใช้ Google Scene Viewer, iPhone ใช้ AR Quick Look)
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">ชิ้นงานอื่นใน{collection?.name}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((r) => (
              <ItemCard key={r.id} href={`/c/${community.slug}/${r.id}`} name={r.name} thumbnail={r.thumbnail} hasAudio={!!r.audio} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
