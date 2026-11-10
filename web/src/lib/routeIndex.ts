import mysql from "mysql2/promise";
import type { ContentRoute } from "./contentRoute";

/**
 * Which public dynamic routes exist, so Proxy can answer a real 404 before the page streams.
 * (A notFound() inside <Suspense> can only produce a 200 + noindex, because streaming has
 * already sent the status; see node_modules/next/dist/docs .../loading.md "Status codes".)
 *
 * Used from Proxy, so it keeps its own tiny pool and plain SQL instead of importing @/db
 * (which is "server-only" and meant for the React server bundle).
 */

const globalForIndex = globalThis as typeof globalThis & { routeIndexPool?: mysql.Pool };
function pool() {
  globalForIndex.routeIndexPool ??= mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 2, charset: "utf8mb4" });
  return globalForIndex.routeIndexPool;
}

type Index = { communities: Set<string>; items: Set<string>; loadedAt: number };

const MAX_AGE_MS = 60_000; // admin edits show up within a minute
const MIN_RELOAD_MS = 5_000; // a miss reloads at most this often, so new content is found quickly

let index: Index | null = null;
let loading: Promise<Index> | null = null;

async function loadIndex(): Promise<Index> {
  type Row = mysql.RowDataPacket & { slug: string; id: string };
  const db = pool();
  const [[communityRows], [itemRows]] = await Promise.all([
    // Same rules as the pages: every community has a page (unpublished ones show a placeholder),
    // items only when published and in a published community.
    db.query<Row[]>("SELECT slug FROM communities"),
    db.query<Row[]>(
      "SELECT c.slug, i.id FROM items i JOIN collections col ON col.id = i.collection_id " +
        "JOIN communities c ON c.id = col.community_id WHERE i.is_published = 1 AND c.is_published = 1",
    ),
  ]);
  return {
    communities: new Set(communityRows.map((r) => r.slug)),
    items: new Set(itemRows.map((r) => `${r.slug}/${r.id}`)),
    loadedAt: Date.now(),
  };
}

async function getIndex(force = false): Promise<Index> {
  const age = index ? Date.now() - index.loadedAt : Infinity;
  if (index && !force && age < MAX_AGE_MS) return index;
  if (index && force && age < MIN_RELOAD_MS) return index;
  loading ??= loadIndex().finally(() => {
    loading = null;
  });
  index = await loading;
  return index;
}

function has(idx: Index, route: ContentRoute) {
  if (route.kind === "community") return idx.communities.has(route.slug);
  return idx.items.has(`${route.slug}/${route.itemId}`);
}

/** True if the content exists, false if it does not. Throws if the database cannot be read. */
export async function contentRouteExists(route: ContentRoute): Promise<boolean> {
  if (has(await getIndex(), route)) return true;
  return has(await getIndex(true), route);
}
