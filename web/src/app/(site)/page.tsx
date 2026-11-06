import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import FeaturedViewer from "@/components/FeaturedViewer";
import GallerySection from "@/components/GallerySection";
import { getCommunities, getFeaturedItems, getPublishedNews, getPublishedGallery } from "@/lib/queries";
import { supportingOrganizations } from "@/content/site";

const communityIcons: Record<string, string> = {
  tharae: "fa-solid fa-church",
  watklang: "fa-solid fa-place-of-worship",
  watnuea: "fa-solid fa-monument",
  nonhom: "fa-solid fa-shirt",
  phuphan: "fa-solid fa-seedling",
};

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connection();
  const [communities, featured, latestNews, galleryImages] = await Promise.all([
    getCommunities(),
    getFeaturedItems(12),
    getPublishedNews(),
    getPublishedGallery(),
  ]);


  const topNews = latestNews.slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-tech-bg"></div>
        <div className="container hero-container">
          <div className="hero-content">
            <div className="tech-pill">
              <span className="pulse-dot"></span>
              <i className="fa-solid fa-vr-cardboard"></i> Augmented Reality &amp; 3D Interactive
            </div>

            <h1 className="hero-title">
              เปิดประตูสู่เรื่องราว
              <br />
              <span className="gradient-text">5 แหล่งเรียนรู้สำคัญ</span>
              <br />
              ด้วยเทคโนโลยีความเป็นจริงเสริม (AR)
            </h1>

            <p className="hero-desc">
              การประยุกต์ใช้นวัตกรรม 3D Photogrammetry และเทคโนโลยี WebAR เชื่อมโยงมรดกทางวัฒนธรรม ประวัติศาสตร์
              สถาปัตยกรรม และภูมิปัญญาท้องถิ่น ให้ทุกคนสามารถสัมผัสและเรียนรู้ได้เสมือนจริงผ่านสมาร์ตโฟน
            </p>

            <div className="hero-buttons">
              <a href="#ar-showcase" className="btn btn-primary">
                <i className="fa-solid fa-shapes"></i> สำรวจโมเดล 3D AR
              </a>
            </div>

            {/* 5 Identity Quick Badges */}
            <div className="identity-strip">
              <span className="strip-label">ครอบคลุม 5 แหล่งสำคัญ:</span>
              <div className="strip-tags">
                {communities.map((c) => (
                  <Link key={c.slug} href={`/c/${c.slug}`} className="strip-tag">
                    <i className={communityIcons[c.slug] || "fa-solid fa-location-dot"}></i> {c.shortName}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Latest news aside */}
          <aside className="hero-visual hero-news" aria-labelledby="hero-news-title">
            <div className="visual-card">
              <div className="hero-news-header">
                <div>
                  <span className="hero-news-label">
                    <i className="fa-regular fa-newspaper"></i> NEWS &amp; ARTICLES
                  </span>
                  <h2 id="hero-news-title">ข่าวสารและความเคลื่อนไหว</h2>
                  <p>เรื่องราวจาก 5 แหล่งเรียนรู้สำคัญ</p>
                </div>
                <span className="hero-news-header-icon" aria-hidden="true">
                  <i className="fa-solid fa-newspaper"></i>
                </span>
              </div>

              {topNews.length > 0 ? (
                <div className="hero-news-list">
                  {topNews.map((item, idx) => (
                    <Link key={item.id} className="hero-news-item" href={`/news/${item.id}`}>
                      <span className="hero-news-number" aria-hidden="true">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="hero-news-body">
                        <span className="hero-news-meta">
                          {item.category}{" "}
                          {item.publishedAt && (
                            <>
                              <span aria-hidden="true">•</span>{" "}
                              {new Date(item.publishedAt).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </>
                          )}
                        </span>
                        <span className="hero-news-title">{item.title}</span>
                      </span>
                      <i className="fa-solid fa-arrow-right hero-news-arrow" aria-hidden="true"></i>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="hero-news-list" style={{ padding: "24px 16px", textAlign: "center", color: "var(--slate-500)" }}>
                  <p>ยังไม่มีข่าวสารที่เผยแพร่</p>
                </div>
              )}

              <div className="hero-news-footer">
                <span>ติดตามเรื่องราวและองค์ความรู้จากชุมชน</span>
                <Link href="/news">
                  ดูข่าวทั้งหมด <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Section: 5 Cultural Identities & 3D AR Showcase */}
      <section id="ar-showcase" className="section ar-showcase">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">
              <i className="fa-solid fa-layer-group"></i> 5 Cultural Identities
            </span>
            <h2 className="section-title">5 แหล่งเรียนรู้สำคัญ &amp; การแสดงผล 3D AR</h2>
            <p className="section-subtitle">
              เลือกสัมผัสเรื่องราว องค์ความรู้ และโมเดลสามมิติที่ผ่านการสแกนและขึ้นรูปด้วยเทคโนโลยีความเป็นจริงเสริม
            </p>
          </div>

          <div className="community-choices">
            {communities.map((c, idx) => (
              <Link key={c.slug} className={`community-choice choice-${c.slug}`} href={`/c/${c.slug}`}>
                <span className="choice-number">{String(idx + 1).padStart(2, "0")} / SAKON NAKHON</span>
                <span className="choice-icon">
                  <i className={communityIcons[c.slug] || "fa-solid fa-location-dot"}></i>
                </span>
                <span className="choice-info">
                  <strong>{c.name}</strong>
                  <small>{c.tags || c.tagline || c.location}</small>
                </span>
                <span className="choice-action">
                  สำรวจชุมชน <i className="fa-solid fa-arrow-right"></i>
                </span>
              </Link>
            ))}
          </div>

          {/* Featured 3D Viewer */}
          <FeaturedViewer items={featured} />
        </div>
      </section>

      {/* Section: News & Community Updates */}
      <section id="news" className="section news">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">
              <i className="fa-solid fa-newspaper"></i> News &amp; Articles
            </span>
            <h2 className="section-title">ข่าวสารและองค์ความรู้ 5 แหล่งเรียนรู้</h2>
            <p className="section-subtitle">ติดตามความเคลื่อนไหว กิจกรรมการลงพื้นที่ และการถ่ายทอดเทคโนโลยีสู่ชุมชน</p>
          </div>

          {topNews.length > 0 ? (
            <div className="news-grid">
              {topNews.map((item, idx) => (
                <article key={item.id} className="news-card">
                  <div className={`news-image news-bg-${(idx % 3) + 1}`}>
                    <span className="news-cat">{item.category}</span>
                  </div>
                  <div className="news-content">
                    <div className="news-meta">
                      {item.publishedAt && (
                        <span>
                          <i className="fa-regular fa-calendar"></i>{" "}
                          {new Date(item.publishedAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="news-title">{item.title}</h3>
                    <p className="news-excerpt">{item.summary}</p>
                    <Link href={`/news/${item.id}`} className="read-more">
                      อ่านบทความฉบับเต็ม <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                background: "var(--white)",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--slate-300)",
                color: "var(--slate-500)",
              }}
            >
              <i className="fa-regular fa-newspaper" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }}></i>
              <p>ยังไม่มีข่าวสารที่เผยแพร่</p>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/news" className="btn btn-outline">
              ดูข่าวสารทั้งหมด <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Section: Photo Gallery */}
      <GallerySection images={galleryImages} />

      {/* Section: Supporting Organizations */}
      <section id="organization" className="section organization">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">
              <i className="fa-solid fa-building-columns"></i> Supporting Organizations
            </span>
            <h2 className="section-title">หน่วยงานร่วมขับเคลื่อนโครงการ</h2>
            <p className="section-subtitle">
              ความร่วมมือทางวิชาการ การพัฒนาเทคโนโลยี และการสนับสนุนจากภาคีเครือข่ายภาครัฐ สถาบันการศึกษา และชุมชนท้องถิ่น
            </p>
          </div>

          <div className="org-grid">
            {(supportingOrganizations || []).map((org, i) => (
              <div key={i} className="org-card">
                <div className="org-icon">
                  <i className={org.icon}></i>
                </div>
                <span className="org-type-badge">{org.typeBadge}</span>
                <h3>{org.name}</h3>
                <p className="org-role">{org.role}</p>
                <p className="org-summary">{org.summary}</p>
                <div className="org-details">
                  <p>
                    <i className="fa-solid fa-location-dot"></i> {org.location}
                  </p>
                  <p>
                    <i className="fa-solid fa-bullseye"></i> พันธกิจ: {org.mission}
                  </p>
                </div>
                <div className="tech-stack-strip">
                  {org.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="t-badge">
                      <i className={tag.icon}></i> {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
