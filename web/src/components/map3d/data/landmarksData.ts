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
  sub: string;
  desc: string;
  highlights: string;
  tags: string;
  lat: number;
  lon: number;
  dms?: string;
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
    shortName: "ชุมชนท่าแร่",
    badgeIcon: "fa-solid fa-church",
    faIcon: "fa-solid fa-church",
    category: "ชุมชน",
    categoryClass: "bg-sky-100 text-sky-800 border-sky-300",
    sub: "สันดอนทรายขอบหนองหาร",
    desc: "ตั้งอยู่บนแนวสันดอนทรายธรรมชาติ (Natural Levee) ริมขอบแอ่งยุบตัวหนองหาร พื้นที่ยกตัวสูงน้ำไม่ท่วมถึงในฤดูน้ำหลาก เหมาะแก่การตั้งชุมชนคาทอลิกโบราณ สถาปัตยกรรมตึกโคโลเนียล และอาสนวิหารทรงเรือสำเภาสีขาว",
    highlights: "อาสนวิหารทรงเรือสำเภา, สถาปัตยกรรมตึกโบราณกว่า 100 ปี, ประเพณีแห่ดาวคริสต์มาส",
    tags: "สถาปัตยกรรมคาทอลิก • ดาวคริสต์มาส • WebAR Ready",
    lat: 17.254194,
    lon: 104.184000,
    dms: "17°15'15.1\"N 104°11'02.4\"E",
    gmapsUrl: "https://www.google.com/maps?q=17.254194,104.184000",
    location: "ต.ท่าแร่ อ.เมืองสกลนคร (ฝั่งทิศเหนือของหนองหาร ริม ทล.22)",
    modelUrl: "/map3d/models/tharae.glb",
    modelConfig: {
      scale: 2.2,
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
    shortName: "วัดกลางศรีเชียงใหม่",
    badgeIcon: "fa-solid fa-place-of-worship",
    faIcon: "fa-solid fa-place-of-worship",
    category: "วัด",
    categoryClass: "bg-amber-100 text-amber-800 border-amber-300",
    sub: "ลานตะพักตะกอนน้ำพาริมหนองหาร",
    desc: "ลานตะพักตะกอนน้ำพาริมทะเลสาบฝั่งตะวันออกเฉียงใต้ (Lacustrine Terrace) บริเวณดินเหนียวและตะกอนน้ำพา เป็นที่ตั้งของสิมโบราณศิลปะล้านช้างอันวิจิตร และใบเสมาหินทรายแปดทิศยุคทวารวดี",
    highlights: "ใบเสมาหินทรายโบราณ 8 ทิศ, พระอุโบสถสถาปัตยกรรมอีสานล้านช้าง, วิวริมหนองหาร",
    tags: "ใบเสมาหินทราย 8 ทิศ • สิมล้านช้าง • ทวารวดี",
    lat: 17.140694,
    lon: 104.241306,
    dms: "17°08'26.5\"N 104°14'28.7\"E",
    gmapsUrl: "https://www.google.com/maps?q=17.140694,104.241306",
    location: "บ้านท่าวัด ต.เหล่าปอแดง อ.เมืองสกลนคร (ฝั่งตะวันออกของหนองหาร)",
    modelUrl: "/map3d/models/watklang.glb",
    modelConfig: {
      scale: 1.45,
      rotationY: Math.PI * 0.35,
      offset: { x: 0.35, y: 0.05, z: 0.45 },
    },
    labelOffset2D: { x: 16, y: 6 },
    pinAnchor: "left",
  },
  {
    id: "watnuea",
    slug: "watnuea",
    number: 3,
    name: "ท่าวัด (วัดมหาพรหมโพธิราช)",
    englishName: "Wat Maha Phrom Phothirat",
    shortName: "วัดมหาพรหมโพธิราช",
    badgeIcon: "fa-solid fa-dharmachakra",
    faIcon: "fa-solid fa-dharmachakra",
    category: "วัด",
    categoryClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    sub: "ตะพักศิลาแลงริมขอบหนองหาร",
    desc: "แนวตะพักศิลาแลงริมขอบแอ่งน้ำ มีชั้นศิลาแลงและหินทรายในระดับตื้น ซึ่งคนโบราณยุคทวารวดีใช้สลักเป็นใบเสมาศิลาแลง และเป็นท่าเทียบแพท่องเที่ยวเชิงนิเวศ 'แพท่าวัด'",
    highlights: "หลวงพ่อพระพุทธรูปศิลาโบราณ, ท่าเทียบเรือแพท่องเที่ยวเชิงนิเวศ, ชมวิวเกาะดอนสวรรค์",
    tags: "พระศิลาโบราณ • ท่าเทียบแพท่องเที่ยว • วิวหนองหาร",
    lat: 17.144611,
    lon: 104.239611,
    dms: "17°08'40.6\"N 104°14'22.6\"E",
    gmapsUrl: "https://www.google.com/maps?q=17.144611,104.239611",
    location: "บ้านท่าวัดเหนือ ต.เหล่าปอแดง อ.เมืองสกลนคร (ริมฝั่งหนองหาร)",
    modelUrl: "/map3d/models/watnuea.glb",
    modelConfig: {
      scale: 1.25,
      rotationY: Math.PI * 0.25,
      offset: { x: -0.22, y: 0.05, z: -0.45 },
    },
    labelOffset2D: { x: -16, y: -6 },
    pinAnchor: "right",
  },
  {
    id: "nonhom",
    slug: "nonhom",
    number: 4,
    name: "ชุมชนโนนหอม (บ้านโนนหอม)",
    englishName: "Baan Non Hom Community",
    shortName: "ชุมชนโนนหอม",
    badgeIcon: "fa-solid fa-house-chimney-window",
    faIcon: "fa-solid fa-house-chimney-window",
    category: "ชุมชน",
    categoryClass: "bg-teal-100 text-teal-800 border-teal-300",
    sub: "เนินดอนลอนลูกคลื่นหินทราย",
    desc: "พื้นที่ดอนลอนลูกคลื่น (Rolling Sandstone Ridge) เชื่อมต่อระหว่างแอ่งหนองหารกับตีนเขาภูพาน ดินทรายปนศิลาแลงระบายน้ำดี เหมาะแก่การเพาะปลูกต้นครามและภูมิปัญญาการย้อมครามชนเผ่าภูไทกว่า 180 ปี",
    highlights: "ศูนย์วัฒนธรรมชนเผ่าภูไท, สถาปัตยกรรมเรือนไม้ภูไท, ทอผ้าย้อมครามแท้ 100%",
    tags: "ชนเผ่าภูไท • ผ้าย้อมครามธรรมชาติ • เรือนไม้โบราณ",
    lat: 17.054889,
    lon: 104.211806,
    dms: "17°03'17.6\"N 104°12'42.5\"E",
    gmapsUrl: "https://www.google.com/maps?q=17.054889,104.211806",
    location: "ต.โนนหอม อ.เมืองสกลนคร (ทางหลวงสาย 223 ห่างจากตัวเมือง 13 กม.)",
    modelUrl: "/map3d/models/nonhom.glb",
    modelConfig: {
      scale: 2.0,
      rotationY: Math.PI * 0.15,
      offset: { x: 0, y: 0.05, z: 0 },
    },
    labelOffset2D: { x: 24, y: 12 },
    pinAnchor: "left",
  },
  {
    id: "phuphan",
    slug: "phuphan",
    number: 5,
    name: "ศูนย์ศึกษาการพัฒนาภูพานฯ",
    englishName: "Phu Phan Royal Study Centre",
    shortName: "ศูนย์ศึกษาการพัฒนาภูพานฯ",
    badgeIcon: "fa-solid fa-mountain-sun",
    faIcon: "fa-solid fa-mountain-sun",
    category: "หน่วยงาน",
    categoryClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    sub: "ลาดตะพักเชิงเขาปะทะภูพาน",
    desc: "ลาดเชิงเขาปะทะ (Piedmont Slope) ของแนวเทือกเขาภูพาน บริเวณปากอ่างเก็บน้ำห้วยยาง รับมวลน้ำและแร่ธาตุธรรมชาติจากสันเขา จึงเหมาะเป็นต้นแบบเกษตรทฤษฎีใหม่ นวัตกรรม 3 ดำมหัศจรรย์ และเห็ดไค",
    highlights: "นวัตกรรม 3 ดำมหัศจรรย์, แปลงสาธิตเห็ดไค, เกษตรทฤษฎีใหม่",
    tags: "สัตว์ 3 ดำ • เกษตรทฤษฎีใหม่ • ศาสตร์พระราชา",
    lat: 17.050000,
    lon: 104.020000,
    dms: "17°03'00.0\"N 104°01'12.0\"E",
    gmapsUrl: "https://www.google.com/maps?q=17.050000,104.020000",
    location: "บ้านนานกเค้า ต.ห้วยยาง อ.เมืองสกลนคร (แนวเชิงเขาภูพาน เลียบ ทล.213)",
    modelUrl: "/map3d/models/phuphan.glb",
    modelConfig: {
      scale: 2.5,
      rotationY: Math.PI * 0.10,
      offset: { x: 0, y: 0.05, z: 0 },
    },
    labelOffset2D: { x: -24, y: -8 },
    pinAnchor: "right",
  },
];
