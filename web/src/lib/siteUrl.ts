/**
 * Base URL of the public site, for sitemap.xml and robots.txt.
 * SITE_URL (deploy/.env) wins; otherwise the host the reverse proxy forwarded.
 * Pure (takes the header values) so it can be unit-tested.
 */
export function resolveSiteUrl(
  envUrl: string | undefined,
  headers: { host?: string | null; forwardedHost?: string | null; forwardedProto?: string | null },
): string {
  const configured = envUrl?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const host = (headers.forwardedHost ?? headers.host ?? "").split(",")[0].trim();
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return "http://localhost:3000";
  const proto = (headers.forwardedProto ?? "").split(",")[0].trim().toLowerCase();
  return `${proto === "https" || proto === "http" ? proto : "http"}://${host}`;
}
