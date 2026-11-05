import Link from "next/link";
import CommunityMap from "@/components/CommunityMap";
import ItemCard from "@/components/ItemCard";
import { Suspense } from "react";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import { getCommunities, getFeaturedItems } from "@/lib/queries";

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connection();
  const [communities, featured] = await Promise.all([getCommunities(), getFeaturedItems(8)]);
  const pins = communities.map((c, i) => ({
    slug: c.slug,
    number: i + 1,
    name: c.shortName,
    location: c.location,
    position: c.position,
    color: c.color,
    itemCount: c.items.length,
    placeholder: c.placeholder,
  }));

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-10">
          <p className="text-sm font-medium text-brand-dark">นิทรรศการดิจิทัล 3D / AR</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">คลังภูมิปัญญาและผลิตภัณฑ์ 5 ชุมชน จังหวัดสกลนคร</h1>
          <p className="mt-3 max-w-2xl text-muted">
            เลือกชุมชนจากแผนที่ ชมโมเดล 3 มิติ ฟังเสียงบรรยาย และวางโมเดลในพื้นที่จริงผ่านโทรศัพท์มือถือ
          </p>
          <form action="/search" className="mt-5 flex max-w-xl gap-2">
            <input
              name="q"
              placeholder="ค้นหาผลิตภัณฑ์ วัตถุ หรือภูมิปัญญา…"
              className="flex-1 rounded-full border border-line bg-paper px-5 py-3 outline-none focus:border-brand"
            />
            <button className="rounded-full bg-brand px-6 font-medium text-white hover:bg-brand-dark">ค้นหา</button>
          </form>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <div className="h-[420px] overflow-hidden rounded-3xl border border-line shadow-sm sm:h-[480px]">
            <CommunityMap pins={pins} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-10">
        <h2 className="text-xl font-semibold">5 ชุมชน</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {communities.map((c, i) => {
            const body = (
              <>
                <div className="relative aspect-[4/3] bg-brand-soft">
                  {c.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover} alt={c.shortName} className="size-full object-cover" />
                  )}
                  <span
                    className="absolute left-3 top-3 grid size-8 place-items-center rounded-full font-bold text-white"
                    style={{ background: c.placeholder ? "#bdbdbd" : c.color }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-semibold leading-snug">{c.shortName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {c.placeholder ? "รอข้อมูล" : `${c.collections.length} แหล่งเรียนรู้ · ${c.items.length} ชิ้นงาน`}
                  </p>
                </div>
              </>
            );
            return c.placeholder ? (
              <div key={c.slug} className="overflow-hidden rounded-2xl border border-dashed border-line bg-white/60 opacity-70">
                {body}
              </div>
            ) : (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg"
              >
                {body}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">โมเดลแนะนำ</h2>
          <Link href="/search" className="text-sm text-brand-dark hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {featured.map((item) => (
            <ItemCard
              key={item.id}
              href={`/c/${item.communitySlug}/${item.id}`}
              name={item.name}
              thumbnail={item.thumbnail}
              caption={item.communityName}
              hasAudio={!!item.audio}
            />
          ))}
        </div>
      </section>
    </>
  );
}
