export interface Landmark3DItem {
  id: string; // matches allAR slug
  slug: string;
  number: number;
  name: string;
  shortName: string;
  badgeIcon: string;
  category: string;
  categoryClass: string;
  lat: number;
  lon: number;
  gmapsUrl: string;
  location: string;
  desc: string;
  highlights: string;
  modelUrl: string;
  modelConfig: {
    scale: number;
    rotationY?: number;
    offset?: { x: number; y: number; z: number };
  };
  sideOffset?: { x: number; z: number }; // for staggered pins
}

export const SAKON_LANDMARKS_3D: Landmark3DItem[] = [
  {
    id: "phuphan",
    slug: "phuphan",
    number: 1,
    name: "ศูนย์ศึกษาการพัฒนาภูพานอันเนื่องมาจากพระราชดำริ",
    shortName: "ศูนย์ฯ ภูพาน (สัตว์ 3 ดำ & เห็ดไค)",
    badgeIcon: "🐂",
    category: "หน่วยงาน",
    categoryClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    lat: 17.0505,
    lon: 104.0180,
    gmapsUrl: "https://www.google.com/maps?q=17.0505,104.0180",
    location: "บ้านนานกเค้า ต.ห้วยยาง อ.เมืองสกลนคร (แนวเชิงเขาภูพาน เลียบ ทล.213)",
    desc: "พิพิธภัณฑ์ธรรมชาติที่มีชีวิตและศูนย์บริการเบ็ดเสร็จด้านการพัฒนาเกษตรและปศุสัตว์ตามแนวพระราชดำริ ต้นกำเนิดสัตว์ 3 ดำ (ไก่ดำ, หมูดำ, วัวดำทาจิมะ) และเห็ดไค",
    highlights: "นวัตกรรม 3 ดำมหัศจรรย์, แปลงสาธิตเห็ดไค, เกษตรทฤษฎีใหม่",
    modelUrl: "/map3d/models/phuphan.glb",
    modelConfig: {
      scale: 2.6,
      rotationY: Math.PI * 0.10,
      offset: { x: 0, y: 0.05, z: 0 },
    },
  },
  {
    id: "nonhom",
    slug: "nonhom",
    number: 2,
    name: "ชุมชนบ้านโนนหอม (วิถีวัฒนธรรมชนเผ่าภูไท)",
    shortName: "ชุมชนโนนหอม (เรือนผู้ไท & ผ้าย้อมคราม)",
    badgeIcon: "🏡",
    category: "ชุมชน",
    categoryClass: "bg-teal-100 text-teal-800 border-teal-300",
    lat: 17.0528,
    lon: 104.2137,
    gmapsUrl: "https://www.google.com/maps?q=17.0528,104.2137",
    location: "ต.โนนหอม อ.เมืองสกลนคร (ทางหลวงสาย 223 ห่างจากตัวเมือง 13 กม.)",
    desc: "หมู่บ้านท่องเที่ยวเชิงวัฒนธรรมชนเผ่าภูไท อนุรักษ์วิถีชีวิตดั้งเดิม เสื้อดำขลิบแดง เรือนไม้ยกพื้นสูง และภูมิปัญญาการย้อมครามธรรมชาติกว่า 180 ปี",
    highlights: "ศูนย์วัฒนธรรมชนเผ่าภูไท, สถาปัตยกรรมเรือนไม้ภูไท, ทอผ้าย้อมครามแท้ 100%",
    modelUrl: "/map3d/models/nonhom.glb",
    modelConfig: {
      scale: 2.1,
      rotationY: Math.PI * 0.15,
      offset: { x: 0, y: 0.05, z: 0 },
    },
  },
  {
    id: "watklang",
    slug: "watklang",
    number: 3,
    name: "วัดกลางศรีเชียงใหม่ (ใบเสมาหินทรายแปดทิศแห่งท่าวัด)",
    shortName: "วัดกลางศรีเชียงใหม่ (เสมา 8 ทิศ)",
    badgeIcon: "🛕",
    category: "วัด",
    categoryClass: "bg-amber-100 text-amber-800 border-amber-300",
    lat: 17.1407,
    lon: 104.2413,
    gmapsUrl: "https://www.google.com/maps?q=17.1407,104.2413",
    location: "บ้านท่าวัด ต.เหล่าปอแดง อ.เมืองสกลนคร (ฝั่งตะวันออกของหนองหาร)",
    desc: "อารามโบราณสำคัญในชุมชนบ้านท่าวัดริมฝั่งหนองหาร ประดิษฐานใบเสมาหินทรายแปดทิศ ศิลปะทวารวดี-ขอมโบราณ สลักลวดลายกลีบบัวและยอดสถูปิกะ",
    highlights: "ใบเสมาหินทรายโบราณ 8 ทิศ, พระอุโบสถสถาปัตยกรรมอีสานล้านช้าง, วิวริมหนองหาร",
    modelUrl: "/map3d/models/watklang.glb",
    modelConfig: {
      scale: 2.3,
      rotationY: Math.PI * 0.35,
      offset: { x: 0, y: 0.05, z: 0 },
    },
    sideOffset: { x: 0.75, z: 0.15 }, // Side-by-side positioning
  },
  {
    id: "watnuea",
    slug: "watnuea",
    number: 4,
    name: "วัดมหาพรหมโพธิราช / วัดเหนือ (พระพุทธรูปศิลาโบราณ & แพท่องเที่ยว)",
    shortName: "วัดมหาพรหม (พระศิลา & แพ)",
    badgeIcon: "☸️",
    category: "วัด",
    categoryClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    lat: 17.1446,
    lon: 104.2396,
    gmapsUrl: "https://www.google.com/maps?q=17.1446,104.2396",
    location: "บ้านท่าวัดเหนือ ต.เหล่าปอแดง อ.เมืองสกลนคร (ริมฝั่งหนองหาร)",
    desc: "วัดคู่เคียงของบ้านท่าวัด โดดเด่นด้วยพระพุทธรูปศิลาหินทรายโบราณใต้ผืนน้ำหนองหาร และเป็นท่าเทียบแพท่องเที่ยวเชิงนิเวศ 'แพท่าวัด'",
    highlights: "หลวงพ่อพระพุทธรูปศิลาโบราณ, ท่าเทียบเรือแพท่องเที่ยวเชิงนิเวศ, ชมวิวเกาะดอนสวรรค์",
    modelUrl: "/map3d/models/watnuea.glb",
    modelConfig: {
      scale: 1.85,
      rotationY: Math.PI * 0.25,
      offset: { x: 0, y: 0.05, z: 0 },
    },
    sideOffset: { x: -0.75, z: -0.15 }, // Side-by-side positioning
  },
  {
    id: "tharae",
    slug: "tharae",
    number: 5,
    name: "ชุมชนบ้านท่าแร่ (สถาปัตยกรรมคาทอลิก & โบสถ์เรือสำเภา)",
    shortName: "ท่าแร่ (โบสถ์เรือสำเภา & ดาวคริสต์มาส)",
    badgeIcon: "⛪",
    category: "ชุมชน",
    categoryClass: "bg-sky-100 text-sky-800 border-sky-300",
    lat: 17.2550,
    lon: 104.1815,
    gmapsUrl: "https://www.google.com/maps?q=17.2550,104.1815",
    location: "ต.ท่าแร่ อ.เมืองสกลนคร (ฝั่งทิศเหนือของหนองหาร ริม ทล.22)",
    desc: "ชุมชนชาวคริสต์นิกายโรมันคาทอลิกที่ใหญ่ที่สุดในไทย โดดเด่นด้วยอาสนวิหารอัครเทวดามีคาแอลทรงเรือสำเภาสีขาว และเทศกาลแห่ดาวคริสต์มาสระดับโลก",
    highlights: "อาสนวิหารทรงเรือสำเภา, สถาปัตยกรรมตึกโบราณกว่า 100 ปี, ประเพณีแห่ดาวคริสต์มาส",
    modelUrl: "/map3d/models/tharae.glb",
    modelConfig: {
      scale: 2.3,
      rotationY: Math.PI * 0.85,
      offset: { x: 0, y: 0.05, z: 0 },
    },
  },
];
