"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type Result = {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  hasAudio: boolean;
  communitySlug: string;
  communityName: string;
};

export default function SearchResults({ items }: { items: Result[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const term = q.trim().toLowerCase();
  const results = term
    ? items.filter((i) => i.name.toLowerCase().includes(term) || i.description.toLowerCase().includes(term))
    : items;

  return (
    <div>
      <div style={{ maxWidth: "560px", marginBottom: "24px" }}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            router.replace(e.target.value ? `/search?q=${encodeURIComponent(e.target.value)}` : "/search", {
              scroll: false,
            });
          }}
          autoFocus
          placeholder="พิมพ์คำค้นหา เช่น ผ้าคราม, สิม, ไก่ดำ, ตึกโบราณ…"
          style={{
            width: "100%",
            padding: "14px 22px",
            borderRadius: "9999px",
            border: "1px solid var(--slate-300)",
            background: "var(--white)",
            fontSize: "1rem",
            outline: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        />
      </div>

      <p style={{ fontSize: "0.88rem", color: "var(--slate-500)", marginBottom: "20px" }}>
        พบ <strong>{results.length}</strong> ชิ้นงาน
      </p>

      {results.length > 0 ? (
        <div className="community-model-grid">
          {results.map((i) => (
            <Link key={i.id} href={`/c/${i.communitySlug}/${i.id}`} className="model-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.thumbnail || "/brand/snru-logo.png"} alt={i.name} loading="lazy" />
              <span>
                <strong>{i.name}</strong>
                <small>
                  {i.communityName} · ดูใน AR ↗
                </small>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            background: "var(--white)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--slate-300)",
            color: "var(--slate-500)",
          }}
        >
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }}></i>
          <p>ไม่พบชิ้นงานที่ตรงกับคำค้นหา &ldquo;{q}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
