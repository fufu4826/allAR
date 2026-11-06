"use client";

import dynamic from "next/dynamic";
import type { MapLandmark } from "@/components/map3d/data/landmarksData";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-[#eef2f6] text-stone-600 font-medium text-sm">
      กำลังโหลดแผนที่ 2 มิติ…
    </div>
  ),
});

export interface CommunityMapProps {
  landmarks: MapLandmark[];
  selectedId?: string | null;
  onSelectLandmark?: (slug: string) => void;
}

export default function CommunityMap({ landmarks, selectedId, onSelectLandmark }: CommunityMapProps) {
  return <LeafletMap landmarks={landmarks} selectedId={selectedId} onSelectLandmark={onSelectLandmark} />;
}
