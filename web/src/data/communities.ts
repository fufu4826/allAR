import phuphan from "./phuphan.json";
import watklang from "./watklang.json";
import watnuea from "./watnuea.json";
import nonhom from "./nonhom.json";
import tharae from "./tharae.json";
import type { Community } from "@/lib/types";

export const communities: Community[] = [
  {
    id: "community-2",
    slug: "tharae",
    // Names follow the other sites' pattern, with the team's own word อาสนวิหาร (form of 9 Nov 2026).
    name: "อาสนวิหารอัครเทวดามีคาแอล ชุมชนบ้านท่าแร่",
    shortName: "อาสนวิหารอัครเทวดามีคาแอล",
    englishName: "THA RAE COMMUNITY",
    // tagline from the team's community description; tags are its three categories
    tagline: "ศูนย์รวมจิตใจของชาวคริสตชน ชุมชนท่าแร่",
    tags: "บุคคลสำคัญ • เครื่องแต่งกาย • วัตถุสำคัญ",
    theme: "tharae",
    location: tharae.community.location,
    description: tharae.community.description,
    // from the Tha Rae field team's form (9 Nov 2026)
    position: [tharae.community.lat, tharae.community.lng],
    color: "#a45247",
    cover: tharae.settings.cover,
    collections: tharae.collections,
    items: tharae.items,
    recommended: tharae.settings.recommended,
    placeholder: false,
  },
  {
    id: "community-3",
    slug: "watklang",
    name: "พิพิธภัณฑ์วัดกลางศรีเชียงใหม่ ชุมชนบ้านท่าวัดใต้",
    shortName: "พิพิธภัณฑ์วัดกลางศรีเชียงใหม่",
    englishName: "WAT KLANG SI CHIANG MAI",
    tagline: "สำรวจมรดกศิลปกรรมและเรื่องราวของชุมชนท่าวัดริมหนองหาร",
    tags: "ศิลปกรรม • สถาปัตยกรรม • ชุมชน",
    theme: "watklang",
    location: "บ้านท่าวัด ตำบลเหล่าปอแดง อำเภอเมืองสกลนคร จังหวัดสกลนคร",
    description: "วัดกลาง หรือวัดกลางศรีเชียงใหม่ ตั้งอยู่ในชุมชนบ้านท่าวัดซึ่งเป็นหนึ่งในชุมชนรอบหนองหานที่มีพัฒนาการต่อเนื่องมาหลายสมัยตั้งแต่สมัยทวารวดีเป็นต้นมา โดยพบหลักฐานทางโบราณคดีที่มีความสำคัญมากที่สุดอย่างหนึ่ง คือ กลุ่มใบเสมาสมัยทวารวดี ซึ่งเป็นหนึ่งในกลุ่มใบเสมาที่ยังอยู่ในสภาพค่อนข้างสมบูรณ์และมิได้ถูกเคลื่อนย้ายไปจากตำแหน่งเดิม และฐานอาคารศิลาแลงในบริเวณใกล้เคียง นอกจากนี้ยังพบโบราณวัตถุเป็นจำนวนมาก เช่น ภาชนะดินเผาเนื้อแกร่งเคลือบแบบล้านช้างใช้สำหรับบรรจุกระดูก ชิ้นส่วนพระพุทธรูปและประติมากรรมรูปเคารพทำจากหินทราย ชิ้นส่วนเครื่องประกอบสถาปัตยกรรมแบบเขมร รวมถึงศิลาจารึกที่ระบุนามผู้สร้าง คือ พระมหาพรหมเทโวโพธิสัตว์และระบุถึงชื่อวัดกลางเชียงใหม่หนองหานคามเขต ซึ่งเป็นที่มาของชื่อวัดกลางศรีเชียงใหม่ในปัจจุบัน กลุ่มใบเสมาหินทรายสมัยทวารวดี ทำจากหินทรายสีแดงและสีเทา สลักลวดลายสันสถูปและหม้อปูรณะฆฏะ มีลักษณะการปักแบบปัก 8 ทิศ ล้อมรอบเนินดิน (ซึ่งปัจจุบันทางวัดได้มีการถมดินภายในวัดให้สูงขึ้นเพื่อแก้ปัญหาน้ำท่วม ทำให้ใบเสมาอยู่ระดับเดียวกับพื้นราบ) โดยปักใบเสมาเป็นคู่ คือ ปักใบเสมาซ้อนกัน 2 ใบในแต่ละทิศ ทั้งหมดจำนวน 16 ใบ นอกจากนี้ยังพบใบเสมาแบบทวารวดีแบบปักเดี่ยวที่อยู่นอกบริเวณกลุ่มใบเสมา โดยตั้งอยู่รอบฐานอาคารศิลาแลง ซึ่งปัจจุบันที่เหลืออยู่จำนวน 3 ใบ เมื่อครั้งที่สมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี เสด็จทอดพระเนตรในปี พ.ศ. 2532 ชุมชนจึงได้เริ่มสร้างพิพิธภัณฑ์เมื่อวันที่ 18 มีนาคม 2534 แล้วเสร็จเมื่อวันที่ 28 พฤษภาคม 2534 โดยมีผู้ว่าราชการจังหวัดสกลนครและการท่องเที่ยวแห่งประเทศไทยให้การสนับสนุน\n\n“บ้านท่าวัด” เป็นชุมชนโบราณขนาดใหญ่ ผู้คนใช้ชีวิตริมหนองน้ำหารนี้มาตั้งแต่สมัยก่อนประวัติศาสตร์ต่อเนื่องมายังสมัยวัฒนธรรมทวารวดี วัฒนธรรมขอม และวัฒนธรรมล้านช้าง ดังเห็นหลักฐานได้จากกลุ่มเสมาหินทรายและพระพุทธรูปหินทรายในรูปแบบศิลปะทวารวดี ฐานโยนีสัญลักษณ์ของสิ่งศักดิ์สิทธิ์จากศิลปะขอม ทั้งการขุดพบศิลาจารึกพระมหาพรหมเทโวโพธิสัตว์ที่เขียนด้วยตัวอักษรธรรมอีสานในสมัยวัฒนธรรมล้านช้าง",
    // approximate — verify with the community
    position: [17.140694, 104.241306],
    color: "#b47a32",
    cover: watklang.settings.cover,
    collections: watklang.collections,
    items: watklang.items,
    recommended: watklang.settings.recommended,
    placeholder: false,
  },
  {
    id: "community-4",
    slug: "watnuea",
    name: "พิพิธภัณฑ์วัดมหาพรหมโพธิราช ชุมชนบ้านท่าวัดเหนือ",
    shortName: "พิพิธภัณฑ์วัดมหาพรหมโพธิราช",
    englishName: "WAT MAHA PHROM PHOTHIRAT",
    tagline: "เรียนรู้เรื่องราวทางประวัติศาสตร์และพุทธศิลป์ของชุมชนท่าวัด",
    tags: "โบราณสถาน • พุทธศิลป์ • ประวัติศาสตร์",
    theme: "watnuea",
    location: "บ้านท่าวัด ตำบลเหล่าปอแดง อำเภอเมืองสกลนคร จังหวัดสกลนคร",
    description: "วัดเหนือ ในสมัยพระเจ้าพรหมเทโวโพธิสัตว์ได้สร้างวัดที่สำคัญ 3 วัด ได้แก่ วัดเหนือชาวขอมสร้าง วัดกลางชาวมอญสร้าง วัดใต้ชาวลาวสร้าง เมื่อเมืองถูกตีแตกกลายเป็นเมืองร้าง ต่อมาราษฎรที่แตกแยกและมาจากถิ่นอื่นได้ย้ายกลับมารวมตัวกันเป็นหมู่บ้านและได้สร้างวัดขึ้นใหม่ คือ วัดแจ้งสมสะอาด ต่อมาเปลี่ยนชื่อเป็นวัดมหาพรหมโพธิราช ตามนามเจ้าเมือง พบซากฐานอาคาร ปรากฏเป็นแนวศิลาแลงและเนินอิฐ ยาวประมาณ 25 เมตร กว้าง 10 เมตร สันนิษฐานว่าเป็นที่ตั้งของอุโบสถหรือสิมเก่า โบราณวัตถุที่เก็บรักษา ได้แก่ พระพุทธรูปหินทราย สมัยทวารวดี ขนาด หน้าตักกว้าง ประมาณ 60 เซนติเมตร สูงประมาณ 120 เซนติเมตร ลักษณะพระเศียรหัก ปัจจุบันได้นำมาวางต่อกันโดยไม่ได้นำวัสดุใดมาเชื่อม พระบาทและท่อนองค์บางส่วนแตกหักไป ประทับนั่งปางสมาธิราบบนฐานรูปบัวหงาย สภาพค่อนข้างสมบูรณ์ พระพุทธรูปหินทราย สมัยลพบุรี ขนาด หน้าตักกว้าง ประมาณ 40 เซนติเมตร สูงประมาณ 60 เซนติเมตร ลักษณะ เป็นพระพุทธรูปทรงเครื่องน้อย ประทับนั่งขัดสมาธิราบอยู่บนฐานบัวหงาย องค์พระพุทธรูปมีแผ่นหินทรายยึดติดเป็นแผ่นหลัง สภาพค่อนข้างสมบูรณ์ นอกจากนี้ยังพบเศษชิ้นส่วนประติมากรรมหินทรายอีกจำนวนหนึ่ง ก้อนศิลาแลงตกกระจายอยู่จำนวนหนึ่ง ซึ่งโบราณวัตถุในปัจจุบันได้เก็บไว้ในอาคารพิพิธภัณฑ์วัดมหาพรหมโพธิราชในบริเวณวัดถัดจากพระอุโบสถไปทางทิศเหนือ\n\n“บ้านท่าวัด” เป็นชุมชนโบราณขนาดใหญ่ ผู้คนใช้ชีวิตริมหนองน้ำหารนี้มาตั้งแต่สมัยก่อนประวัติศาสตร์ต่อเนื่องมายังสมัยวัฒนธรรมทวารวดี วัฒนธรรมขอม และวัฒนธรรมล้านช้าง ดังเห็นหลักฐานได้จากกลุ่มเสมาหินทรายและพระพุทธรูปหินทรายในรูปแบบศิลปะทวารวดี ฐานโยนีสัญลักษณ์ของสิ่งศักดิ์สิทธิ์จากศิลปะขอม ทั้งการขุดพบศิลาจารึกพระมหาพรหมเทโวโพธิสัตว์ที่เขียนด้วยตัวอักษรธรรมอีสานในสมัยวัฒนธรรมล้านช้าง",
    // approximate — verify with the community
    position: [17.144611, 104.239611],
    color: "#765a8c",
    cover: watnuea.settings.cover,
    collections: watnuea.collections,
    items: watnuea.items,
    recommended: watnuea.settings.recommended,
    placeholder: false,
  },
  {
    id: "community-5",
    slug: "nonhom",
    name: "แหล่งเรียนรู้ชุมชนบ้านโนนหอม",
    shortName: "ชุมชนบ้านโนนหอม",
    englishName: "NON HOM COMMUNITY",
    // tagline/tags drafted from the Non Hom field team's own description (nonhom.json)
    tagline: "ชุมชนผู้ไทกะต๊ะ ที่ยังคงสืบทอดภูมิปัญญา เครื่องแต่งกาย งานหัตถกรรม พิธีกรรม และวิถีชีวิต",
    tags: "ผู้ไท • พิธีกรรม • หัตถกรรม",
    theme: "nonhom",
    location: nonhom.community.location,
    description: nonhom.community.description,
    // from the 3D-map PR #1; the field team's form has 17.050825, 104.214036 (user kept the PR value for now, 6 Nov 2026)
    position: [17.054889, 104.211806],
    color: "#8d252d",
    cover: nonhom.settings.cover,
    collections: nonhom.collections,
    items: nonhom.items,
    recommended: nonhom.settings.recommended,
    placeholder: false,
  },
  {
    id: "phuphan",
    slug: "phuphan",
    name: "ศูนย์ศึกษาการพัฒนาภูพานอันเนื่องมาจากพระราชดำริ จังหวัดสกลนคร ชุมชนบ้านห้วยยาง",
    shortName: "ศูนย์ศึกษาการพัฒนาภูพาน",
    englishName: "PHU PHAN DEVELOPMENT STUDY CENTRE",
    tagline: "เรียนรู้จากธรรมชาติ สู่การพัฒนาที่ยั่งยืน ณ ศูนย์ศึกษาการพัฒนาภูพานฯ",
    tags: "เกษตร • ธรรมชาติ • การเรียนรู้",
    theme: "phuphan",
    location: "บ้านนานกเค้า ต.ห้วยยาง อ.เมือง จ.สกลนคร",
    description: phuphan.settings.description,
    // พิกัดโดยประมาณ — ต้องตรวจสอบกับพื้นที่จริง
    position: [17.050000, 104.020000],
    color: "#e9773e",
    cover: phuphan.settings.cover,
    collections: phuphan.collections,
    items: phuphan.items,
    recommended: phuphan.settings.recommended,
    placeholder: false,
  },
];

export const getCommunity = (slug: string) => communities.find((c) => c.slug === slug);

export const allItems = communities.flatMap((c) =>
  c.items.map((item) => ({ ...item, communitySlug: c.slug, communityName: c.shortName })),
);
