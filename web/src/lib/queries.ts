import "server-only";

import { asc, desc, eq, and } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { communities, collections, items, news, galleryImages } from "@/db/schema";
import { communities as mockCommunities } from "@/data/communities";
import type { Community, Item } from "@/lib/types";

export async function getCommunities(): Promise<Community[]> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  try {
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
        cover: community.coverPath, placeholder: !community.isPublished,
        collections: cols.map((col) => ({ id: col.id, name: col.name, description: col.description, image: col.imagePath })),
        items: content.map((item) => ({ id: item.id, collectionId: item.collectionId, name: item.name, description: item.description, model: item.modelPath, thumbnail: item.thumbnailPath, audio: item.audioPath })),
        recommended: content.filter((item) => item.isFeatured).map((item) => item.id),
      };
    });
  } catch {
    return mockCommunities;
  }
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

export async function getFeaturedItems(limit: number) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  return (await getCommunities()).flatMap((community) => community.items.filter((item) => community.recommended.includes(item.id)).map((item) => ({ ...item, communitySlug: community.slug, communityName: community.shortName }))).slice(0, Math.max(0, limit));
}

export async function getPublishedNews(communityId?: string) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  try {
    return await db.select().from(news).where(communityId ? and(eq(news.isPublished, true), eq(news.communityId, communityId)) : eq(news.isPublished, true)).orderBy(desc(news.publishedAt), asc(news.sortOrder));
  } catch {
    return [];
  }
}

export async function getPublishedNewsItem(id: string) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  try {
    return (await db.select().from(news).where(and(eq(news.id, id), eq(news.isPublished, true))).limit(1))[0];
  } catch {
    return undefined;
  }
}

export async function getPublishedGallery() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  try {
    return await db.select().from(galleryImages).where(eq(galleryImages.isPublished, true)).orderBy(asc(galleryImages.sortOrder));
  } catch {
    return [];
  }
}
