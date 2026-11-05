"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "./LeafletMap";

// Leaflet ใช้ window จึงต้องโหลดฝั่งเบราว์เซอร์เท่านั้น
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">กำลังโหลดแผนที่…</div>,
});

export default function CommunityMap({ pins }: { pins: MapPin[] }) {
  return <LeafletMap pins={pins} />;
}
