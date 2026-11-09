import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCommunities } from "@/lib/queries";
import MapWorkstation from "@/components/map3d/MapWorkstation";
import { toMapLandmarks } from "@/components/map3d/data/landmarksData";
import PageSkeleton from "@/components/PageSkeleton";

export const metadata: Metadata = {
  title: "แผนที่ 3 มิติ 5 แหล่งเรียนรู้สำคัญ จ.สกลนคร | แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง",
  description:
    "แผนที่สามมิติ Interactive 5 แหล่งเรียนรู้สำคัญ จ.สกลนคร 18 อำเภอ หนองหาร และเทือกเขาภูพาน",
};

export default function MapPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MapPageContent />
    </Suspense>
  );
}

async function MapPageContent() {
  await connection();
  const communities = await getCommunities();

  const landmarks = toMapLandmarks(
    communities.map((c) => ({
      slug: c.slug,
      name: c.name,
      shortName: c.shortName,
      englishName: c.englishName,
      tagline: c.tagline,
      location: c.location,
      position: c.position,
      itemCount: c.items.length,
      placeholder: !!c.placeholder,
      // Slideshow on the site's map card: items with a picture, featured first, at most 12.
      slides: [...c.items]
        .filter((item) => item.thumbnail)
        .sort((a, b) => Number(c.recommended.includes(b.id)) - Number(c.recommended.includes(a.id)))
        .slice(0, 12)
        .map((item) => ({ id: item.id, name: item.name, image: item.thumbnail!, href: `/c/${c.slug}/${item.id}` })),
    })),
  );

  return <MapWorkstation landmarks={landmarks} />;
}
