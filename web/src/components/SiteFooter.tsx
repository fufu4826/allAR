import Link from "next/link";
import SiteIcon from "@/components/SiteIcon";
import { siteContact as siteContactExport } from "@/content/site";

const defaultContact = {
  organization: "สถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร",
  address: "เลขที่ 680 ถนนนิตโย ตำบลธาตุเชิงชุม อำเภอเมือง จังหวัดสกลนคร 47000",
  phone: "042-970021",
  email: "saraban@snru.ac.th",
};

const siteContact = siteContactExport || defaultContact;

// Same icons as the learning-site pins on the 3D map.
const footerSites = [
  { href: "/c/tharae", slug: "tharae", name: "อาสนวิหารอัครเทวดามีคาแอล" },
  { href: "/c/watklang", slug: "watklang", name: "พิพิธภัณฑ์วัดกลางศรีเชียงใหม่" },
  { href: "/c/watnuea", slug: "watnuea", name: "พิพิธภัณฑ์วัดมหาพรหมโพธิราช" },
  { href: "/c/nonhom", slug: "nonhom", name: "แหล่งเรียนรู้ชุมชนบ้านโนนหอม" },
  { href: "/c/phuphan", slug: "phuphan", name: "ศูนย์ศึกษาการพัฒนาภูพานฯ" },
];

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
              <span className="brand-title"><span className="brand-line">แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่น</span><span className="brand-line">จังหวัดสกลนครเสมือนจริง</span></span>
            </div>
          </div>
          <p className="footer-desc">
            โครงการเพิ่มศักยภาพแหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง
          </p>
        </div>

        <div className="footer-col">
          <h4>5 แหล่งเรียนรู้</h4>
          <ul className="footer-sites">
            {footerSites.map((site) => (
              <li key={site.href}>
                <Link href={site.href}>
                  <SiteIcon slug={site.slug} /> {site.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>เมนูลัด</h4>
          <ul>
            <li><Link href="/#home">หน้าแรก</Link></li>
            <li><Link href="/search">ค้นหาชิ้นงาน</Link></li>
            <li><Link href="/about">เกี่ยวกับโครงการ</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>ติดต่อผู้พัฒนา / โครงการ</h4>
          <div className="contact-links">
            <p>
              <i className="fa-solid fa-globe"></i>{" "}
              <a href="https://ilac.snru.ac.th" target="_blank" rel="noopener noreferrer">
                ilac.snru.ac.th
              </a>
            </p>
            <p><i className="fa-solid fa-envelope"></i> <a href={`mailto:${siteContact.email}`}>{siteContact.email}</a></p>
            <p><i className="fa-solid fa-phone"></i> <a href={`tel:${siteContact.phone.replace(/[^0-9+]/g, "")}`}>{siteContact.phone}</a></p>
            <p>
              <i className="fa-solid fa-building-columns"></i>{" "}
              <span>
                สถาบันภาษา ศิลปะและวัฒนธรรม
                <br />
                มหาวิทยาลัยราชภัฏสกลนคร
              </span>
            </p>
            <p className="text-xs text-slate-500 leading-normal"><i className="fa-solid fa-location-dot"></i> {siteContact.address}</p>
          </div>
          <div className="social-strip">
            <a
              href="https://www.facebook.com/ilac.pr.snru?locale=th_TH"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook สถาบันภาษา ศิลปะและวัฒนธรรม"
            >
              <i className="fa-brands fa-facebook-f"></i>
            </a>
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
