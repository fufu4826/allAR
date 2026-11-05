import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import { getPublishedNewsItem } from "@/lib/queries";

export function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

export default function NewsDetail({ params }: PageProps<"/news/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewsDetailContent params={params} />
    </Suspense>
  );
}

async function NewsDetailContent({ params }: { params: PageProps<"/news/[id]">["params"] }) {
  const { id } = await params;
  await connection();
  const article = await getPublishedNewsItem(id);
  if (!article) notFound();

  return (
    <article className="container" style={{ maxWidth: "780px", padding: "48px 24px 80px" }}>
      <Link href="/news" style={{ color: "var(--orange-600)", fontSize: "0.9rem", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <i className="fa-solid fa-arrow-left"></i> กลับไปยังหน้าข่าวสารทั้งหมด
      </Link>

      <div style={{ marginTop: "32px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "var(--orange-100)",
            color: "var(--orange-700)",
            borderRadius: "9999px",
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          {article.category}
        </span>
        <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, lineHeight: 1.3, color: "var(--slate-900)", margin: "0 0 16px" }}>
          {article.title}
        </h1>

        {article.publishedAt && (
          <p style={{ fontSize: "0.85rem", color: "var(--slate-500)", marginBottom: "24px" }}>
            <i className="fa-regular fa-calendar"></i>{" "}
            {new Date(article.publishedAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--slate-700)", fontWeight: 500, marginBottom: "28px" }}>
          {article.summary}
        </p>

        {article.coverPath && (
          <div style={{ marginBottom: "32px", borderRadius: "16px", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverPath} alt={article.title} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        )}

        <div style={{ fontSize: "1rem", lineHeight: 1.9, color: "var(--slate-800)", whiteSpace: "pre-line" }}>
          {article.body}
        </div>
      </div>
    </article>
  );
}
