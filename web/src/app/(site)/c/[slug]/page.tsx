import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import CollectionBrowser from "@/components/CollectionBrowser";
import { PhuphanCentre } from "@/components/phuphan/PhuphanSections";
import { getCommunityWithContent, getPublishedNews } from "@/lib/queries";

const communityIcons: Record<string, string> = {
  tharae: "fa-solid fa-church",
  watklang: "fa-solid fa-place-of-worship",
  watnuea: "fa-solid fa-monument",
  nonhom: "fa-solid fa-shirt",
  phuphan: "fa-solid fa-seedling",
};

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
  if (!community) notFound();

  const communityNews = community.id ? await getPublishedNews(community.id) : [];
  const theme = community.theme || community.slug || "default";
  const icon = communityIcons[community.slug] || "fa-solid fa-location-dot";
  // Phu Phan uses the sections and look of the original Phu Phan AR site (phuphan-theme.css).
  const isPhuphan = community.slug === "phuphan";

  return (
    <div className={`theme-${theme}`} data-community={theme} data-theme={theme}>
      {/* Community Hero */}
      <section className="community-hero">
        <div className="community-container hero-layout">
          <div className="hero-copy">
            <Link href="/#ar-showcase" className="breadcrumb">
              <i className="fa-solid fa-arrow-left"></i> 5 แหล่งเรียนรู้
            </Link>
            <h1>{community.name}</h1>
            {community.tagline && <p className="hero-lead">{community.tagline}</p>}
            {community.tags && <div className="hero-tags">{community.tags}</div>}
            <div className="hero-actions">
              <a href="#models" className="button button-primary">
                <i className="fa-solid fa-cube"></i> สำรวจโมเดล 3D AR
              </a>
              <a href="#about" className="button button-ghost">
                รู้จักสถานที่ <i className="fa-solid fa-arrow-down"></i>
              </a>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one"></div>
            <div className="art-orbit orbit-two"></div>
            <div className="art-icon">
              <i className={icon}></i>
            </div>
            <span className="art-caption">
              SAKON NAKHON
              <br />
              <b>HERITAGE &amp; IDENTITY</b>
            </span>
          </div>
        </div>
      </section>

      {isPhuphan ? (
        <PhuphanCentre community={community} />
      ) : (
      <>
      {/* Section 01: Our Story */}
      <section id="about" className="community-section">
        <div className="community-container intro-grid">
          <div>
            <p className="eyebrow">01 / OUR STORY</p>
            <h2>
              เรื่องราวของ
              <br />
              <span>{community.name}</span>
            </h2>
          </div>
          <div>
            <p className="intro-text">{community.description}</p>
            {community.slug === "phuphan" && (
              <a
                className="inline-source"
                href="https://www.rdpb.go.th/th/royal-development-study-centre/phu-phan-royal-development-study-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                ข้อมูลเพิ่มเติมจากสำนักงาน กปร. <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Section 02: Location */}
      <section id="location" className="location-section">
        <div className="community-container location-box">
          <div className="location-icon">
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div className="location-body">
            <p className="eyebrow">02 / LOCATION</p>
            <h2>ที่ตั้ง</h2>
            <p>{community.location}</p>
          </div>
          <a
            className="button button-outline"
            href={`https://www.google.com/maps?q=${community.position[0]},${community.position[1]}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            ค้นหาบนแผนที่ <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </section>
      </>
      )}

      {/* Section 03: News (not on Phu Phan) */}
      {!isPhuphan && (
      <section id="news" className="community-section">
        <div className="community-container">
          <div className="section-top">
            <div>
              <p className="eyebrow">03 / NEWS &amp; STORIES</p>
              <h2>ข่าวสารและเรื่องราว</h2>
            </div>
            <Link href="/news" className="text-link">
              ข่าวสารทั้งหมด <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {communityNews.length > 0 ? (
            <div style={{ display: "grid", gap: "16px" }}>
              {communityNews.map((article) => (
                <Link key={article.id} className="story-card" href={`/news/${article.id}`}>
                  <span className="story-icon">
                    <i className="fa-regular fa-newspaper"></i>
                  </span>
                  <span>
                    <small>{article.category}</small>
                    <strong>{article.title}</strong>
                    <span className="text-link">
                      ดูข่าวสาร <i className="fa-solid fa-arrow-right"></i>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fa-regular fa-newspaper"></i>
              <div>
                <strong>ยังไม่มีข่าวสารสำหรับชุมชนนี้</strong>
                <p>ติดตามข่าวสารของโครงการได้จากหน้าข่าวสารหลัก</p>
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Section 04: 3D & AR Collection */}
      <section id="models" className="community-section model-section">
        <div className="community-container">
          <div className="section-top">
            <div>
              <p className="eyebrow">04 / 3D &amp; AR COLLECTION</p>
              <h2>หมวดหมู่โมเดล 3D AR</h2>
              <p className="section-desc">เลือกหมวดหมู่เพื่อสำรวจโมเดลจากคลัง {community.shortName}</p>
            </div>
          </div>

          <CollectionBrowser
            communitySlug={community.slug}
            collections={community.collections}
            items={community.items}
          />
        </div>
      </section>
    </div>
  );
}
