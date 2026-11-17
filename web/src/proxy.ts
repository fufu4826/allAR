import { NextResponse, type NextRequest } from "next/server";
import { parseContentRoute } from "@/lib/contentRoute";
import { guardAnonymousRequest } from "@/lib/requestGuard";
import { contentRouteExists } from "@/lib/routeIndex";

const SESSION_COOKIE = /^[A-Za-z0-9_-]{43}$/;

export async function proxy(request: NextRequest) {
  // Requests without an admin session cookie: no large bodies, no admin pages (lib/requestGuard.ts).
  // Requests that carry one never reach this function (see the matcher), so the admin's uploads
  // are not buffered by Proxy; the pages and actions check the session against the database.
  if (!SESSION_COOKIE.test(request.cookies.get("allar_session")?.value ?? "")) {
    const verdict = guardAnonymousRequest(request.method, request.nextUrl.pathname, request.headers.get("content-length"), request.body !== null);
    if (verdict === "too-large") return new NextResponse(null, { status: 413, headers: { Connection: "close" } });
    if (verdict === "to-login") return NextResponse.redirect(new URL("/admin/login", request.url), 307);
  }

  // Return a real 404 for unknown communities and items before the page starts streaming.
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
  matcher: [
    "/c/:slug",
    "/c/:slug/:itemId",
    // Everything else only when no session cookie of the right shape is sent. Static files and
    // uploaded media are left out: they are GET-only and need no check.
    {
      source: "/((?!_next/static|_next/image|uploads/|decoders/|favicon.ico).*)",
      missing: [{ type: "cookie", key: "allar_session", value: "[A-Za-z0-9_-]{43}" }],
    },
  ],
};
