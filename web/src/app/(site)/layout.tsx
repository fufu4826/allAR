import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";
import "./heritage.css";
import "./community.css";
import "./collection-browser.css";
import "./phuphan-theme.css";
import "./cover.css";
import "./phone.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { shareImage, siteOpenGraph } from "@/content/seo";

import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import WelcomeCover from "@/components/WelcomeCover";
import InAppBrowserBanner from "@/components/InAppBrowserBanner";
import { resolveSiteUrl } from "@/lib/siteUrl";

// Share previews (LINE, Facebook, Discord...) need absolute image URLs. The public domain differs
// between the preview tunnel and the university server, so build it from the request.
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const base = resolveSiteUrl(process.env.SITE_URL, {
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });
  return { metadataBase: new URL(base), openGraph: { ...siteOpenGraph, images: [shareImage] }, twitter: { images: [shareImage.url] } };
}

// Marks every site page as request-time, which the host-based metadata above requires.
async function RequestTimeMarker() {
  await connection();
  return null;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeCover />
      <SiteNavbar />
      <main className="site-main">{children}</main>
      <SiteFooter />
      <InAppBrowserBanner />
      <Suspense>
        <RequestTimeMarker />
      </Suspense>
    </>
  );
}
