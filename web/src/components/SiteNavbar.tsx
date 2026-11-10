"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteIcon from "@/components/SiteIcon";
import { siteLinks } from "@/content/site";

export default function SiteNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-announcement">
        <div className="container announcement-content">
          <span>
            <i className="fa-solid fa-cube"></i> โครงการเพิ่มศักยภาพแหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง
          </span>
          <Link href="/map" className="announcement-link">
            สำรวจแผนที่ 3 มิติเต็มรูปแบบ <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      {/* Navbar */}
      <header className={`navbar ${scrolled ? "scrolled" : ""}`} id="navbar">
        <div className="container nav-container">
          <Link href="/" className="logo" onClick={closeMenu}>
            <span className="institution-logos">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/snru-logo.png" alt="ตรามหาวิทยาลัยราชภัฏสกลนคร" className="institution-logo university-logo" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/language-institute-logo.jpg" alt="ตราสถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร" className="institution-logo language-logo" />
            </span>
            <div className="logo-text">
              <span className="brand-title"><span className="brand-line">แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่น</span><span className="brand-line">จังหวัดสกลนครเสมือนจริง</span></span>
            </div>
          </Link>

          <button
            className="nav-toggle"
            id="navToggle"
            aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={isOpen}
            aria-controls="navMenu"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <i className={isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
          </button>

          <nav className={`nav-menu ${isOpen ? "active" : ""}`} id="navMenu">
            <ul className="nav-list">
              <li>
                <Link href="/#home" className="nav-link" onClick={closeMenu}>
                  <i className="fa-solid fa-house nav-icon"></i> หน้าแรก
                </Link>
              </li>
              <li>
                <Link href="/map" className="nav-link font-semibold text-brand" onClick={closeMenu}>
                  <i className="fa-solid fa-cubes nav-icon"></i> แผนที่ 3 มิติ 5 แหล่งสำคัญ
                </Link>
              </li>
              {/* The five sites are listed only in the folded menu (phones, tablets); the wide bar has no room. */}
              <li className="nav-sites">
                <span className="nav-group-title">5 แหล่งเรียนรู้</span>
                <ul>
                  {siteLinks.map((site) => (
                    <li key={site.href}>
                      <Link href={site.href} className="nav-link" onClick={closeMenu}>
                        <span className="nav-icon"><SiteIcon slug={site.slug} /></span> {site.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <Link href="/search" className="nav-link" onClick={closeMenu}>
                  <i className="fa-solid fa-magnifying-glass nav-icon"></i> ค้นหาชิ้นงาน
                </Link>
              </li>
              <li>
                <Link href="/about" className="nav-link" onClick={closeMenu}>
                  <i className="fa-solid fa-circle-info nav-icon"></i> เกี่ยวกับโครงการ
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
