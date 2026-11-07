import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveSiteUrl } from "@/lib/siteUrl";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const base = resolveSiteUrl(process.env.SITE_URL, {
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
