import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { communities as source } from "../src/data/communities";
import * as schema from "../src/db/schema";

const path = (value: string | null) => value?.replace(/^\/r2\//, "/uploads/") ?? null;
const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10, charset: "utf8mb4" });
const db = drizzle(pool, { schema, mode: "default" });

const draftNews = [
  {
    id: "news-tharae",
    communityId: "community-2",
    title: "เปิดตัวระบบ WebAR สแกนสถาปัตยกรรมโบราณตึกฝรั่งเศสท่าแร่",
    summary:
      "ทีมนักศึกษาฝึกงานร่วมกับผู้นำชุมชนท่าแร่ ติดตั้งป้าย QR Code แนะนำเส้นทางท่องเที่ยวเชิงวัฒนธรรมผ่านมุมมอง AR จำลองบรรยากาศในอดีต",
    body: "ทีมนักศึกษาฝึกงานร่วมกับผู้นำชุมชนท่าแร่ ติดตั้งป้าย QR Code แนะนำเส้นทางท่องเที่ยวเชิงวัฒนธรรมผ่านมุมมอง AR จำลองบรรยากาศในอดีต พร้อมทั้งสาธิตการใช้งานระบบแก่ประชาชนและนักท่องเที่ยว เพื่อส่งเสริมการเรียนรู้ประวัติศาสตร์ท้องถิ่น",
    category: "เทคโนโลยีชุมชน",
    coverPath: null,
    publishedAt: new Date("2026-10-24T00:00:00Z"),
    isPublished: false,
    sortOrder: 1,
  },
  {
    id: "news-nonhom",
    communityId: "community-5",
    title: "จำลองผืนผ้าครามและลวดลายโบราณชนเผ่าภูไทสู่โมเดลสามมิติ",
    summary:
      "การบันทึกกระบวนการย้อมครามธรรมชาติและลวดลายผ้าทอมือเอกลักษณ์โนนหอม ให้ผู้คนได้เรียนรู้เนื้อผ้าและขั้นตอนการทอแบบ 3D Interaction",
    body: "การบันทึกกระบวนการย้อมครามธรรมชาติและลวดลายผ้าทอมือเอกลักษณ์โนนหอม ให้ผู้คนได้เรียนรู้เนื้อผ้าและขั้นตอนการทอแบบ 3D Interaction ถ่ายทอดองค์ความรู้ภูมิปัญญาของชุมชนสู่คนรุ่นใหม่",
    category: "ศิลปวัฒนธรรม",
    coverPath: null,
    publishedAt: new Date("2026-10-15T00:00:00Z"),
    isPublished: false,
    sortOrder: 2,
  },
  {
    id: "news-phuphan",
    communityId: "phuphan",
    title: "สื่อการเรียนรู้เสมือนจริง 3 ดำมหัศจรรย์ สู่การศึกษาเพื่อความยั่งยืน",
    summary:
      "นำเทคโนโลยี AR มาต่อยอดองค์ความรู้ ไก่ดำ หมูดำ และโคเนื้อทาจิมะภูพาน เพื่อสร้างความเข้าใจแก่เยาวชนและผู้เข้าเยี่ยมชมศูนย์ศึกษาฯ",
    body: "นำเทคโนโลยี AR มาต่อยอดองค์ความรู้ ไก่ดำ หมูดำ และโคเนื้อทาจิมะภูพาน เพื่อสร้างความเข้าใจแก่เยาวชนและผู้เข้าเยี่ยมชมศูนย์ศึกษาฯ ผ่านระบบจำลองสามมิติที่สามารถโต้ตอบได้",
    category: "โครงการพระราชดำริ",
    coverPath: null,
    publishedAt: new Date("2026-10-05T00:00:00Z"),
    isPublished: false,
    sortOrder: 3,
  },
];

async function seed() {
  for (const [i, community] of source.entries()) {
    const id = community.id || community.slug;
    const values = {
      id,
      slug: community.slug,
      name: community.name,
      shortName: community.shortName,
      englishName: community.englishName ?? null,
      tagline: community.tagline ?? null,
      tags: community.tags ?? null,
      theme: community.theme ?? "default",
      location: community.location,
      description: community.description,
      lat: community.position[0].toFixed(6),
      lng: community.position[1].toFixed(6),
      color: community.color,
      coverPath: path(community.cover),
      sortOrder: i + 1,
      isPublished: true,
    };
    await db.insert(schema.communities).values(values).onDuplicateKeyUpdate({ set: values });
    for (const [j, collection] of community.collections.entries()) {
      const colValues = {
        id: collection.id,
        communityId: id,
        name: collection.name,
        description: collection.description,
        imagePath: path(collection.image),
        sortOrder: j + 1,
      };
      await db.insert(schema.collections).values(colValues).onDuplicateKeyUpdate({ set: colValues });
    }
    for (const [j, item] of community.items.entries()) {
      const itemValues = {
        id: item.id,
        collectionId: item.collectionId,
        name: item.name,
        description: item.description,
        modelPath: path(item.model),
        usdzPath: null,
        thumbnailPath: path(item.thumbnail),
        audioPath: path(item.audio),
        isFeatured: community.recommended.includes(item.id),
        sortOrder: j + 1,
        isPublished: true,
      };
      await db.insert(schema.items).values(itemValues).onDuplicateKeyUpdate({ set: itemValues });
    }
  }

  // Seed draft news items
  for (const item of draftNews) {
    await db.insert(schema.news).values(item).onDuplicateKeyUpdate({ set: item });
  }

  const [communityCount] = await db.select({ count: count() }).from(schema.communities);
  const [collectionCount] = await db.select({ count: count() }).from(schema.collections);
  const [itemCount] = await db.select({ count: count() }).from(schema.items);
  const [featuredCount] = await db.select({ count: count() }).from(schema.items).where(eq(schema.items.isFeatured, true));
  const [newsCount] = await db.select({ count: count() }).from(schema.news);
  console.log(`communities ${communityCount.count}, collections ${collectionCount.count}, items ${itemCount.count}, featured ${featuredCount.count}, news ${newsCount.count}`);
}

seed().catch((error: unknown) => {
  console.error(`seed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}).finally(() => pool.end());
