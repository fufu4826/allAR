/** Visit counting: what a beacon may record. Pure, so it can be unit-tested. */

export type StatEvent = { event: "view" | "ar"; slug: string; itemId: string };

const SLUG = /^[a-z0-9-]{1,64}$/;
const ITEM = /^[a-z0-9]{1,32}$/;

/** Validate a beacon body. "ar" needs an item; a learning-site view has none. */
export function parseStatEvent(body: unknown): StatEvent | null {
  if (!body || typeof body !== "object") return null;
  const { event, slug, itemId } = body as Record<string, unknown>;
  if (event !== "view" && event !== "ar") return null;
  if (typeof slug !== "string" || !SLUG.test(slug)) return null;
  const item = itemId === undefined || itemId === null || itemId === "" ? "" : itemId;
  if (typeof item !== "string" || (item && !ITEM.test(item))) return null;
  if (event === "ar" && !item) return null;
  return { event, slug, itemId: item };
}

/** Today's date in Thailand (UTC+7, no daylight saving) as YYYY-MM-DD. */
export function thaiDay(now: number = Date.now()) {
  return new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
