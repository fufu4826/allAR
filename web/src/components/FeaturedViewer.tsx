"use client";

import { useState } from "react";
import Link from "next/link";
import ModelViewer from "@/components/ModelViewer";

interface FeaturedItem {
  id: string;
  name: string;
  description: string;
  model: string | null;
  thumbnail: string | null;
  communitySlug: string;
  communityName: string;
}

interface FeaturedViewerProps {
  items: FeaturedItem[];
}

export default function FeaturedViewer({ items }: FeaturedViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  if (!items.length) return null;

  const current = items[selectedIndex] || items[0];

  return (
    <div className="featured-viewer-box" style={{ marginTop: "3rem" }}>
      <div className="section-header" style={{ marginBottom: "1.5rem" }}>
        <span className="section-badge">
          <i className="fa-solid fa-vr-cardboard"></i> Featured 3D Models
        </span>
        <h3 className="section-title" style={{ fontSize: "1.6rem" }}>
          โมเดล 3D และวัตถุเด่นประจำโครงการ
        </h3>
        <p className="section-subtitle">
          เลือกสัมผัสวัตถุพิพิธภัณฑ์ผ่านโมเดล 3 มิติ
        </p>
      </div>

      {/* Tabs */}
      <div
        className="model-tabs"
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          justifyContent: "center",
        }}
      >
        {items.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            className={`tab-btn ${idx === selectedIndex ? "active" : ""}`}
            onClick={() => setSelectedIndex(idx)}
            style={{
              padding: "8px 16px",
              borderRadius: "9999px",
              border: "1px solid var(--slate-300)",
              background: idx === selectedIndex ? "var(--orange-600)" : "var(--white)",
              color: idx === selectedIndex ? "white" : "var(--slate-700)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.85rem",
              transition: "var(--transition)",
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Viewer Container */}
      <div
        className="viewer-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
          alignItems: "center",
          background: "var(--white)",
          padding: "24px",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--slate-200)",
        }}
      >
        <div style={{ width: "100%", height: "420px", position: "relative" }}>
          {current.model ? (
            <ModelViewer
              src={current.model}
              poster={current.thumbnail}
              alt={current.name}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
                background: "var(--slate-100)",
                borderRadius: "var(--radius-md)",
                color: "var(--slate-500)",
              }}
            >
              ไม่มีโมเดล 3D สำหรับชิ้นนี้
            </div>
          )}
        </div>

        <div className="viewer-info" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span
            style={{
              alignSelf: "flex-start",
              padding: "4px 12px",
              background: "var(--orange-50)",
              color: "var(--orange-600)",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-location-dot"></i> {current.communityName}
          </span>
          <h4 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--slate-900)" }}>
            {current.name}
          </h4>
          <p style={{ color: "var(--slate-600)", fontSize: "0.95rem", lineHeight: 1.7, margin: 0 }}>
            {current.description}
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
            <Link
              href={`/c/${current.communitySlug}/${current.id}`}
              className="btn btn-primary"
              style={{ fontSize: "0.85rem", padding: "10px 18px" }}
            >
              <i className="fa-solid fa-cube"></i> ดูใน AR / รายละเอียด
            </Link>
            <Link
              href={`/c/${current.communitySlug}`}
              className="btn btn-outline"
              style={{ fontSize: "0.85rem", padding: "10px 18px" }}
            >
              ไปยังชุมชน <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
