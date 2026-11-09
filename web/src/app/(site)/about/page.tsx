import Link from "next/link";
import SiteIcon from "@/components/SiteIcon";
import "./about.css";
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
    <div className="about-page">
      <div className="section-header about-hero" style={{ textAlign: "left" }}>
        <span className="section-badge">
          <i className="fa-solid fa-circle-info"></i> About Project
        </span>
        <h1 className="section-title">เกี่ยวกับโครงการ</h1>
        <p className="about-project-name">
          โครงการเพิ่มศักยภาพแหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง
        </p>
      </div>

      <section className="about-section">
        <div className="about-section-head">
          <span className="about-section-icon"><i className="fa-solid fa-landmark"></i></span>
          <div>
            <span className="about-section-kicker">ความเป็นมาและวัตถุประสงค์</span>
            <h2>ความเป็นมาของโครงการ</h2>
          </div>
        </div>
        <p>
          <strong className="about-em">โครงการเพิ่มศักยภาพแหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครในรูปแบบออนไลน์เสมือนจริง</strong> ดำเนินการโดยสถาบันภาษา
          ศิลปะและวัฒนธรรม มหาวิทยาลัยราชภัฏสกลนคร มีความเป็นมาจากพันธกิจมหาวิทยาลัย (พ.ศ. 2568–2570)
          ที่มุ่งพัฒนาท้องถิ่นและยกระดับเศรษฐกิจฐานรากตามหลักปรัชญาเศรษฐกิจพอเพียง โดยใช้การทำนุบำรุงศิลปวัฒนธรรมสร้างความภาคภูมิใจ
          ยึดโยงชุมชนเข้ากับรากเหง้า และเสริมสร้างความสามัคคีในสังคม ท่ามกลางยุคดิจิทัลที่การเข้าถึงข้อมูลเป็นไปอย่างรวดเร็ว
          สถาบันฯ จึงนำความหลากหลายทางวัฒนธรรมมาประยุกต์เข้ากับศาสตร์ทางสังคม วิทยาศาสตร์ และเทคโนโลยี โดยมีวัตถุประสงค์หลักเพื่อ{" "}
          <span className="about-goal">
            ยกระดับองค์ความรู้ศิลปวัฒนธรรมและภูมิปัญญาท้องถิ่นของแหล่งเรียนรู้และพิพิธภัณฑ์ในจังหวัดสกลนครให้อยู่ในรูปแบบออนไลน์เสมือนจริง
            (Virtual Museum)
          </span>{" "}
          ให้ประชาชนสามารถเข้าถึงมรดกทางวัฒนธรรมได้อย่างสะดวกและทั่วถึง
        </p>
      </section>

      <section className="about-section">
        <div className="about-section-head">
          <span className="about-section-icon"><i className="fa-solid fa-flag"></i></span>
          <div>
            <span className="about-section-kicker">ความสอดคล้องเชิงยุทธศาสตร์</span>
            <h2>ระดับชาติ</h2>
          </div>
        </div>
        <p>
          ในมิติความสอดคล้องเชิงยุทธศาสตร์ โครงการนี้เชื่อมโยงกับกรอบการพัฒนาตั้งแต่ระดับชาติจนถึงระดับสถาบันอย่างเป็นเอกภาพ
          โดยตอบสนองต่อ <strong className="about-em">ยุทธศาสตร์ชาติ 20 ปี</strong> ด้านการพัฒนาและเสริมสร้างศักยภาพทรัพยากรมนุษย์{" "}
          <strong className="about-em">แผนแม่บทประเด็นที่ 11</strong> และ <strong className="about-em">แผนปฏิรูปประเทศ</strong> ด้านวัฒนธรรม กีฬา แรงงาน และการพัฒนาทรัพยากรมนุษย์ ตลอดจน{" "}
          <strong className="about-em">แผนพัฒนาเศรษฐกิจและสังคมแห่งชาติ ฉบับที่ 13 (หมุดหมายที่ 12)</strong>{" "}
          ที่มุ่งส่งเสริมระบบนิเวศและการเข้าถึงการเรียนรู้ตลอดชีวิต นอกจากนี้ ยังตอบรับ <strong className="about-em">ยุทธศาสตร์กระทรวง อว. (แพลตฟอร์มที่ 1)</strong>{" "}
          และขับเคลื่อนพันธกิจตาม <strong className="about-em">พ.ร.บ. มหาวิทยาลัยราชภัฏ พ.ศ. 2547</strong>{" "}
          ในการตระหนักถึงคุณค่าและความภาคภูมิใจในวัฒนธรรมท้องถิ่นและของชาติ
        </p>
      </section>

      <section className="about-section">
        <div className="about-section-head">
          <span className="about-section-icon"><i className="fa-solid fa-building-columns"></i></span>
          <div>
            <span className="about-section-kicker">ความสอดคล้องเชิงยุทธศาสตร์</span>
            <h2>ระดับสถาบัน</h2>
          </div>
        </div>
        <p>
          ในระดับสถาบัน โครงการนี้ดำเนินตาม <strong className="about-em">ยุทธศาสตร์มหาวิทยาลัยราชภัฏเพื่อการพัฒนาท้องถิ่น 20 ปี</strong> และ{" "}
          <strong className="about-em">แผนยุทธศาสตร์ 5 ปีของมหาวิทยาลัยราชภัฏสกลนคร (โครงการหลัก P2.1 Art & Culture)</strong>{" "}
          ที่มุ่งยกระดับคุณค่าและมูลค่าศิลปวัฒนธรรมท้องถิ่นสู่การพัฒนาเศรษฐกิจและสังคมในระดับสากล
          พร้อมทั้งตอบสนองต่อจุดเน้นของสภามหาวิทยาลัยในการขับเคลื่อนสู่การเป็น <strong className="about-em">มหาวิทยาลัยดิจิทัล (Digital University)</strong>{" "}
          สอดรับกับเกณฑ์ประกันคุณภาพ EdPEx หมวด 3 ด้านลูกค้า และเป้าหมายการพัฒนาที่ยั่งยืน <strong className="about-em">SDG 4 (Quality Education)</strong>{" "}
          ในการส่งเสริมโอกาสการเรียนรู้ตลอดชีวิตอย่างครอบคลุมและเท่าเทียม
        </p>
      </section>

      <section className="about-section">
        <div className="about-section-head">
          <span className="about-section-icon"><i className="fa-solid fa-map-location-dot"></i></span>
          <div>
            <span className="about-section-kicker">พื้นที่ของโครงการ</span>
            <h2>5 แหล่งเรียนรู้สำคัญ</h2>
          </div>
        </div>
            <div className="about-sites">
              <Link href="/c/tharae" className="about-site">
                <SiteIcon slug="tharae" style={{ color: "#a45247" }} />
                <div>
                  <strong>1. อาสนวิหารอัครเทวดามีคาแอล ชุมชนบ้านท่าแร่</strong> — ศูนย์รวมจิตใจของชาวคริสตชน ชุมชนท่าแร่
                </div>
              </Link>
              <Link href="/c/watklang" className="about-site">
                <SiteIcon slug="watklang" style={{ color: "#b47a32" }} />
                <div>
                  <strong>2. พิพิธภัณฑ์วัดกลางศรีเชียงใหม่ ชุมชนบ้านท่าวัดใต้</strong> — ภาชนะดินเผาก่อนประวัติศาสตร์ ไหและเครื่องถ้วยเคลือบ พระพุทธรูป ศิลาจารึก
                </div>
              </Link>
              <Link href="/c/watnuea" className="about-site">
                <SiteIcon slug="watnuea" style={{ color: "#765a8c" }} />
                <div>
                  <strong>3. พิพิธภัณฑ์วัดมหาพรหมโพธิราช ชุมชนบ้านท่าวัดเหนือ</strong> — พระพุทธรูป ชิ้นส่วนสถาปัตยกรรมและใบเสมา
                </div>
              </Link>
              <Link href="/c/nonhom" className="about-site">
                <SiteIcon slug="nonhom" style={{ color: "#8d252d" }} />
                <div>
                  <strong>4. แหล่งเรียนรู้ชุมชนบ้านโนนหอม</strong> — ชุมชนผู้ไทกะต๊ะ เครื่องแต่งกาย งานหัตถกรรม พิธีกรรม และวิถีชีวิต
                </div>
              </Link>
              <Link href="/c/phuphan" className="about-site">
                <SiteIcon slug="phuphan" style={{ color: "#e9773e" }} />
                <div>
                  <strong>5. ศูนย์ศึกษาการพัฒนาภูพานอันเนื่องมาจากพระราชดำริ จังหวัดสกลนคร ชุมชนบ้านห้วยยาง</strong> — แหล่งเรียนรู้งานหม่อนไหม ข้าว ประมง ปศุสัตว์ พืชสวน และสมุนไพร
                </div>
              </Link>
            </div>
      </section>

      <section className="about-section">
        <div className="about-section-head">
          <span className="about-section-icon"><i className="fa-solid fa-address-card"></i></span>
          <div>
            <span className="about-section-kicker">ติดต่อ</span>
            <h2>หน่วยงานผู้รับผิดชอบและสถานที่ติดต่อ</h2>
          </div>
        </div>
        <dl className="about-contact">
          <dt>หน่วยงาน</dt>
          <dd>{siteContact.organization}</dd>
          <dt>ที่อยู่</dt>
          <dd>{siteContact.address}</dd>
          <dt>โทรศัพท์</dt>
          <dd>{siteContact.phone}</dd>
          <dt>อีเมล</dt>
          <dd>{siteContact.email}</dd>
        </dl>
      </section>
    </div>
  );
}
