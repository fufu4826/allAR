"use client";

import { useState } from "react";

interface GalleryItem {
  id: string;
  imagePath: string;
  caption: string;
  category: string;
}

interface GallerySectionProps {
  images: GalleryItem[];
}

export default function GallerySection({ images }: GallerySectionProps) {
  const [filter, setFilter] = useState("all");
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  const filtered = filter === "all" ? images : images.filter((img) => img.category === filter);

  return (
    <section id="gallery" className="section gallery">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">
            <i className="fa-solid fa-images"></i> Fieldwork & Activity Gallery
          </span>
          <h2 className="section-title">แกลเลอรีภาพกิจกรรมและบรรยากาศการทำงาน</h2>
          <p className="section-subtitle">
            ภาพถ่ายบรรยากาศการลงพื้นที่จริง การสแกนวัตถุ และการทำงานร่วมกับหน่วยงานและชุมชน
          </p>
        </div>

        {/* Gallery Filters */}
        <div className="gallery-filters">
          <button
            type="button"
            className={`gallery-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            className={`gallery-btn ${filter === "fieldwork" ? "active" : ""}`}
            onClick={() => setFilter("fieldwork")}
          >
            ลงพื้นที่ชุมชน
          </button>
          <button
            type="button"
            className={`gallery-btn ${filter === "modeling" ? "active" : ""}`}
            onClick={() => setFilter("modeling")}
          >
            การสร้างโมเดล 3D
          </button>
          <button
            type="button"
            className={`gallery-btn ${filter === "testing" ? "active" : ""}`}
            onClick={() => setFilter("testing")}
          >
            ทดสอบระบบ AR
          </button>
        </div>

        {/* Gallery Grid */}
        {filtered.length > 0 ? (
          <div className="gallery-grid">
            {filtered.map((img) => (
              <div
                key={img.id}
                className="gallery-item"
                data-category={img.category}
                onClick={() => setActiveImage(img)}
                style={{ cursor: "pointer" }}
              >
                <div
                  className="gallery-img-box"
                  style={{
                    backgroundImage: `url(${img.imagePath})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="gallery-overlay">
                    <i className="fa-solid fa-maximize"></i>
                    <h4>{img.caption}</h4>
                    <p>
                      {img.category === "fieldwork"
                        ? "ลงพื้นที่ชุมชน"
                        : img.category === "modeling"
                        ? "การสร้างโมเดล 3D"
                        : "ทดสอบระบบ AR"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--white)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--slate-300)",
              color: "var(--slate-500)",
            }}
          >
            <i className="fa-regular fa-images" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }}></i>
            <p>ยังไม่มีรูปภาพในหมวดหมู่นี้</p>
          </div>
        )}

        {/* Lightbox Modal */}
        {activeImage && (
          <div
            className="modal-backdrop active"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "grid",
              placeItems: "center",
              padding: "20px",
            }}
            onClick={() => setActiveImage(null)}
          >
            <div
              style={{
                maxWidth: "800px",
                width: "100%",
                background: "white",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.imagePath}
                alt={activeImage.caption}
                style={{ width: "100%", maxHeight: "65vh", objectFit: "contain", display: "block", background: "#111" }}
              />
              <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{activeImage.caption}</h4>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--slate-500)" }}>
                    {activeImage.category === "fieldwork"
                      ? "ลงพื้นที่ชุมชน"
                      : activeImage.category === "modeling"
                      ? "การสร้างโมเดล 3D"
                      : "ทดสอบระบบ AR"}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveImage(null)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
