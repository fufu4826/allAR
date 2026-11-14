import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import ModelViewer from "@/components/ModelViewer";
import ShareButtons from "@/components/ShareButtons";
import TrackVisit from "@/components/TrackVisit";
import ViewCount from "@/components/ViewCount";
import { getViewCounts, getCommunityWithContent, getItem } from "@/lib/queries";
import { pageMetadata } from "@/content/seo";

export function generateStaticParams() {
  return [{ slug: "__placeholder__", itemId: "__placeholder__" }];
}

// Tab title and share preview (LINE, Facebook) carry the item's own name and picture.
export async function generateMetadata({ params }: PageProps<"/c/[slug]/[itemId]">): Promise<Metadata> {
  const { slug, itemId } = await params;
  // Request time only: the image is built without a database.
  await connection();
  const [community, item] = await Promise.all([getCommunityWithContent(slug), getItem(slug, itemId)]);
  if (!community || !item) return {};
  return pageMetadata(`${item.name} · ${community.shortName}`, item.description, item.thumbnail || community.cover);
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
  await connection();
  const [community, item, counts] = await Promise.all([getCommunityWithContent(slug), getItem(slug, itemId), getViewCounts(slug)]);
  if (!community || !item) notFound();

  const collection = community.collections.find((c) => c.id === item.collectionId);
  const related = community.items
    .filter((i) => i.collectionId === item.collectionId && i.id !== item.id)
    .slice(0, 4);
  // Previous / next item within the same category, in the order the category lists them.
  const siblings = community.items.filter((i) => i.collectionId === item.collectionId);
  const position = siblings.findIndex((i) => i.id === item.id);
  const prev = position > 0 ? siblings[position - 1] : null;
  const next = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null;

  const theme = community.theme || community.slug || "default";

  return (
    <div className={`theme-${theme}`} data-community={theme} data-theme={theme}>
      <div className="community-container item-page" style={{ padding: "40px 0 80px" }}>
        <TrackVisit slug={community.slug} itemId={item.id} />
        {/* Breadcrumb: the full trail on wide screens, one back link on phones (see community.css) */}
        <p className="item-crumb" style={{ fontSize: "0.85rem", color: "var(--slate-500)", marginBottom: "24px" }}>
          <Link href="/" style={{ color: "var(--accent)", fontWeight: 500 }}>
            หน้าแรก
          </Link>
          {" / "}
          <Link href={`/c/${community.slug}`} style={{ color: "var(--accent)", fontWeight: 500 }}>
            {community.shortName}
          </Link>
          {collection && (
            <>
              {" / "}
              <Link href={`/c/${community.slug}#models`} style={{ color: "var(--accent)", fontWeight: 500 }}>
                {collection.name}
              </Link>
            </>
          )}
          {" / "}
          <span>{item.name}</span>
        </p>

        <Link href={`/c/${community.slug}#models`} className="item-back">
          <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> {community.shortName}
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "40px",
            alignItems: "start",
          }}
        >
          <div className="item-media">
            {/* Model / 3D Viewer */}
            <div
              className="item-viewer-card"
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "20px",
                border: "1px solid #e7ded5",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              {item.model ? (
                <div style={{ width: "100%" }}>
                  <ModelViewer
                    src={item.model}
                    iosSrc={item.usdz}
                    poster={item.thumbnail}
                    alt={item.name}
                    stat={{ slug: community.slug, itemId: item.id }}
                  />
                </div>
              ) : item.thumbnail ? (
                <figure style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- served from /uploads, sizes already optimized */}
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    style={{ width: "100%", maxHeight: "450px", objectFit: "contain", borderRadius: "14px", background: "var(--paper)" }}
                  />
                  <figcaption style={{ marginTop: "10px", fontSize: "0.85rem", color: "var(--slate-500)", textAlign: "center" }}>
                    ภาพถ่ายวัตถุจริง · โมเดล 3D อยู่ระหว่างจัดทำ
                  </figcaption>
                </figure>
              ) : (
                <div
                  style={{
                    height: "350px",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--paper)",
                    borderRadius: "14px",
                    color: "var(--slate-500)",
                  }}
                >
                  โมเดล 3D อยู่ระหว่างจัดทำ
                </div>
              )}
            </div>

            {siblings.length > 1 && (
              <nav className="item-stepper" aria-label="ชิ้นงานในหมวดเดียวกัน">
                {prev ? (
                  <Link href={`/c/${community.slug}/${prev.id}`} className="item-step" rel="prev">
                    <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
                    <span>ชิ้นก่อนหน้า</span>
                  </Link>
                ) : (
                  <span className="item-step item-step--off" aria-hidden="true"></span>
                )}
                <span className="item-step-count">
                  ชิ้นที่ {position + 1} จาก {siblings.length}
                </span>
                {next ? (
                  <Link href={`/c/${community.slug}/${next.id}`} className="item-step item-step--next" rel="next">
                    <span>ชิ้นถัดไป</span>
                    <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                  </Link>
                ) : (
                  <span className="item-step item-step--off" aria-hidden="true"></span>
                )}
              </nav>
            )}
          </div>

          {/* Details */}
          <div className="item-details">
            {collection && (
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  borderRadius: "9999px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {collection.name}
              </span>
            )}
            <h1 className="item-title" style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 16px", color: "var(--ink)" }}>
              {item.name}
            </h1>
            <ViewCount count={counts.items[item.id]} />

            {/* Audio guide: shown only when the item has a recording */}
            {item.audio && (
              <div
                style={{
                  margin: "20px 0",
                  padding: "16px 20px",
                  background: "white",
                  border: "1px solid var(--slate-200)",
                  borderRadius: "14px",
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                  🔊 ฟังเสียงบรรยาย
                </p>
                <audio controls preload="none" src={item.audio} style={{ width: "100%" }} />
              </div>
            )}

            {/* Share sits under the audio so the title and the audio player fit on a phone's first screen. */}
            <ShareButtons title={`${item.name} · ${community.shortName}`} />

            {/* Description */}
            <p style={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "var(--slate-700)", fontSize: "1rem" }}>
              {item.description}
            </p>

            {/* AR Instructions (only when a 3D model exists) */}
            {item.model && (
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                background: "var(--accent-light)",
                borderRadius: "16px",
                border: "1px solid var(--slate-200)",
              }}
            >
              <h4 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 600, color: "var(--ink)" }}>
                วิธีดูใน AR (Augmented Reality)
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--slate-600)", lineHeight: 1.6 }}>
                เปิดหน้านี้บนสมาร์ตโฟน แล้วกดปุ่ม “ดูใน AR” จากนั้นส่องกล้องไปยังพื้นผิวระนาบ โมเดล 3
                มิติจะปรากฏขึ้นในพื้นที่จริงของคุณ
                (รองรับทั้ง Android ผ่าน Google Scene Viewer และ iPhone ผ่าน AR Quick Look)
              </p>
            </div>
            )}
          </div>
        </div>

        {/* Related Items */}
        {related.length > 0 && (
          <section style={{ marginTop: "60px" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "20px" }}>
              ชิ้นงานอื่นใน {collection?.name}
            </h2>
            <div className="community-model-grid">
              {related.map((r) => (
                <Link key={r.id} href={`/c/${community.slug}/${r.id}`} className="model-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.thumbnail || "/brand/snru-logo.png"} alt={r.name} loading="lazy" />
                  <span>
                    <strong>{r.name}</strong>
                    <small>{r.model ? "ดูโมเดล 3D / AR ↗" : "ดูรายละเอียด ↗"}</small>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
