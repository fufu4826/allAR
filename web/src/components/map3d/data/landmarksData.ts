export interface Landmark3DItem {
  id: string; // matches allAR slug
  slug: string;
  number: number;
  name: string;
  englishName: string;
  shortName: string;
  badgeIcon: string;
  faIcon: string;
  category: string;
  categoryClass: string;
  sub: string; // MitrEarth landform & elevation
  desc: string;
  highlights: string;
  tags: string;
  lat: number;
  lon: number;
  gmapsUrl: string;
  location: string;
  modelUrl: string;
  modelConfig: {
    scale: number;
    rotationY?: number;
    offset?: { x: number; y: number; z: number };
  };
  labelOffset2D?: { x: number; y: number }; // 2D screen offset so models stay at real GPS while labels don't collide
  pinAnchor?: "center" | "left" | "right"; // anchor alignment for badges
}

export const SAKON_LANDMARKS_3D: Landmark3DItem[] = [
  {
    id: "tharae",
    slug: "tharae",
    number: 1,
    name: "ชุมชนท่าแร่ (บ้านท่าแร่)",
    englishName: "Baan Tha Rae Community",
    shortName: "ท่าแร่ (โบสถ์เรือสำเภา & ดาวคริสต์มาส)",
    badgeIcon: "fa-solid fa-church",
    faIcon: "fa-solid fa-church",
    category: "ชุมชน",
    categoryClass: "bg-sky-100 text-sky-800 border-sky-300",
    sub: "ภูมิสัณฐานมิตรเอิร์ธ: สันดอนทรายขอบแอ่งหนองหารด้านเหนือ • 163 ม. รทก.",
    desc: "ตั้งอยู่บนแนวสันดอนทรายธรรมชาติ (Natural Levee) ริมขอบแอ่งยุบตัวหนองหาร พื้นที่ยกตัวสูงน้ำไม่ท่วมถึงในฤดูน้ำหลาก เหมาะแก่การตั้งชุมชนคาทอลิกโบราณ สถาปัตยกรรมตึกโคโลเนียล และอาสนวิหารทรงเรือสำเภาสีขาว",
    highlights: "อาสนวิหารทรงเรือสำเภา, สถาปัตยกรรมตึกโบราณกว่า 100 ปี, ประเพณีแห่ดาวคริสต์มาส",
    tags: "สถาปัตยกรรมคาทอลิก • ดาวคริสต์มาส • WebAR Ready",
    lat: 17.2542,
    lon: 104.1840,
    gmapsUrl: "https://www.google.com/maps?q=17.2542,104.1840",
    location: "ต.ท่าแร่ อ.เมืองสกลนคร (ฝั่งทิศเหนือของหนองหาร ริม ทล.22)",
    modelUrl: "/map3d/models/tharae.glb",
    modelConfig: {
      scale: 2.3,
      rotationY: Math.PI * 0.85,
      offset: { x: 0, y: 0.05, z: 0 },
    },
    labelOffset2D: { x: 0, y: -6 },
    pinAnchor: "center",
  },
  {
    id: "watklang",
    slug: "watklang",
    number: 2,
    name: "ท่าวัด (วัดกลางศรีเชียงใหม่)",
    englishName: "Wat Klang Si Chiang Mai",
    shortName: "วัดกลางศรีเชียงใหม่ (เสมา 8 ทิศ)",
    badgeIcon: "fa-solid fa-place-of-worship",
    faIcon: "fa-solid fa-place-of-worship",
    category: "วัด",
    categoryClass: "bg-amber-100 text-amber-800 border-amber-300",
    sub: "ภูมิสัณฐานมิตรเอิร์ธ: ลานตะพักตะกอนน้ำพาริมหนองหาร • 160 ม. รทก.",
    desc: "ลานตะพักตะกอนน้ำพาริมทะเลสาบฝั่งตะวันออกเฉียงใต้ (Lacustrine Terrace) บริเวณดินเหนียวและตะกอนน้ำพา เป็นที่ตั้งของสิมโบราณศิลปะล้านช้างอันวิจิตร และใบเสมาหินทรายแปดทิศยุคทวารวดี",
    highlights: "ใบเสมาหินทรายโบราณ 8 ทิศ, พระอุโบสถสถาปัตยกรรมอีสานล้านช้าง, วิวริมหนองหาร",
    tags: "ใบเสมาหินทราย 8 ทิศ • สิมล้านช้าง • ทวารวดี",
    lat: 17.1407,
    lon: 104.2413,
    gmapsUrl: "https://www.google.com/maps?q=17.1407,104.2413",
    location: "บ้านท่าวัด ต.เหล่าปอแดง อ.เมืองสกลนคร (ฝั่งตะวันออกของหนองหาร)",
    modelUrl: "/map3d/models/watklang.glb",
    modelConfig: {
      scale: 2.1,
      rotationY: Math.PI * 0.35,
      offset: { x: 1.25, y: 0.05, z: 1.05 }, // Placed gracefully to the Southeast of Thawat village
    },
    labelOffset2D: { x: 65, y: 15 }, // Floating label shifted East
    pinAnchor: "left",
  },
  {
    id: "watnuea",
    slug: "watnuea",
    number: 3,
    name: "ท่าวัด (วัดมหาพรหมโพธิราช)",
    englishName: "Wat Maha Phrom Phothirat",
    shortName: "วัดมหาพรหม (พระศิลา & แพ)",
    badgeIcon: "fa-solid fa-dharmachakra",
    faIcon: "fa-solid fa-dharmachakra",
    category: "วัด",
    categoryClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    sub: "ภูมิสัณฐานมิตรเอิร์ธ: ตะพักศิลาแลงริมขอบหนองหาร • 161 ม. รทก.",
    desc: "แนวตะพักศิลาแลงริมขอบแอ่งน้ำ มีชั้นศิลาแลงและหินทรายในระดับตื้น ซึ่งคนโบราณยุคทวารวดีใช้สลักเป็นใบเสมาศิลาแลง และเป็นท่าเทียบแพท่องเที่ยวเชิงนิเวศ 'แพท่าวัด'",
    highlights: "หลวงพ่อพระพุทธรูปศิลาโบราณ, ท่าเทียบเรือแพท่องเที่ยวเชิงนิเวศ, ชมวิวเกาะดอนสวรรค์",
    tags: "พระศิลาโบราณ • ท่าเทียบแพท่องเที่ยว • วิวหนองหาร",
    lat: 17.1446,
    lon: 104.2396,
    gmapsUrl: "https://www.google.com/maps?q=17.1446,104.2396",
    location: "บ้านท่าวัดเหนือ ต.เหล่าปอแดง อ.เมืองสกลนคร (ริมฝั่งหนองหาร)",
    modelUrl: "/map3d/models/watnuea.glb",
    modelConfig: {
      scale: 1.7,
      rotationY: Math.PI * 0.25,
      offset: { x: -1.25, y: 0.05, z: -1.05 }, // Placed gracefully to the Northwest of Thawat village
    },
    labelOffset2D: { x: -65, y: -15 }, // Floating label shifted West
    pinAnchor: "right",
  },
  {
    id: "nonhom",
    slug: "nonhom",
    number: 4,
    name: "ชุมชนโนนหอม (บ้านโนนหอม)",
    englishName: "Baan Non Hom Community",
    shortName: "ชุมชนโนนหอม (เรือนผู้ไท & ผ้าย้อมคราม)",
    badgeIcon: "fa-solid fa-house-chimney-window",
    faIcon: "fa-solid fa-house-chimney-window",
    category: "ชุมชน",
    categoryClass: "bg-teal-100 text-teal-800 border-teal-300",
    sub: "ภูมิสัณฐานมิตรเอิร์ธ: เนินดอนลอนลูกคลื่นหินทราย • 172 ม. รทก.",
    desc: "พื้นที่ดอนลอนลูกคลื่น (Rolling Sandstone Ridge) เชื่อมต่อระหว่างแอ่งหนองหารกับตีนเขาภูพาน ดินทรายปนศิลาแลงระบายน้ำดี เหมาะแก่การเพาะปลูกต้นครามและภูมิปัญญาการย้อมครามชนเผ่าภูไทกว่า 180 ปี",
    highlights: "ศูนย์วัฒนธรรมชนเผ่าภูไท, สถาปัตยกรรมเรือนไม้ภูไท, ทอผ้าย้อมครามแท้ 100%",
    tags: "ชนเผ่าภูไท • ผ้าย้อมครามธรรมชาติ • เรือนไม้โบราณ",
    lat: 17.0549,
    lon: 104.2118,
    gmapsUrl: "https://www.google.com/maps?q=17.0549,104.2118",
    location: "ต.โนนหอม อ.เมืองสกลนคร (ทางหลวงสาย 223 ห่างจากตัวเมือง 13 กม.)",
    modelUrl: "/map3d/models/nonhom.glb",
    modelConfig: {
      scale: 2.1,
      rotationY: Math.PI * 0.15,
      offset: { x: 0, y: 0.05, z: 0 },
    },
    labelOffset2D: { x: 38, y: 16 }, // Real GPS location, label shifted East/Down
    pinAnchor: "left",
  },
  {
    id: "phuphan",
    slug: "phuphan",
    number: 5,
    name: "ศูนย์ศึกษาการพัฒนาภูพานฯ",
    englishName: "Phu Phan Royal Study Centre",
    shortName: "ศูนย์ฯ ภูพาน (สัตว์ 3 ดำ & เห็ดไค)",
    badgeIcon: "fa-solid fa-mountain-sun",
    faIcon: "fa-solid fa-mountain-sun",
    category: "หน่วยงาน",
    categoryClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    sub: "ภูมิสัณฐานมิตรเอิร์ธ: ลาดตะพักเชิงเขาปะทะภูพาน • 215 ม. รทก.",
    desc: "ลาดเชิงเขาปะทะ (Piedmont Slope) ของแนวเทือกเขาภูพาน บริเวณปากอ่างเก็บน้ำห้วยยาง รับมวลน้ำและแร่ธาตุธรรมชาติจากสันเขา จึงเหมาะเป็นต้นแบบเกษตรทฤษฎีใหม่ นวัตกรรม 3 ดำมหัศจรรย์ และเห็ดไค",
    highlights: "นวัตกรรม 3 ดำมหัศจรรย์, แปลงสาธิตเห็ดไค, เกษตรทฤษฎีใหม่",
    tags: "สัตว์ 3 ดำ • เกษตรทฤษฎีใหม่ • ศาสตร์พระราชา",
    lat: 17.0500,
    lon: 104.0200,
    gmapsUrl: "https://www.google.com/maps?q=17.0500,104.0200",
    location: "บ้านนานกเค้า ต.ห้วยยาง อ.เมืองสกลนคร (แนวเชิงเขาภูพาน เลียบ ทล.213)",
    modelUrl: "/map3d/models/phuphan.glb",
    modelConfig: {
      scale: 2.6,
      rotationY: Math.PI * 0.10,
      offset: { x: 0, y: 0.05, z: 0 },
    },
    labelOffset2D: { x: -38, y: -10 }, // Real GPS location, label shifted West/Up
    pinAnchor: "right",
  },
];
