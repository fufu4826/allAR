/** Public dynamic routes whose content lives in the database. Pure, so it can be unit-tested. */

export type ContentRoute =
  | { kind: "community"; slug: string }
  | { kind: "item"; slug: string; itemId: string };

const SEGMENT = /^[^/]+$/;

/** Map a pathname to the content it needs, or null for any other path. Pure; unit-tested. */
export function parseContentRoute(pathname: string): ContentRoute | null {
  const parts = pathname.replace(/\/+$/, "").split("/").slice(1).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  if (parts.some((p) => !SEGMENT.test(p))) return null;
  if (parts[0] === "c" && parts.length === 2) return { kind: "community", slug: parts[1] };
  if (parts[0] === "c" && parts.length === 3) return { kind: "item", slug: parts[1], itemId: parts[2] };
  return null;
}
