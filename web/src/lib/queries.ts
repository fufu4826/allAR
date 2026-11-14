import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { communities, collections, items, pageStats } from "@/db/schema";
import type { Community, Item } from "@/lib/types";

export async function getCommunities(): Promise<Community[]> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  const [communityRows, collectionRows, itemRows] = await Promise.all([
    db.select().from(communities).orderBy(asc(communities.sortOrder), asc(communities.name)),
    db.select().from(collections).orderBy(asc(collections.sortOrder), asc(collections.name)),
    db.select().from(items).where(eq(items.isPublished, true)).orderBy(asc(items.sortOrder), asc(items.name)),
  ]);
  return communityRows.map((community) => {
    const cols = community.isPublished ? collectionRows.filter((col) => col.communityId === community.id) : [];
    const content = itemRows.filter((item) => cols.some((col) => col.id === item.collectionId));
    return {
      id: community.id, englishName: community.englishName, tagline: community.tagline, tags: community.tags, theme: community.theme,
      slug: community.slug, name: community.name, shortName: community.shortName,
      location: community.location, description: community.description,
      position: [Number(community.lat), Number(community.lng)], color: community.color,
      cover: community.coverPath, video: community.videoPath, placeholder: !community.isPublished,
      collections: cols.map((col) => ({ id: col.id, name: col.name, description: col.description, image: col.imagePath })),
      items: content.map((item) => ({ id: item.id, collectionId: item.collectionId, name: item.name, description: item.description, model: item.modelPath, usdz: item.usdzPath, thumbnail: item.thumbnailPath, audio: item.audioPath })),
      recommended: content.filter((item) => item.isFeatured).map((item) => item.id),
    };
  });
}

export async function getCommunity(slug: string): Promise<Community | undefined> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  return (await getCommunities()).find((community) => community.slug === slug);
}

export async function getCommunityWithContent(slug: string): Promise<Community | undefined> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  return getCommunity(slug);
}

export async function getItem(slug: string, itemId: string): Promise<Item | undefined> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  const community = await getCommunityWithContent(slug);
  return community?.items.find((item) => item.id === itemId);
}

export async function getSearchIndex() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  return (await getCommunities()).flatMap((community) => community.items.map((item) => ({ ...item, communitySlug: community.slug, communityName: community.shortName })));
}

export type ViewCounts = { items: Record<string, number>; video: number };

/** Public counters for one learning site: how often each item page was opened, and how often its
 *  video was played. All days added up. Cached for a few minutes, so a new visit shows up shortly
 *  after rather than on the next page load. */
export async function getViewCounts(slug: string): Promise<ViewCounts> {
  "use cache";
  cacheTag("stats");
  cacheLife("minutes");
  const rows = await db
    .select({ itemId: pageStats.itemId, event: pageStats.event, total: sql<number>`CAST(SUM(${pageStats.count}) AS SIGNED)` })
    .from(pageStats)
    .where(and(eq(pageStats.slug, slug), sql`${pageStats.event} IN ('view', 'video')`))
    .groupBy(pageStats.itemId, pageStats.event);
  const counts: ViewCounts = { items: {}, video: 0 };
  for (const row of rows) {
    if (row.event === "video") counts.video += Number(row.total);
    else if (row.itemId) counts.items[row.itemId] = Number(row.total);
  }
  return counts;
}
