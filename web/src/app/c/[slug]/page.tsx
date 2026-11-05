import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import PageSkeleton from "@/components/PageSkeleton";
import { connection } from "next/server";
import { getCommunityWithContent } from "@/lib/queries";

// DB is not reachable during `next build` (Docker image build), so params are resolved at request time.
export function generateStaticParams() {
  return [{ slug: "__placeholder__" }];
}

export default function CommunityPage({ params }: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CommunityPageContent params={params} />
    </Suspense>
  );
}

async function CommunityPageContent({ params }: { params: PageProps<"/c/[slug]">["params"] }) {
  const { slug } = await params;
  await connection();
  const community = await getCommunityWithContent(slug);
  if (!community || community.placeholder) notFound();

  const groups = community.collections
    .map((col) => ({ ...col, items: community.items.filter((item) => item.collectionId === col.id) }))
    .filter((col) => col.items.length > 0);

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        {community.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={community.cover} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-14">
          <Link href="/" className="text-sm text-white/80 hover:text-white">← แผนที่ 5 ชุมชน</Link>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">{community.name}</h1>
          <p className="mt-2 text-white/80">{community.location}</p>
          <p className="mt-4 max-w-3xl text-white/90">{community.description}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1">{groups.length} แหล่งเรียนรู้</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{community.items.length} โมเดล 3D</span>
          </div>
        </div>
      </section>

      <nav className="sticky top-16 z-[900] border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 text-sm">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="shrink-0 rounded-full border border-line px-3 py-1 hover:border-brand hover:text-brand-dark">
              {g.name.replace("แหล่งเรียนรู้", "")} <span className="text-muted">({g.items.length})</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pt-10">
        {groups.map((g) => (
          <section key={g.id} id={g.id} className="scroll-mt-32">
            <h2 className="text-xl font-semibold">{g.name}</h2>
            <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-muted">{g.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {g.items.map((item) => (
                <ItemCard
                  key={item.id}
                  href={`/c/${community.slug}/${item.id}`}
                  name={item.name}
                  thumbnail={item.thumbnail}
                  hasAudio={!!item.audio}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
