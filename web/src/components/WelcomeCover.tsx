"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Full-screen welcome cover from the front-end team's prototype; shown on the home page only. */
export default function WelcomeCover() {
  if (usePathname() !== "/") return null;
  return (
    <section className="welcome-cover" id="welcome" aria-labelledby="welcome-title">
      <div className="welcome-overlay"></div>
      <div className="welcome-inner">
        <div className="welcome-brand" aria-label="AR Heritage">
          <div className="welcome-emblems">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static logos */}
            <img src="/brand/snru-logo.png" alt="ตรามหาวิทยาลัยราชภัฏสกลนคร" />
            {/* eslint-disable-next-line @next/next/no-img-element -- small static logos */}
            <img src="/brand/language-institute-logo.jpg" alt="ตราสถาบันภาษา ศิลปะและวัฒนธรรม" />
          </div>
          <div className="welcome-brand-text">
            <strong>AR.HERITAGE</strong>
            <span>5 แหล่งอัตลักษณ์สำคัญ</span>
          </div>
        </div>
        <div className="welcome-content">
          <span className="welcome-eyebrow">
            <span></span> SAKON NAKHON · THAILAND
          </span>
          <h2 id="welcome-title">
            เปิดประตูสู่
            <br />
            <em>5 แหล่งอัตลักษณ์</em>
            <br />
            เมืองสกลนคร
          </h2>
          <p>ร่วมค้นพบเรื่องราว วัฒนธรรม และภูมิปัญญาท้องถิ่น ผ่านโมเดลสามมิติและเทคโนโลยีความเป็นจริงเสริม</p>
          <Link className="welcome-enter" href="/map">
            เข้าสู่เว็บไซต์ <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>
        <div className="welcome-bottom">
          <span>มรดกวัฒนธรรม · เรื่องราวชุมชน · 3D AR</span>
          <a href="#home">
            เลื่อนเพื่อสำรวจ <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </section>
  );
}
