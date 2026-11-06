"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import CommunityMap from "@/components/CommunityMap";
import Sakon3DMap from "@/components/map3d/Sakon3DMap";
import { mapHighlights, mitrEarthInfo } from "@/content/site";

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
  const [mapMode, setMapMode] = useState<"illustrated" | "osm" | "3d">("3d");
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <section id="identity-map" className="section identity-map-section">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">
            <i className="fa-solid fa-map-location-dot"></i> Interactive Province Map
          </span>
          <h2 className="section-title">แผนที่มรดกวัฒนธรรม 5 แหล่งอัตลักษณ์สำคัญ</h2>
          <p className="section-subtitle">
            แผนที่สามมิติผสานศิลปะภาพวาดนำเที่ยว แสดงพิกัดจริงตามภูมิศาสตร์ 18 อำเภอ ทะเลสาบหนองหาร แนวเทือกเขาภูพาน และโครงข่ายทางหลวงเชื่อมโยง 5 ชุมชน
          </p>
        </div>

        <div className="map-showcase-card" ref={containerRef}>
          {/* Top Map Toolbar */}
          <div className="map-toolbar">
            <div className="map-toolbar-status">
              <span className="pulse-dot"></span>
              <span className="map-status-text">
                <strong>สกลนคร (Sakon Nakhon)</strong> • พิกัด 5 แหล่งอัตลักษณ์ตามแผนที่จริง
              </span>
            </div>
            <div className="map-toolbar-actions">
              <button
                type="button"
                className={`btn btn-sm ${mapMode === "illustrated" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setMapMode("illustrated")}
              >
                <i className="fa-solid fa-image"></i> แผนที่ภาพวาด
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mapMode === "osm" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setMapMode("osm")}
              >
                <i className="fa-solid fa-map"></i> แผนที่จริง (OSM)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mapMode === "3d" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setMapMode("3d")}
              >
                <i className="fa-solid fa-cubes"></i> แผนที่ 3 มิติ (3D)
              </button>
              <a
                href="/brand/sakon_nakhon_5identities_map.png"
                download="แผนที่5แหล่งอัตลักษณ์_สกลนคร.png"
                className="btn btn-primary btn-sm"
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

          {/* Main Map Display */}
          <div className="map-image-frame" id="mapFrame" style={{ minHeight: "450px" }}>
            {mapMode === "illustrated" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/brand/sakon_nakhon_5identities_map.webp"
                alt="แผนที่ท่องเที่ยว 5 แหล่งอัตลักษณ์สำคัญ จังหวัดสกลนคร"
                className="map-master-img"
                id="masterMapImg"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "12px" }}
              />
            )}
            {mapMode === "osm" && (
              <div style={{ width: "100%", height: "500px", borderRadius: "12px", overflow: "hidden" }}>
                <CommunityMap pins={pins} />
              </div>
            )}
            {mapMode === "3d" && (
              <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden" }}>
                <Sakon3DMap />
              </div>
            )}
          </div>

          {/* 5 Cultural Highlights Grid with MitrEarth Geographic Data */}
          <div className="map-highlights-grid">
            {mapHighlights.map((hl) => (
              <div key={hl.slug} className="map-highlight-item" data-id={hl.slug}>
                <div className="hl-badge">
                  <span className="pin-badge">{hl.number}</span>
                </div>
                <div className="hl-body">
                  <div className="hl-title">{hl.title}</div>
                  <div className="hl-sub">
                    <i className="fa-solid fa-mountain"></i> {hl.sub}
                  </div>
                  <p className="hl-desc">
                    <strong>ลักษณะภูมิศาสตร์ (มิตรเอิร์ธ):</strong> {hl.desc}
                  </p>
                </div>
                <Link href={`/c/${hl.slug}`} className="hl-btn" title="ชมโมเดล 3D">
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            ))}
          </div>

          {/* Reference Source Footer Badge */}
          <div
            className="map-source-footer"
            style={{
              marginTop: "20px",
              padding: "12px 18px",
              background: "var(--warm-white)",
              border: "1px dashed var(--slate-300)",
              borderRadius: "12px",
              fontSize: "0.85rem",
              color: "var(--slate-600)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>
              <i className="fa-solid fa-earth-asia" style={{ color: "var(--orange-500)" }}></i>{" "}
              <strong>{mitrEarthInfo.title}</strong> {mitrEarthInfo.source}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--slate-500)" }}>
              <i className="fa-solid fa-layer-group"></i> {mitrEarthInfo.sub}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
