"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-[#eef2f6] text-stone-600 font-medium text-sm">
      กำลังโหลดแผนที่ 2 มิติ…
    </div>
  ),
});

export interface CommunityMapProps {
  pins: MapPin[];
  selectedId?: string | null;
  onSelectLandmark?: (slug: string) => void;
}

export default function CommunityMap({ pins, selectedId, onSelectLandmark }: CommunityMapProps) {
  return <LeafletMap pins={pins} selectedId={selectedId} onSelectLandmark={onSelectLandmark} />;
}
