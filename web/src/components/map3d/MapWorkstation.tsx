"use client";

import "./map3d.css";
import { useState, useRef, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Sakon3DMap from "@/components/map3d/Sakon3DMap";
import CommunityMap from "@/components/CommunityMap";
import type { MapLandmark } from "@/components/map3d/data/landmarksData";
import SiteName from "@/components/SiteName";
import SiteSlideshow from "@/components/map3d/SiteSlideshow";
import SiteIcon from "@/components/SiteIcon";

interface MapWorkstationProps {
  landmarks: MapLandmark[];
}

// iPhone Safari has no element fullscreen API, so the button is hidden there.
const noop = () => () => {};
const canFullscreen = () =>
  typeof document !== "undefined" &&
  !!document.fullscreenEnabled &&
  typeof document.documentElement.requestFullscreen === "function";

export default function MapWorkstation({ landmarks }: MapWorkstationProps) {
  const fullscreenSupported = useSyncExternalStore(noop, canFullscreen, () => false);
  const [mapMode, setMapMode] = useState<"3d" | "osm">("3d");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const workstationRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);
  const cardAnchorRef = useRef<HTMLDivElement>(null);

  const selectedItem: MapLandmark | undefined = useMemo(() => {
    return landmarks.find((lm) => lm.id === selectedSlug);
  }, [landmarks, selectedSlug]);

  const handleSelectLandmark = (slug: string) => {
    if (!slug || selectedSlug === slug) {
      setSelectedSlug(null);
    } else {
      setSelectedSlug(slug);
      const cardEl = document.getElementById(`workstation-card-${slug}`);
      const list = sidebarListRef.current;
      if (cardEl && list) {
        // Scroll only the card list; scrollIntoView would also scroll the page and push the map under the header.
        const top = cardEl.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
        list.scrollTo({ top: top - 8, behavior: "smooth" });
      }
    }
  };

  const toggleFullscreen = () => {
    if (!workstationRef.current || !canFullscreen()) return;
    if (!document.fullscreenElement) {
      workstationRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const renderCard = (site: MapLandmark, anchored: boolean) => (
    <div
      key={site.id}
      className={`mw-hud-card ${site.slides.length ? "mw-hud-card--expanded" : "animate-fade-in"} ${anchored ? "mw-hud-card--anchored" : ""}`}
    >
      <SiteSlideshow slides={site.slides} siteName={site.shortName} />
      <div className="mw-hud-header">
        <div className="mw-card-top" style={{ minWidth: 0 }}>
          <span className="mw-card-icon">
            <SiteIcon slug={site.slug} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 className="mw-hud-title"><SiteName name={site.name} /></h3>
          </div>
        </div>
        <button type="button" onClick={() => setSelectedSlug(null)} className="mw-hud-close" title="ปิดหน้าต่าง">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <p className="mw-hud-desc">{site.desc}</p>

      <div className="mw-hud-footer">
        <a href={site.gmapsUrl} target="_blank" rel="noopener noreferrer" className="mw-gps-link">
          <i className="fa-solid fa-location-dot text-rose-500"></i>
          <span>เปิดใน Google Maps</span>
          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "9px" }}></i>
        </a>
        <Link href={`/c/${site.slug}`} className="mw-hud-cta">
          <span>ชมโมเดล 3D AR</span>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: "10px" }}></i>
        </Link>
      </div>
    </div>
  );

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

          {fullscreenSupported && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="mw-icon-btn"
              title="ขยายเต็มจอ"
              aria-label="ขยายเต็มจอ"
            >
              <i className="fa-solid fa-expand"></i>
            </button>
          )}
        </div>

        {mapMode === "3d" ? (
          <div className="relative w-full h-full">
            <Sakon3DMap
              landmarks={landmarks}
              cardAnchorRef={cardAnchorRef}
              selectedId={selectedSlug}
              onSelectLandmark={handleSelectLandmark}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <CommunityMap
              landmarks={landmarks}
              selectedId={selectedSlug}
              onSelectLandmark={handleSelectLandmark}
            />
          </div>
        )}

        {/* Selected site's card. In 3D it grows out of the site's label and follows it (the scene
            positions the holder); in 2D it sits in the corner. */}
        {mapMode === "3d" ? (
          <div ref={cardAnchorRef} className="mw-card-anchor" style={{ display: "none" }}>
            {selectedItem && renderCard(selectedItem, true)}
          </div>
        ) : (
          selectedItem && renderCard(selectedItem, false)
        )}
      </div>

      {/* Right Column: Clean White Rounded Panel ("5 แหล่งเรียนรู้สำคัญ") */}
      <aside className="mw-sidebar">
        {/* Clean Header */}
        <div className="mw-sidebar-header">
          <div className="mw-sidebar-badge">
            <i className="fa-solid fa-map-location-dot"></i>
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 className="mw-sidebar-title">5 แหล่งเรียนรู้สำคัญ</h2>
            <span className="mw-sidebar-sub">5 LEARNING SITES OF SAKON NAKHON</span>
          </div>
        </div>

        {/* Scrollable 5 Cards List (No numbers, no water level badge, full description text) */}
        <div ref={sidebarListRef} className="mw-card-list">
          {landmarks.map((item) => {
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
                    <SiteIcon slug={item.slug} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="mw-card-title"><SiteName name={item.name} /></h3>
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
          <span className="mw-ready-pill">WebAR Ready</span>
        </div>
      </aside>
    </div>
  );
}
