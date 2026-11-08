import Link from "next/link";
import { siteContact as siteContactExport } from "@/content/site";

export const metadata = {
  title: "เกี่ยวกับโครงการ | แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง",
  description: "เกี่ยวกับโครงการเพิ่มศักยภาพแหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง มหาวิทยาลัยราชภัฏสกลนคร",
};

const defaultContact = {
  organization: "สถาบันภาษา ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร",
  address: "เลขที่ 680 ถนนนิตโย ตำบลธาตุเชิงชุม อำเภอเมือง จังหวัดสกลนคร 47000",
  phone: "042-970021",
  email: "saraban@snru.ac.th",
};

const siteContact = siteContactExport || defaultContact;

export default function AboutPage() {
  return (
    <div className="container" style={{ maxWidth: "860px", padding: "48px 24px 80px" }}>
      <div className="section-header" style={{ textAlign: "left", marginBottom: "32px" }}>
        <span className="section-badge">
          <i className="fa-solid fa-circle-info"></i> About Project
        </span>
        <h1 className="section-title">เกี่ยวกับโครงการ</h1>
        <p className="section-subtitle">
          โครงการเพิ่มศักยภาพแหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง
        </p>
      </div>

      <div style={{ background: "white", padding: "32px", borderRadius: "20px", border: "1px solid var(--slate-200)", lineHeight: 1.85, color: "var(--slate-700)" }}>
        <p style={{ fontSize: "1.05rem", marginBottom: "18px" }}>
          เว็บไซต์คลังภูมิปัญญาและผลิตภัณฑ์ชุมชนรูปแบบ 3 มิติและความจริงเสริม (3D/AR) รวบรวมวัตถุพิพิธภัณฑ์
          ผลิตภัณฑ์ ภูมิปัญญา และสถานที่สำคัญของ 5 แหล่งเรียนรู้สำคัญในจังหวัดสกลนคร
          เพื่อให้ทุกคนสามารถเข้าชมได้ผ่านเว็บเบราว์เซอร์ และวางจำลองโมเดลในพื้นที่จริงผ่านสมาร์ตโฟน (WebAR)
        </p>
        <p style={{ fontSize: "1.05rem", marginBottom: "24px" }}>
          ดำเนินการโดย <strong>{siteContact.organization}</strong>
        </p>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "32px 0 16px", color: "var(--slate-900)" }}>
          5 แหล่งเรียนรู้สำคัญ
        </h2>
        <div style={{ display: "grid", gap: "12px" }}>
          <Link href="/c/tharae" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--slate-50)", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
            <i className="fa-solid fa-church" style={{ color: "#a45247", width: "24px", textAlign: "center" }}></i>
            <div>
              <strong>1. พิพิธภัณฑ์อัครเทวดามีคาแอล ชุมชนบ้านท่าแร่</strong> — สถาปัตยกรรมตึกโคโลเนียลและประเพณีแห่ดาวคริสต์มาส
            </div>
          </Link>
          <Link href="/c/watklang" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--slate-50)", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
            <i className="fa-solid fa-place-of-worship" style={{ color: "#b47a32", width: "24px", textAlign: "center" }}></i>
            <div>
              <strong>2. พิพิธภัณฑ์วัดกลางศรีเชียงใหม่ ชุมชนบ้านท่าวัดใต้</strong> — ภาชนะดินเผาก่อนประวัติศาสตร์ ไหและเครื่องถ้วยเคลือบ พระพุทธรูป ศิลาจารึก
            </div>
          </Link>
          <Link href="/c/watnuea" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--slate-50)", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
            <i className="fa-solid fa-monument" style={{ color: "#765a8c", width: "24px", textAlign: "center" }}></i>
            <div>
              <strong>3. พิพิธภัณฑ์วัดมหาพรหมโพธิราช ชุมชนบ้านท่าวัดเหนือ</strong> — พระพุทธรูป ชิ้นส่วนสถาปัตยกรรมและใบเสมา
            </div>
          </Link>
          <Link href="/c/nonhom" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--slate-50)", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
            <i className="fa-solid fa-shirt" style={{ color: "#8d252d", width: "24px", textAlign: "center" }}></i>
            <div>
              <strong>4. แหล่งเรียนรู้ชุมชนบ้านโนนหอม</strong> — ชุมชนผู้ไทกะต๊ะ เครื่องแต่งกาย งานหัตถกรรม พิธีกรรม และวิถีชีวิต
            </div>
          </Link>
          <Link href="/c/phuphan" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--slate-50)", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
            <i className="fa-solid fa-seedling" style={{ color: "#e9773e", width: "24px", textAlign: "center" }}></i>
            <div>
              <strong>5. ศูนย์ศึกษาการพัฒนาภูพานอันเนื่องมาจากพระราชดำริ จังหวัดสกลนคร ชุมชนบ้านห้วยยาง</strong> — แหล่งเรียนรู้งานหม่อนไหม ข้าว ประมง ปศุสัตว์ พืชสวน และสมุนไพร
            </div>
          </Link>
        </div>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "36px 0 16px", color: "var(--slate-900)" }}>
          หน่วยงานผู้รับผิดชอบและสถานที่ติดต่อ
        </h2>
        <div style={{ background: "var(--slate-50)", padding: "20px", borderRadius: "14px", border: "1px solid var(--slate-200)", fontSize: "0.95rem" }}>
          <p style={{ margin: "0 0 8px" }}><strong>หน่วยงาน:</strong> {siteContact.organization}</p>
          <p style={{ margin: "0 0 8px" }}><strong>ที่อยู่:</strong> {siteContact.address}</p>
          <p style={{ margin: "0 0 8px" }}><strong>โทรศัพท์:</strong> {siteContact.phone}</p>
          <p style={{ margin: 0 }}><strong>อีเมล:</strong> {siteContact.email}</p>
        </div>
      </div>
    </div>
  );
}
