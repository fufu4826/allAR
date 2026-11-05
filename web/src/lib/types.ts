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

