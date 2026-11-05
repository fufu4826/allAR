import { Suspense } from "react";
import SearchResults from "./SearchResults";
import { connection } from "next/server";
import { getSearchIndex } from "@/lib/queries";

export const metadata = { title: "ค้นหา | คลังภูมิปัญญาชุมชน 3D/AR" };

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="text-2xl font-bold">ค้นหาชิ้นงาน</h1>
      <Suspense>
        <SearchContent />
      </Suspense>
    </div>
  );
}

async function SearchContent() {
  await connection();
  const items = (await getSearchIndex()).map(({ id, name, description, thumbnail, audio, communitySlug, communityName }) => ({
    id,
    name,
    description,
    thumbnail,
    hasAudio: !!audio,
    communitySlug,
    communityName,
  }));

  return <SearchResults items={items} />;
}
