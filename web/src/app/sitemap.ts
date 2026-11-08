import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCommunities } from "@/lib/queries";
import { resolveSiteUrl } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const base = resolveSiteUrl(process.env.SITE_URL, {
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });
  const communities = await getCommunities();

  const pages: MetadataRoute.Sitemap = ["/", "/map", "/about", "/search"].map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
  }));
  // Published communities and their published items (getCommunities already drops unpublished items).
  const content = communities
    .filter((community) => !community.placeholder)
    .flatMap((community) => [
      { url: `${base}/c/${encodeURIComponent(community.slug)}` },
      ...community.items.map((item) => ({
        url: `${base}/c/${encodeURIComponent(community.slug)}/${encodeURIComponent(item.id)}`,
      })),
    ]);
  return [...pages, ...content];
}
