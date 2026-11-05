"use client";

import { useState } from "react";
import Link from "next/link";

interface CollectionItem {
  id: string;
  collectionId: string;
  name: string;
  thumbnail: string | null;
}

interface Collection {
  id: string;
  name: string;
  description: string;
}

interface CommunityCollectionTabsProps {
  communitySlug: string;
  collections: Collection[];
  items: CollectionItem[];
}

export default function CommunityCollectionTabs({
  communitySlug,
  collections,
  items,
}: CommunityCollectionTabsProps) {
  const [selectedColId, setSelectedColId] = useState<string>(
    collections.length > 0 ? collections[0].id : ""
  );

  if (collections.length === 0 || items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <p className="model-status">ยังไม่มีข้อมูลหมวดหมู่โมเดลสำหรับชุมชนนี้</p>
      </div>
    );
  }

  const activeCollection =
    collections.find((c) => c.id === selectedColId) || collections[0];
  const filteredItems = items.filter(
    (item) => item.collectionId === activeCollection.id
  );

  return (
    <div>
      {/* Category Tabs */}
      <div className="community-categories" role="tablist" aria-label="หมวดหมู่โมเดล">
        {collections.map((col) => {
          const isSelected = col.id === activeCollection.id;
          return (
            <button
              key={col.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`community-category ${isSelected ? "active" : ""}`}
              onClick={() => setSelectedColId(col.id)}
            >
              {col.name.replace("แหล่งเรียนรู้", "").trim()}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <p className="model-status" aria-live="polite">
        {activeCollection.name} · {filteredItems.length} โมเดล
      </p>

      {/* Model Grid */}
      <div className="community-model-grid">
        {filteredItems.map((item) => (
          <Link
            key={item.id}
            href={`/c/${communitySlug}/${item.id}`}
            className="model-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnail || "/brand/snru-logo.png"}
              alt={item.name}
              loading="lazy"
            />
            <span>
              <strong>{item.name}</strong>
              <small>ดูโมเดล 3D / AR ↗</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
