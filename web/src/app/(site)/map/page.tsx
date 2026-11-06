import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCommunities } from "@/lib/queries";
import MapWorkstation from "@/components/map3d/MapWorkstation";
import { toMapLandmarks } from "@/components/map3d/data/landmarksData";
import PageSkeleton from "@/components/PageSkeleton";

export const metadata: Metadata = {
  title: "แผนที่ 3 มิติ 5 แหล่งเรียนรู้สำคัญ จ.สกลนคร | แหล่งเรียนรู้สกลนคร 3D",
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
    })),
  );

  return <MapWorkstation landmarks={landmarks} />;
}
