"use client";

import "./map3d.css";
import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import Sakon3DMap from "@/components/map3d/Sakon3DMap";
import CommunityMap from "@/components/CommunityMap";
import { SAKON_LANDMARKS_3D, type Landmark3DItem } from "@/components/map3d/data/landmarksData";

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
  const workstationRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);

  const selectedItem: Landmark3DItem | undefined = useMemo(() => {
    return SAKON_LANDMARKS_3D.find((lm) => lm.id === selectedSlug);
  }, [selectedSlug]);

  const handleSelectLandmark = (slug: string) => {
    if (!slug || selectedSlug === slug) {
      setSelectedSlug(null);
    } else {
      setSelectedSlug(slug);
      const cardEl = document.getElementById(`workstation-card-${slug}`);
      if (cardEl && sidebarListRef.current) {
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
    <div ref={workstationRef} className="mw-shell">
      {/* Left Column: Framed 3D / 2D Map Viewport */}
      <div className="mw-viewport">
        {/* Top-Right Unified Mode Switcher & Fullscreen (Always visible in both 3D and 2D modes) */}
        <div className="mw-top-right">
          <div className="mw-mode-group">
            <button
              type="button"
              onClick={() => setMapMode("3d")}
              className={`mw-mode-btn ${mapMode === "3d" ? "active" : ""}`}
            >
              <i className="fa-solid fa-cubes"></i>
              <span>แผนที่ 3 มิติ</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode("osm")}
              className={`mw-mode-btn ${mapMode === "osm" ? "active" : ""}`}
            >
              <i className="fa-solid fa-map"></i>
              <span>แผนที่ 2 มิติ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="mw-icon-btn"
            title="ขยายเต็มจอ"
          >
            <i className="fa-solid fa-expand"></i>
          </button>
        </div>

        {mapMode === "3d" ? (
          <div className="relative w-full h-full">
            <Sakon3DMap
              selectedId={selectedSlug}
              onSelectLandmark={handleSelectLandmark}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <CommunityMap
              pins={pins}
              selectedId={selectedSlug}
              onSelectLandmark={handleSelectLandmark}
            />
          </div>
        )}

        {/* Floating Selected Landmark Card (Bottom-Left, works in both 3D and 2D modes) */}
        {selectedItem && (
          <div className="mw-hud-card animate-fade-in">
            <div className="mw-hud-header">
              <div className="mw-card-top" style={{ minWidth: 0 }}>
                <span className="mw-card-icon">
                  <i className={selectedItem.faIcon}></i>
                </span>
                <div style={{ minWidth: 0 }}>
                  <h3 className="mw-hud-title">{selectedItem.name}</h3>
                  <span className="mw-hud-eng">{selectedItem.englishName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlug(null)}
                className="mw-hud-close"
                title="ปิดหน้าต่าง"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <p className="mw-hud-desc">{selectedItem.desc}</p>

            <div className="mw-hud-footer">
              <a
                href={selectedItem.gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mw-gps-link"
              >
                <i className="fa-solid fa-location-dot text-rose-500"></i>
                <span>เปิดใน Google Maps</span>
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "9px" }}></i>
              </a>
              <Link href={`/c/${selectedItem.slug}`} className="mw-hud-cta">
                <span>ชมโมเดล 3D AR</span>
                <i className="fa-solid fa-arrow-right" style={{ fontSize: "10px" }}></i>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Clean White Rounded Panel ("5 แหล่งอัตลักษณ์สำคัญ") */}
      <aside className="mw-sidebar">
        {/* Clean Header */}
        <div className="mw-sidebar-header">
          <div className="mw-sidebar-badge">
            <i className="fa-solid fa-map-location-dot"></i>
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 className="mw-sidebar-title">5 แหล่งอัตลักษณ์สำคัญ</h2>
            <span className="mw-sidebar-sub">5 CULTURAL IDENTITIES OF SAKON NAKHON</span>
          </div>
        </div>

        {/* Scrollable 5 Cards List (No numbers, no water level badge, full description text) */}
        <div ref={sidebarListRef} className="mw-card-list">
          {SAKON_LANDMARKS_3D.map((item) => {
            const isSelected = selectedSlug === item.id;
            return (
              <div
                key={item.id}
                id={`workstation-card-${item.id}`}
                onClick={() => handleSelectLandmark(item.id)}
                className={`mw-card ${isSelected ? "active" : ""}`}
              >
                {/* Row 1: Icon, Name, English Name */}
                <div className="mw-card-top">
                  <span className="mw-card-icon">
                    <i className={item.faIcon}></i>
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="mw-card-title">{item.name}</h3>
                    <span className="mw-card-eng">{item.englishName}</span>
                  </div>
                </div>

                {/* Row 2: Full Uncut Description */}
                <p className="mw-card-desc">{item.desc}</p>

                {/* Row 3: Clean Footer */}
                <div className="mw-card-footer">
                  <a
                    href={item.gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mw-gps-link truncate"
                    title="เปิดใน Google Maps"
                  >
                    <i className="fa-solid fa-location-dot text-rose-500"></i>
                    <span>เปิดใน Google Maps</span>
                    <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "9px" }}></i>
                  </a>

                  <Link
                    href={`/c/${item.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mw-ar-btn"
                  >
                    <span>สำรวจ 3D AR</span>
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: "9px" }}></i>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Minimal Reference Footer */}
        <div className="mw-sidebar-footer">
          <span className="flex items-center gap-1.5 truncate">
            <i className="fa-solid fa-earth-asia text-brand"></i>
            <span>ข้อมูลภูมิสัณฐาน: มิตรเอิร์ธ (MitrEarth)</span>
          </span>
          <span className="mw-ready-pill">WebAR Ready</span>
        </div>
      </aside>
    </div>
  );
}
