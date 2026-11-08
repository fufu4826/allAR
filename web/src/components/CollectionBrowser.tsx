"use client";

import { useState } from "react";
import Link from "next/link";

type Collection = { id: string; name: string; description: string };
type Item = { id: string; collectionId: string; name: string; thumbnail: string | null; model?: string | null };

// Model browser on every learning-site page: categories in a side menu with counts, the chosen
// category's story and its models on the right. On phones the menu becomes a row that scrolls
// sideways. Styled by collection-browser.css in each site's theme colours.
export default function CollectionBrowser({
  communitySlug,
  collections,
  items,
}: {
  communitySlug: string;
  collections: Collection[];
  items: Item[];
}) {
  const [selectedId, setSelectedId] = useState(collections[0]?.id ?? "");
  const [expanded, setExpanded] = useState(false);

  if (collections.length === 0 || items.length === 0) {
    return <p className="model-status">ยังไม่มีข้อมูลหมวดหมู่โมเดลสำหรับแหล่งเรียนรู้นี้</p>;
  }

  const shortName = (name: string) => name.replace("แหล่งเรียนรู้", "").trim();
  const countOf = (id: string) => items.filter((item) => item.collectionId === id).length;
  const active = collections.find((c) => c.id === selectedId) ?? collections[0];
  const activeItems = items.filter((item) => item.collectionId === active.id);
  const modelCount = activeItems.filter((item) => item.model).length;

  return (
    <div className="cb">
      <nav className="cb-menu" aria-label="หมวดหมู่โมเดล">
        <p className="cb-menu-title">
          หมวดหมู่ <span>{collections.length}</span>
        </p>
        <ul role="tablist">
          {collections.map((col) => {
            const isActive = col.id === active.id;
            return (
              <li key={col.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="cb-panel"
                  className={`cb-tab ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(col.id);
                    setExpanded(false);
                  }}
                >
                  <span className="cb-tab-name">{shortName(col.name)}</span>
                  <span className="cb-tab-count">{countOf(col.id)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="cb-panel" id="cb-panel" role="tabpanel" aria-live="polite">
        <header className="cb-head">
          <div>
            <h3>{shortName(active.name)}</h3>
            <p className="cb-meta">
              {activeItems.length} รายการ{modelCount > 0 && ` · มีโมเดล 3D ${modelCount}`}
            </p>
          </div>
        </header>
        {active.description && (
          <div className="cb-desc">
            <p className={expanded ? "" : "clamped"}>{active.description}</p>
            {active.description.length > 160 && (
              <button type="button" className="cb-more" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "ย่อ" : "อ่านต่อ"}
              </button>
            )}
          </div>
        )}

        <div className="cb-grid">
          {activeItems.map((item) => (
            <Link key={item.id} href={`/c/${communitySlug}/${item.id}`} className="cb-card">
              <span className="cb-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail || "/brand/snru-logo.png"} alt={item.name} loading="lazy" />
                {item.model && (
                  <span className="cb-badge">
                    <i className="fa-solid fa-cube" aria-hidden="true"></i> 3D · AR
                  </span>
                )}
              </span>
              <span className="cb-body">
                <strong>{item.name}</strong>
                <small>
                  {item.model ? "ดูโมเดล" : "ดูรายละเอียด"} <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
