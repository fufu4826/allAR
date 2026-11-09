import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import PageSkeleton from "@/components/PageSkeleton";
import { getCommunities } from "@/lib/queries";
import SiteIcon from "@/components/SiteIcon";

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connection();
  const communities = await getCommunities();

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
              <Link href="/map" className="btn btn-primary">
                <i className="fa-solid fa-shapes"></i> สำรวจโมเดล 3D AR
              </Link>
            </div>

            {/* 5 Identity Quick Badges */}
            <div className="identity-strip">
              <span className="strip-label">ครอบคลุม 5 แหล่งสำคัญ:</span>
              <div className="strip-tags">
                {communities.map((c) => (
                  <Link key={c.slug} href={`/c/${c.slug}`} className="strip-tag">
                    <SiteIcon slug={c.slug} /> {c.shortName}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

    </>
  );
}
