/** What Proxy does with a request that carries no admin session cookie. Pure, so it can be unit-tested. */

/** Largest body accepted without a session: the sign-in form and the visit beacon are far smaller. */
export const ANON_BODY_LIMIT = 64 * 1024;

export type GuardVerdict = "pass" | "too-large" | "to-login";

/**
 * - A body over the limit (or of unknown length) is refused before Next.js reads it. Server
 *   actions accept up to 260 MB for the admin's model uploads, and the body is parsed before the
 *   action can check who is asking; without this, anyone could fill the server's memory.
 * - An admin page is answered with a real redirect to the sign-in page instead of an empty shell.
 */
export function guardAnonymousRequest(method: string, pathname: string, contentLength: string | null, hasBody: boolean): GuardVerdict {
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    if (contentLength === null) return hasBody ? "too-large" : "pass";
    if (!/^\d{1,15}$/.test(contentLength) || Number(contentLength) > ANON_BODY_LIMIT) return "too-large";
    return "pass";
  }
  const path = pathname.replace(/\/+$/, "");
  if ((path === "/admin" || path.startsWith("/admin/")) && path !== "/admin/login") return "to-login";
  return "pass";
}
