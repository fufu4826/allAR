import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCommunities, getPublishedNews } from "@/lib/queries";
import { resolveSiteUrl } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const base = resolveSiteUrl(process.env.SITE_URL, {
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });
  const [communities, news] = await Promise.all([getCommunities(), getPublishedNews()]);

  const pages: MetadataRoute.Sitemap = ["/", "/map", "/about", "/news", "/search"].map((path) => ({
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
  const articles = news.map((article) => ({
    url: `${base}/news/${encodeURIComponent(article.id)}`,
    lastModified: article.publishedAt ?? undefined,
  }));
  return [...pages, ...content, ...articles];
}
