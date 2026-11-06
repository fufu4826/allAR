"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import CommunityMap from "@/components/CommunityMap";
import Sakon3DMap from "@/components/map3d/Sakon3DMap";
import { SAKON_LANDMARKS_3D } from "@/components/map3d/data/landmarksData";
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

interface InteractiveMapSectionProps {
  pins: Pin[];
}

export default function InteractiveMapSection({ pins }: InteractiveMapSectionProps) {
  const [mapMode, setMapMode] = useState<"3d" | "osm">("3d");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSelectLandmark = (slug: string) => {
    if (selectedSlug === slug) {
      // Toggle off to overview
      setSelectedSlug(null);
    } else {
      setSelectedSlug(slug);
      // Auto-scroll the matching card in the sidebar into view
      const cardEl = document.getElementById(`identity-card-${slug}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  return (
    <section id="identity-map" className="section identity-map-section">
      <div className="container">
        <div className="section-header text-center max-w-3xl mx-auto mb-8">
          <span className="section-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-brand font-semibold text-xs tracking-wider uppercase">
            <i className="fa-solid fa-map-location-dot"></i> Interactive Province Map &amp; 3D Heritage
          </span>
          <h2 className="section-title text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mt-2">
            แผนที่มรดกวัฒนธรรม 5 แหล่งอัตลักษณ์สำคัญ
          </h2>
          <p className="section-subtitle text-slate-600 text-sm md:text-base mt-2">
            แผนที่สามมิติผสานภูมิสารสนเทศ แสดงพิกัดจริงตามภูมิศาสตร์ 18 อำเภอ ทะเลสาบหนองหาร แนวเทือกเขาภูพาน และโครงข่ายทางหลวงเชื่อมโยง 5 ชุมชน
          </p>
        </div>

        <div className="map-showcase-card bg-white rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-200" ref={containerRef}>
          {/* Top Map Toolbar */}
          <div className="map-toolbar flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="map-toolbar-status flex items-center gap-2 text-xs md:text-sm text-slate-700">
              <span className="pulse-dot"></span>
              <span className="map-status-text">
                <strong>สกลนคร (Sakon Nakhon)</strong> • แผนที่ 3 มิติ Interactive 5 แหล่งอัตลักษณ์
              </span>
            </div>

            <div className="map-toolbar-actions flex items-center flex-wrap gap-2">
              <Link
                href="/map"
                className="btn btn-primary btn-sm shadow-md"
                title="เปิดหน้าแผนที่ 3 มิติเต็มรูปแบบในหน้าใหม่"
              >
                <i className="fa-solid fa-up-right-from-square"></i> เปิดหน้าแผนที่ 3D เต็มจอ
              </Link>
              <button
                type="button"
                className={`btn btn-sm ${mapMode === "3d" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setMapMode("3d")}
              >
                <i className="fa-solid fa-cubes"></i> 3D
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mapMode === "osm" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setMapMode("osm")}
              >
                <i className="fa-solid fa-map"></i> แผนที่จริง (OSM)
              </button>
              <a
                href="/brand/sakon_nakhon_5identities_map.png"
                download="แผนที่5แหล่งอัตลักษณ์_สกลนคร.png"
                className="btn btn-outline btn-sm"
              >
                <i className="fa-solid fa-download"></i> ดาวน์โหลด HD
              </a>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                id="btnToggleMapFullscreen"
                title="ขยายเต็มจอ"
                onClick={toggleFullscreen}
              >
                <i className="fa-solid fa-expand"></i> ขยายแผนที่
              </button>
            </div>
          </div>

          {/* Main Map Display Area */}
          {mapMode === "3d" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: 3D Map Canvas */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950 flex-1 min-h-[580px] lg:min-h-[620px]">
                  <Sakon3DMap
                    selectedId={selectedSlug}
                    onSelectLandmark={handleSelectLandmark}
                  />
                </div>
              </div>

              {/* Right Column: 5 Cultural Identities Sidebar Panel (Integrated from Image 2) */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-slate-50/70 rounded-2xl p-4 border border-slate-200">
                <div className="pb-3 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-brand flex items-center gap-1.5">
                      <i className="fa-solid fa-layer-group"></i> 5 CULTURAL IDENTITIES
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                      5 แหล่งอัตลักษณ์สำคัญ
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    จ.สกลนคร
                  </span>
                </div>

                {/* Scrollable list of 5 identities */}
                <div
                  ref={sidebarListRef}
                  className="flex flex-col gap-3 mt-3 overflow-y-auto max-h-[540px] pr-1.5 scroll-smooth"
                >
                  {SAKON_LANDMARKS_3D.map((item) => {
                    const isSelected = selectedSlug === item.id;
                    return (
                      <div
                        key={item.id}
                        id={`identity-card-${item.id}`}
                        onClick={() => handleSelectLandmark(item.id)}
                        className={`group cursor-pointer rounded-xl p-3.5 border transition-all text-left ${
                          isSelected
                            ? "bg-white border-brand ring-2 ring-brand/30 shadow-md transform -translate-y-0.5"
                            : "bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        {/* Header: Number Badge, Titles, Icon */}
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? "bg-brand text-white shadow-sm"
                                : "bg-orange-100 text-brand group-hover:bg-brand group-hover:text-white"
                            }`}
                          >
                            {item.number}
                          </span>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {item.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {item.englishName}
                            </span>
                          </div>

                          <span className="text-base p-1.5 rounded-lg bg-slate-100/80 text-slate-700 shrink-0">
                            {item.badgeIcon}
                          </span>
                        </div>

                        {/* MitrEarth Geographic Subtitle */}
                        <div className="mt-2 text-[11px] text-amber-900 bg-amber-50/80 rounded-lg px-2.5 py-1 border border-amber-200/60 flex items-center gap-1.5">
                          <i className="fa-solid fa-mountain text-amber-600 text-[10px] shrink-0"></i>
                          <span className="line-clamp-1">{item.sub}</span>
                        </div>

                        {/* Concise Description */}
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>

                        {/* Footer Actions */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            WebAR Ready
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLandmark(item.id);
                              }}
                              className="text-[11px] font-semibold text-slate-700 hover:text-brand px-2 py-1 rounded-lg hover:bg-slate-100 transition flex items-center gap-1"
                            >
                              <i className="fa-solid fa-crosshairs text-[10px]"></i> ซูม 3D
                            </button>
                            <Link
                              href={`/c/${item.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-semibold bg-brand text-white px-2.5 py-1 rounded-lg shadow-sm hover:bg-brand-dark transition flex items-center gap-1"
                            >
                              <span>ชม 3D</span>
                              <i className="fa-solid fa-arrow-right text-[9px]"></i>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* OpenStreetMap View */
            <div style={{ width: "100%", height: "580px", borderRadius: "16px", overflow: "hidden" }}>
              <CommunityMap pins={pins} />
            </div>
          )}

          {/* Reference Source Footer Badge */}
          <div
            className="map-source-footer mt-5 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2"
          >
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-earth-asia text-orange-500"></i>
              <strong>{mitrEarthInfo.title}</strong> {mitrEarthInfo.source}
            </span>
            <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group"></i> {mitrEarthInfo.sub}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
