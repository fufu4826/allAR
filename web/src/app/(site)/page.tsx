import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import FeaturedViewer from "@/components/FeaturedViewer";
import GallerySection from "@/components/GallerySection";
import { getCommunities, getFeaturedItems, getPublishedGallery } from "@/lib/queries";
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
  const [communities, featured, galleryImages] = await Promise.all([
    getCommunities(),
    getFeaturedItems(12),
    getPublishedGallery(),
  ]);

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
              การประยุกต์ใช้โมเดล 3 มิติและเทคโนโลยี WebAR เชื่อมโยงมรดกทางวัฒนธรรม ประวัติศาสตร์
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
              เลือกสัมผัสเรื่องราว องค์ความรู้ และโมเดล 3 มิติและเทคโนโลยีความเป็นจริงเสริม
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
          </div>

          <div className="org-grid">
            {(supportingOrganizations || []).map((org, i) => (
              <div key={i} className="org-card">
                <div className="org-icon">
                  <i className={org.icon}></i>
                </div>
                {org.typeBadge && <span className="org-type-badge">{org.typeBadge}</span>}
                <h3>{org.name}</h3>
                {org.role && <p className="org-role">{org.role}</p>}
                {org.summary && <p className="org-summary">{org.summary}</p>}
                {(org.location || org.mission) && (
                  <div className="org-details">
                    {org.location && (
                      <p>
                        <i className="fa-solid fa-location-dot"></i> {org.location}
                      </p>
                    )}
                    {org.mission && (
                      <p>
                        <i className="fa-solid fa-bullseye"></i> วัตถุประสงค์: {org.mission}
                      </p>
                    )}
                  </div>
                )}
                {org.tags && org.tags.length > 0 && (
                  <div className="tech-stack-strip">
                    {org.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="t-badge">
                        <i className={tag.icon}></i> {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
