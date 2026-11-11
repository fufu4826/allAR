import { sql } from "drizzle-orm";
import { db } from "@/db";
import { pageStats } from "@/db/schema";
import { contentRouteExists } from "@/lib/routeIndex";
import { parseStatEvent, thaiDay } from "@/lib/stats";

// Beacon from the public pages (components/TrackVisit.tsx). Only pages that exist are counted,
// so the table cannot be filled with made-up keys. Always answers 204: a visitor never sees an error.
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 512) return new Response(null, { status: 204 });
    const stat = parseStatEvent(JSON.parse(text));
    if (!stat) return new Response(null, { status: 204 });
    const route = stat.itemId
      ? ({ kind: "item", slug: stat.slug, itemId: stat.itemId } as const)
      : ({ kind: "community", slug: stat.slug } as const);
    if (!(await contentRouteExists(route))) return new Response(null, { status: 204 });
    await db
      .insert(pageStats)
      .values({ day: thaiDay(), event: stat.event, slug: stat.slug, itemId: stat.itemId, count: 1 })
      .onDuplicateKeyUpdate({ set: { count: sql`${pageStats.count} + 1` } });
  } catch {
    // Bad JSON or the database is down: counting is best effort.
  }
  return new Response(null, { status: 204 });
}
