"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import Sakon3DMap from "@/components/map3d/Sakon3DMap";
import CommunityMap from "@/components/CommunityMap";
import { SAKON_LANDMARKS_3D, type Landmark3DItem } from "@/components/map3d/data/landmarksData";
import { mitrEarthInfo } from "@/content/site";

interface Pin {
  slug: string;
  number: number;
  name: string;
  location: string;
  position: [number, number];
  color: string;
  itemCount: number;
  placeholder: boolean;
}

interface MapWorkstationProps {
  pins: Pin[];
}

export default function MapWorkstation({ pins }: MapWorkstationProps) {
  const [mapMode, setMapMode] = useState<"3d" | "osm">("3d");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const workstationRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);

  const selectedItem: Landmark3DItem | undefined = useMemo(() => {
    return SAKON_LANDMARKS_3D.find((lm) => lm.id === selectedSlug);
  }, [selectedSlug]);

  const filteredLandmarks = useMemo(() => {
    if (categoryFilter === "all") return SAKON_LANDMARKS_3D;
    return SAKON_LANDMARKS_3D.filter((lm) => lm.category === categoryFilter);
  }, [categoryFilter]);

  const handleSelectLandmark = (slug: string) => {
    if (selectedSlug === slug) {
      setSelectedSlug(null);
    } else {
      setSelectedSlug(slug);
      const cardEl = document.getElementById(`workstation-card-${slug}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  const toggleFullscreen = () => {
    if (!workstationRef.current) return;
    if (!document.fullscreenElement) {
      workstationRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={workstationRef}
      className="relative w-full bg-[#080e1a] text-slate-100 flex flex-col overflow-hidden select-none"
      style={{ minHeight: "calc(100vh - 110px)" }}
    >
      {/* 1. Top Workstation Navigation Bar */}
      <header className="bg-[#0b1325]/95 border-b border-slate-800/90 px-4 py-2.5 flex items-center justify-between gap-4 z-30 backdrop-blur-md shadow-md">
        {/* Left: Brand & Back to Home */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700/70 transition shadow-sm"
          >
            <i className="fa-solid fa-arrow-left text-[11px]"></i>
            <span>หน้าหลัก</span>
          </Link>
          <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-sm md:text-base font-bold tracking-wide" style={{ color: "#ffffff" }}>
                แผนที่ 3 มิติ 5 แหล่งอัตลักษณ์สกลนคร
              </h1>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 hidden md:inline-block">
                Digital Twin 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              ภูมิสารสนเทศ 3D พิกัดจริง 18 อำเภอ ทะเลสาบหนองหาร แนวเทือกเขาภูพาน และโครงข่ายทางหลวง
            </p>
          </div>
        </div>

        {/* Right: Map Actions Toolbar */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher: 3D vs OSM */}
          <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMapMode("3d")}
              className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 ${
                mapMode === "3d" ? "bg-brand text-white shadow-md shadow-brand/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <i className="fa-solid fa-cubes"></i>
              <span>3D</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode("osm")}
              className={`px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 ${
                mapMode === "osm" ? "bg-brand text-white shadow-md shadow-brand/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <i className="fa-solid fa-map"></i>
              <span>OSM</span>
            </button>
          </div>

          <a
            href="/brand/sakon_nakhon_5identities_map.png"
            download="แผนที่5แหล่งอัตลักษณ์_สกลนคร.png"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            title="ดาวน์โหลดภาพแผนที่ความละเอียดสูง"
          >
            <i className="fa-solid fa-download"></i>
            <span className="hidden sm:inline">ดาวน์โหลด HD</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition shadow-sm"
            title="ขยายเต็มจอ"
          >
            <i className="fa-solid fa-expand"></i>
          </button>

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 shadow-sm ${
              sidebarOpen
                ? "bg-brand/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title={sidebarOpen ? "ซ่อนแถบรายการ" : "แสดงแถบรายการ 5 อัตลักษณ์"}
          >
            <i className="fa-solid fa-layer-group"></i>
            <span className="hidden md:inline">{sidebarOpen ? "ซ่อนแถบ" : "แสดงแถบ"}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workstation Body */}
      <div className="relative flex-1 flex flex-row items-stretch overflow-hidden">
        {/* Left / Center Viewport: 3D Map / OSM View */}
        <div className="relative flex-1 h-full min-h-[660px] bg-slate-950 flex flex-col">
          {mapMode === "3d" ? (
            <div className="relative w-full h-full flex-1">
              <Sakon3DMap
                selectedId={selectedSlug}
                onSelectLandmark={handleSelectLandmark}
                className="w-full h-full min-h-[660px]"
              />

              {/* Floating Landmark Quick Jump Dock (Floating at Bottom-Center of 3D Canvas) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl text-xs text-white">
                <button
                  type="button"
                  onClick={() => setSelectedSlug(null)}
                  className={`px-3 py-1.5 rounded-xl transition font-medium flex items-center gap-1.5 ${
                    !selectedSlug
                      ? "bg-brand text-white shadow-md shadow-brand/40"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <i className="fa-solid fa-globe text-[11px]"></i>
                  <span>ภาพรวม</span>
                </button>
                {SAKON_LANDMARKS_3D.map((lm) => (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => handleSelectLandmark(lm.id)}
                    className={`px-2.5 py-1.5 rounded-xl transition font-medium flex items-center gap-1.5 ${
                      selectedSlug === lm.id
                        ? "bg-brand text-white shadow-md shadow-brand/40"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <i className={`${lm.faIcon} text-amber-400 text-xs`}></i>
                    <span>{lm.number}. {lm.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Floating Active Landmark Detail HUD (Bottom-Left) */}
              {selectedItem && (
                <div className="absolute bottom-16 left-4 z-30 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 shadow-2xl text-white animate-fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shadow-md shadow-brand/40">
                        {selectedItem.number}
                      </span>
                      <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm shadow-sm">
                        <i className={selectedItem.faIcon}></i>
                      </span>
                      <div>
                        <h3 className="text-sm font-bold leading-tight" style={{ color: "#ffffff" }}>
                          {selectedItem.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400">{selectedItem.englishName}</span>
                          {selectedItem.dms && (
                            <span className="text-[10px] text-amber-300/90 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                              {selectedItem.dms}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                      title="ปิดหน้าต่างย่อ"
                    >
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {selectedItem.desc}
                  </p>

                  <div className="mt-2.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <i className="fa-solid fa-mountain text-amber-400 text-[10px]"></i>
                    <span className="line-clamp-1">{selectedItem.sub}</span>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSlug(null)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <i className="fa-solid fa-rotate-left text-[10px]"></i> รีเซ็ต
                      </button>
                      <a
                        href={selectedItem.gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition font-medium"
                        title="เปิดดูตำแหน่งจริงบน Google Maps"
                      >
                        <i className="fa-solid fa-map-location-dot text-rose-400 text-[11px]"></i>
                        <span>Google Maps</span>
                      </a>
                    </div>
                    <Link
                      href={`/c/${selectedItem.slug}`}
                      className="btn btn-sm bg-brand hover:bg-brand-dark text-white text-xs px-3.5 py-1.5 rounded-xl shadow-md font-semibold flex items-center gap-1.5"
                    >
                      <span>ชมโมเดล 3D AR</span>
                      <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full min-h-[660px]">
              <CommunityMap pins={pins} />
            </div>
          )}
        </div>

        {/* Right Sidebar Panel: 5 Cultural Identities Cards (From Illustrated Map) */}
        {sidebarOpen && (
          <aside className="w-full md:w-[380px] lg:w-[410px] bg-[#0c1427] border-l border-slate-800/90 flex flex-col shrink-0 z-20 shadow-2xl">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-800/90 bg-[#080e1a]/80">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-brand flex items-center gap-1.5">
                    <i className="fa-solid fa-landmark"></i> 5 CULTURAL IDENTITIES
                  </span>
                  <h2 className="text-base font-bold leading-tight mt-0.5" style={{ color: "#ffffff" }}>
                    5 แหล่งอัตลักษณ์สำคัญ
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                  จ.สกลนคร
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded-xl transition font-semibold ${
                    categoryFilter === "all"
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  ทั้งหมด (5)
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("ชุมชน")}
                  className={`px-2.5 py-1 rounded-xl transition font-semibold ${
                    categoryFilter === "ชุมชน"
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  ชุมชน (2)
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("วัด")}
                  className={`px-2.5 py-1 rounded-xl transition font-semibold ${
                    categoryFilter === "วัด"
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  วัด (2)
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("หน่วยงาน")}
                  className={`px-2.5 py-1 rounded-xl transition font-semibold ${
                    categoryFilter === "หน่วยงาน"
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  หน่วยงาน (1)
                </button>
              </div>
            </div>

            {/* Scrollable Cards List */}
            <div
              ref={sidebarListRef}
              className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 scroll-smooth"
            >
              {filteredLandmarks.map((item) => {
                const isSelected = selectedSlug === item.id;
                return (
                  <div
                    key={item.id}
                    id={`workstation-card-${item.id}`}
                    onClick={() => handleSelectLandmark(item.id)}
                    className={`group cursor-pointer rounded-2xl p-4 border transition-all text-left ${
                      isSelected
                        ? "bg-slate-850 border-brand ring-2 ring-brand/50 shadow-xl shadow-orange-500/10 transform -translate-y-0.5"
                        : "bg-slate-900/70 hover:bg-slate-850/80 border-slate-800/80 hover:border-slate-700"
                    }`}
                    style={{ backgroundColor: isSelected ? "#162035" : "#0f172a" }}
                  >
                    {/* Header: Number Badge, Name, Icon */}
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? "bg-brand text-white shadow-md shadow-brand/40"
                            : "bg-slate-800 text-slate-300 group-hover:bg-brand group-hover:text-white"
                        }`}
                      >
                        {item.number}
                      </span>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold leading-tight" style={{ color: "#ffffff" }}>
                          {item.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          {item.englishName}
                        </span>
                      </div>

                      <span className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-amber-400 text-sm shrink-0 group-hover:border-amber-500/50 transition">
                        <i className={item.faIcon}></i>
                      </span>
                    </div>

                    {/* MitrEarth Geographic Subtitle */}
                    <div className="mt-2.5 text-[11px] text-amber-300 bg-amber-500/10 rounded-xl px-3 py-1.5 border border-amber-500/25 flex items-center gap-1.5">
                      <i className="fa-solid fa-mountain text-amber-400 text-[10px] shrink-0"></i>
                      <span className="line-clamp-1">{item.sub}</span>
                    </div>

                    {/* Google Maps Coordinates & Location */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                      <span className="flex items-center gap-1.5 text-slate-400 truncate max-w-[210px]" title={item.location}>
                        <i className="fa-solid fa-location-dot text-rose-500 text-[10px] shrink-0"></i>
                        <span className="truncate font-mono text-[10px] text-amber-200/90">{item.dms || item.location}</span>
                      </span>
                      <a
                        href={item.gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0 font-medium transition"
                        title="เปิดดูพิกัดจริงบน Google Maps"
                      >
                        <i className="fa-solid fa-map-pin text-[10px] text-sky-400"></i>
                        <span>GPS จริง</span>
                        <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                      </a>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {item.desc}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        WebAR Ready
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLandmark(item.id);
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
                            isSelected
                              ? "bg-brand/20 text-brand border border-brand/40"
                              : "text-slate-300 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          <i className="fa-solid fa-crosshairs text-[10px]"></i> ซูม 3D
                        </button>
                        <Link
                          href={`/c/${item.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold bg-brand hover:bg-brand-dark text-white px-3 py-1 rounded-xl shadow-sm transition flex items-center gap-1"
                        >
                          <span>เปิด AR</span>
                          <i className="fa-solid fa-arrow-right text-[9px]"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Reference Footer */}
            <div className="p-3 bg-[#080e1a] border-t border-slate-800/90 text-[11px] text-slate-400 flex items-center gap-2">
              <i className="fa-solid fa-earth-asia text-amber-400 shrink-0"></i>
              <span className="line-clamp-1">
                {mitrEarthInfo.title} • {mitrEarthInfo.source}
              </span>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
