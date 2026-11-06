"use client";

import dynamic from "next/dynamic";
import type { Sakon3DMapCanvasProps } from "./Sakon3DMapCanvas";

const Sakon3DMapCanvas = dynamic(() => import("./Sakon3DMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full min-h-[580px] rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-white shadow-xl">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-medium text-slate-300">กำลังโหลดแผนที่ 3 มิติจังหวัดสกลนคร…</p>
    </div>
  ),
});

export default function Sakon3DMap(props: Sakon3DMapCanvasProps) {
  return <Sakon3DMapCanvas {...props} />;
}
