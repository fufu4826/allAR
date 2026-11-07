import { NextResponse, type NextRequest } from "next/server";
import { parseContentRoute } from "@/lib/contentRoute";
import { contentRouteExists } from "@/lib/routeIndex";

// Return a real 404 for unknown communities, items and news before the page starts streaming.
export async function proxy(request: NextRequest) {
  const route = parseContentRoute(request.nextUrl.pathname);
  if (!route) return NextResponse.next();
  try {
    if (await contentRouteExists(route)) return NextResponse.next();
  } catch {
    // Database unreachable: let the page handle it rather than hiding real content behind a 404.
    return NextResponse.next();
  }
  // No route matches this path, so Next renders app/not-found.tsx with status 404.
  return NextResponse.rewrite(new URL("/_not-found-content", request.url));
}

export const config = {
  matcher: ["/c/:slug", "/c/:slug/:itemId", "/news/:id"],
};
