import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import { getPublishedNews } from "@/lib/queries";

export const metadata = {
  title: "ข่าวสารและความเคลื่อนไหว | แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง",
  description: "ติดตามข่าวสาร กิจกรรม และองค์ความรู้จาก 5 แหล่งเรียนรู้สำคัญ จังหวัดสกลนคร",
};

export default function NewsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewsContent />
    </Suspense>
  );
}

async function NewsContent() {
  await connection();
  const articles = await getPublishedNews();

  return (
    <div className="container" style={{ padding: "48px 24px 80px" }}>
      <div className="section-header" style={{ textAlign: "left", marginBottom: "40px" }}>
        <span className="section-badge">
          <i className="fa-solid fa-newspaper"></i> News &amp; Articles
        </span>
        <h1 className="section-title">ข่าวสารและความเคลื่อนไหว</h1>
        <p className="section-subtitle">
          เรื่องราว กิจกรรมการลงพื้นที่ และการถ่ายทอดเทคโนโลยี WebAR สู่ 5 แหล่งเรียนรู้สำคัญ
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="news-grid">
          {articles.map((article, idx) => (
            <article key={article.id} className="news-card">
              <div
                className={`news-image ${article.coverPath ? "" : `news-bg-${(idx % 3) + 1}`}`}
                style={
                  article.coverPath
                    ? { backgroundImage: `url(${article.coverPath})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                <span className="news-cat">{article.category}</span>
              </div>
              <div className="news-content">
                <div className="news-meta">
                  {article.publishedAt && (
                    <span>
                      <i className="fa-regular fa-calendar"></i>{" "}
                      {new Date(article.publishedAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <h2 className="news-title" style={{ fontSize: "1.2rem" }}>
                  <Link href={`/news/${article.id}`}>{article.title}</Link>
                </h2>
                <p className="news-excerpt">{article.summary}</p>
                <Link href={`/news/${article.id}`} className="read-more">
                  อ่านบทความฉบับเต็ม <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            background: "var(--white)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--slate-300)",
            color: "var(--slate-500)",
          }}
        >
          <i className="fa-regular fa-newspaper" style={{ fontSize: "2.5rem", marginBottom: "16px", display: "block" }}></i>
          <p>ยังไม่มีข่าวสารที่เผยแพร่ในขณะนี้</p>
        </div>
      )}
    </div>
  );
}
