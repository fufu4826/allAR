import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";
import "./heritage.css";
import "./community.css";
import "./cover.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { shareImage, siteOpenGraph } from "@/content/seo";

import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import WelcomeCover from "@/components/WelcomeCover";

// Share previews (LINE, Facebook, Discord...) need absolute image URLs. The public domain differs
// between the preview tunnel and the university server, so build it from the request.
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0].trim() || h.get("host");
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
  if (!host || !/^[a-z0-9.:-]+$/i.test(host)) return {};
  return { metadataBase: new URL(`${proto}://${host}`), openGraph: { ...siteOpenGraph, images: [shareImage] }, twitter: { images: [shareImage.url] } };
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
      <Suspense>
        <RequestTimeMarker />
      </Suspense>
    </>
  );
}
