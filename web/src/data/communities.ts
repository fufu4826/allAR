import phuphan from "./phuphan.json";

export type Item = {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  model: string | null;
  thumbnail: string | null;
  audio: string | null;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  image: string | null;
};

export type Community = {
  slug: string;
  name: string;
  shortName: string;
  location: string;
  description: string;
  /** [lat, lng] — ตำแหน่งหมุดบนแผนที่ */
  position: [number, number];
  color: string;
  cover: string | null;
  collections: Collection[];
  items: Item[];
  recommended: string[];
  /** ยังไม่มีข้อมูล แสดงเป็นหมุด "รอข้อมูล" */
  placeholder?: boolean;
};

const placeholder = (n: number, position: [number, number], color: string): Community => ({
  slug: `community-${n}`,
  name: `ชุมชนที่ ${n}`,
  shortName: `ชุมชนที่ ${n}`,
  location: "รอข้อมูลจากชุมชน",
  description: "อยู่ระหว่างเก็บข้อมูลและสแกนโมเดล 3 มิติ",
  position,
  color,
  cover: null,
  collections: [],
  items: [],
  recommended: [],
  placeholder: true,
});

export const communities: Community[] = [
  {
    slug: "phuphan",
    name: "ศูนย์ศึกษาการพัฒนาภูพานอันเนื่องมาจากพระราชดำริ",
    shortName: "ศูนย์ศึกษาการพัฒนาภูพาน",
    location: "บ้านนานกเค้า ต.ห้วยยาง อ.เมือง จ.สกลนคร",
    description: phuphan.settings.description,
    // พิกัดโดยประมาณ — ต้องตรวจสอบกับพื้นที่จริง
    position: [17.0986, 103.9777],
    color: "#e9773e",
    cover: phuphan.settings.cover,
    collections: phuphan.collections,
    items: phuphan.items,
    recommended: phuphan.settings.recommended,
  },
  // ตำแหน่งชั่วคราวสำหรับต้นแบบ — แทนด้วยชื่อและพิกัดจริงเมื่อได้ข้อมูล
  placeholder(2, [17.3, 104.12], "#3b7d6e"),
  placeholder(3, [17.42, 103.78], "#5b6bb5"),
  placeholder(4, [16.98, 104.33], "#b5545b"),
  placeholder(5, [17.58, 104.02], "#8a6d2f"),
];

export const getCommunity = (slug: string) => communities.find((c) => c.slug === slug);

export const allItems = communities.flatMap((c) =>
  c.items.map((item) => ({ ...item, communitySlug: c.slug, communityName: c.shortName })),
);
