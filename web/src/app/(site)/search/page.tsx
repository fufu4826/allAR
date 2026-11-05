import { Suspense } from "react";
import { connection } from "next/server";
import SearchResults from "./SearchResults";
import { getSearchIndex } from "@/lib/queries";

export const metadata = {
  title: "ค้นหาชิ้นงาน 3D & AR | AR.HERITAGE 5 แหล่งอัตลักษณ์สำคัญ",
  description: "ค้นหาผลิตภัณฑ์ วัตถุ และมรดกทางวัฒนธรรม 5 แหล่งอัตลักษณ์สำคัญ จังหวัดสกลนคร",
};

export default function SearchPage() {
  return (
    <div className="container" style={{ padding: "48px 24px 80px" }}>
      <div className="section-header" style={{ textAlign: "left", marginBottom: "24px" }}>
        <span className="section-badge">
          <i className="fa-solid fa-magnifying-glass"></i> Search Collection
        </span>
        <h1 className="section-title">ค้นหาชิ้นงานและโมเดล 3D</h1>
        <p className="section-subtitle">
          ค้นหาวัตถุพิพิธภัณฑ์ ผลิตภัณฑ์ หรือองค์ความรู้จาก 5 ชุมชนในจังหวัดสกลนคร
        </p>
      </div>

      <Suspense fallback={<p style={{ color: "var(--slate-500)" }}>กำลังโหลดดัชนีการค้นหา…</p>}>
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
