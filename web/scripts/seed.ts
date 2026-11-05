import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { communities as source } from "../src/data/communities";
import * as schema from "../src/db/schema";

const path = (value: string | null) => value?.replace(/^\/r2\//, "/uploads/") ?? null;
const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10, charset: "utf8mb4" });
const db = drizzle(pool, { schema, mode: "default" });

async function seed() {
  for (const [i, community] of source.entries()) {
    const values = {
      id: community.slug, slug: community.slug, name: community.name, shortName: community.shortName,
      location: community.location, description: community.description,
      lat: community.position[0].toFixed(6), lng: community.position[1].toFixed(6),
      color: community.color, coverPath: path(community.cover), sortOrder: i + 1,
      isPublished: community.slug === "phuphan",
    };
    await db.insert(schema.communities).values(values).onDuplicateKeyUpdate({ set: values });
    for (const [j, collection] of community.collections.entries()) {
      const values = { id: collection.id, communityId: community.slug, name: collection.name,
        description: collection.description, imagePath: path(collection.image), sortOrder: j + 1 };
      await db.insert(schema.collections).values(values).onDuplicateKeyUpdate({ set: values });
    }
    for (const [j, item] of community.items.entries()) {
      const values = { id: item.id, collectionId: item.collectionId, name: item.name,
        description: item.description, modelPath: path(item.model), usdzPath: null,
        thumbnailPath: path(item.thumbnail), audioPath: path(item.audio),
        isFeatured: community.recommended.includes(item.id), sortOrder: j + 1, isPublished: true };
      await db.insert(schema.items).values(values).onDuplicateKeyUpdate({ set: values });
    }
  }
  const [communityCount] = await db.select({ count: count() }).from(schema.communities);
  const [collectionCount] = await db.select({ count: count() }).from(schema.collections);
  const [itemCount] = await db.select({ count: count() }).from(schema.items);
  const [featuredCount] = await db.select({ count: count() }).from(schema.items).where(eq(schema.items.isFeatured, true));
  console.log(`communities ${communityCount.count}, collections ${collectionCount.count}, items ${itemCount.count}, featured ${featuredCount.count}`);
}

seed().catch((error: unknown) => {
  console.error(`seed failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}).finally(() => pool.end());
