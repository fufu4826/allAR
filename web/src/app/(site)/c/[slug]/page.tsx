import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import CollectionBrowser from "@/components/CollectionBrowser";
import { PhuphanCentre } from "@/components/phuphan/PhuphanSections";
import { getCommunityWithContent } from "@/lib/queries";
import SiteName from "@/components/SiteName";
import SiteIcon from "@/components/SiteIcon";
import StoryText from "@/components/StoryText";
import TrackVisit from "@/components/TrackVisit";
import { pageMetadata } from "@/content/seo";

export function generateStaticParams() {
  return [{ slug: "__placeholder__" }];
}

// Tab title and share preview (LINE, Facebook) carry the site's own name and cover photo.
export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Request time only: the image is built without a database.
  await connection();
  const community = await getCommunityWithContent(slug);
  if (!community) return {};
  return pageMetadata(community.name, community.tagline || community.description, community.cover);
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

  const theme = community.theme || community.slug || "default";
  // Phu Phan uses the sections and look of the original Phu Phan AR site (phuphan-theme.css).
  const isPhuphan = community.slug === "phuphan";
  // A one-sentence story (Tha Rae) reads as a lead paragraph under the heading rather than a lone line in a second column.
  const isShortStory = (community.description ?? "").length < 140;
  // Items the team ticked as featured in the admin ("ชิ้นเด่น"), in collection order.
  const featured = community.items.filter((i) => community.recommended.includes(i.id));

  return (
    <div className={`theme-${theme}`} data-community={theme} data-theme={theme}>
      <TrackVisit slug={community.slug} />
      {/* Community Hero. A theme can show the site's cover photo through --hero-cover (see community.css). */}
      <section
        className="community-hero"
        data-has-cover={community.cover ? "" : undefined}
        style={community.cover ? ({ "--hero-cover": `url("${community.cover}")` } as React.CSSProperties) : undefined}
      >
        <div className="community-container hero-layout">
          <div className="hero-copy">
            <Link href="/map" className="breadcrumb">
              <i className="fa-solid fa-arrow-left"></i> 5 แหล่งเรียนรู้
            </Link>
            <h1><SiteName name={community.name} /></h1>
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
              <SiteIcon slug={community.slug} />
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
        <div className={`community-container intro-grid${isShortStory ? " intro-grid--short" : ""}`}>
          <div>
            <p className="eyebrow">01 / OUR STORY</p>
            <h2>
              เรื่องราวของ
              <br />
              <span>{community.name}</span>
            </h2>
          </div>
          <div>
            <StoryText text={community.description} />
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

      {/* Section 03: 3D & AR Collection */}
      <section id="models" className="community-section model-section">
        <div className="community-container">
          <div className="section-top">
            <div>
              <p className="eyebrow">03 / 3D &amp; AR COLLECTION</p>
              <h2>หมวดหมู่โมเดล 3D AR</h2>
              <p className="section-desc">เลือกหมวดหมู่เพื่อสำรวจโมเดลจากคลัง {community.shortName}</p>
            </div>
          </div>

          {featured.length > 0 && (
            <div className="featured-row">
              <h3 className="featured-title">
                <i className="fa-solid fa-star" aria-hidden="true"></i> ชิ้นงานแนะนำ
              </h3>
              <div className="featured-scroll">
                {featured.map((f) => (
                  <Link key={f.id} href={`/c/${community.slug}/${f.id}`} className="model-card featured-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.thumbnail || "/brand/snru-logo.png"} alt={f.name} loading="lazy" />
                    <span>
                      <strong>{f.name}</strong>
                      <small>{f.model ? "ดูโมเดล 3D / AR ↗" : "ดูรายละเอียด ↗"}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

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
