import Link from "next/link";
import { siteContact as siteContactExport } from "@/content/site";

const defaultContact = {
  organization: "สถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร",
  address: "เลขที่ 680 ถนนนิตโย ตำบลธาตุเชิงชุม อำเภอเมือง จังหวัดสกลนคร 47000",
  phone: "042-970021",
  email: "saraban@snru.ac.th",
};

const siteContact = siteContactExport || defaultContact;

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col brand-col">
          <div className="logo footer-logo">
            <span className="institution-logos">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/snru-logo.png" alt="ตรามหาวิทยาลัยราชภัฏสกลนคร" className="institution-logo university-logo" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/language-institute-logo.jpg" alt="ตราสถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร" className="institution-logo language-logo" />
            </span>
            <div className="logo-text">
              <span className="brand-title">แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง</span>
              <span className="brand-sub">Sakon Nakhon Virtual Learning Sites and Local Museums</span>
            </div>
          </div>
          <p className="footer-desc">
            โครงการเพิ่มศักยภาพแหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง
          </p>
        </div>

        <div className="footer-col">
          <h4>5 แหล่งเรียนรู้</h4>
          <ul>
            <li><Link href="/c/tharae">1. พิพิธภัณฑ์อัครเทวดามีคาแอล</Link></li>
            <li><Link href="/c/watklang">2. พิพิธภัณฑ์วัดกลางศรีเชียงใหม่</Link></li>
            <li><Link href="/c/watnuea">3. พิพิธภัณฑ์วัดมหาพรหมโพธิราช</Link></li>
            <li><Link href="/c/nonhom">4. แหล่งเรียนรู้ชุมชนบ้านโนนหอม</Link></li>
            <li><Link href="/c/phuphan">5. ศูนย์ศึกษาการพัฒนาภูพานฯ</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>เมนูลัด</h4>
          <ul>
            <li><Link href="/#home">หน้าแรก</Link></li>
            <li><Link href="/news">ข่าวสาร & อัปเดต</Link></li>
            <li><Link href="/#gallery">แกลเลอรีภาพ</Link></li>
            <li><Link href="/#organization">หน่วยงาน</Link></li>
            <li><Link href="/search">ค้นหาชิ้นงาน</Link></li>
            <li><Link href="/about">เกี่ยวกับโครงการ</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>ติดต่อผู้พัฒนา / โครงการ</h4>
          <div className="contact-links">
            <p><i className="fa-solid fa-envelope"></i> {siteContact.email}</p>
            <p><i className="fa-solid fa-phone"></i> {siteContact.phone}</p>
            <p><i className="fa-solid fa-building-columns"></i> {siteContact.organization}</p>
            <p className="text-xs text-slate-500 leading-normal"><i className="fa-solid fa-location-dot"></i> {siteContact.address}</p>
          </div>
          <div className="social-strip">
            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="GitHub"><i className="fa-brands fa-github"></i></a>
            <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
            <a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube"></i></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-flex">
          <p>&copy; 2026 สถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร</p>
          <p className="powered-by">Powered by WebXR, Google Model-Viewer & Modern Web Tech</p>
        </div>
      </div>
    </footer>
  );
}
