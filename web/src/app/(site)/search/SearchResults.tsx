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

// Cards shown at first and added by each "show more": 142 cards at once is 22 phone screens.
const PAGE = 20;

export default function SearchResults({ items }: { items: Result[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  // "" = every site. The sites are listed in the order the index gives them.
  const [site, setSite] = useState("");
  const [shown, setShown] = useState(PAGE);
  const sites = [...new Map(items.map((i) => [i.communitySlug, i.communityName])).entries()];

  const term = q.trim().toLowerCase();
  const results = items.filter(
    (i) =>
      (!site || i.communitySlug === site) &&
      (!term || i.name.toLowerCase().includes(term) || i.description.toLowerCase().includes(term)),
  );
  const visible = results.slice(0, shown);

  return (
    <div>
      <div style={{ maxWidth: "560px", marginBottom: "24px" }}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(PAGE);
            router.replace(e.target.value ? `/search?q=${encodeURIComponent(e.target.value)}` : "/search", {
              scroll: false,
            });
          }}
          autoFocus
          placeholder="พิมพ์คำค้นหา เช่น ผ้าขาวม้า, ไก่ดำ, พระพุทธรูป, บายศรี…"
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

      {/* Filter by learning site: one row that scrolls sideways on phones. */}
      <div className="search-chips" role="group" aria-label="กรองตามแหล่งเรียนรู้">
        {[["", "ทั้งหมด"] as [string, string], ...sites].map(([slug, name]) => (
          <button
            key={slug || "all"}
            type="button"
            className={`search-chip${site === slug ? " active" : ""}`}
            aria-pressed={site === slug}
            onClick={() => {
              setSite(slug);
              setShown(PAGE);
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "0.88rem", color: "var(--slate-500)", marginBottom: "20px" }}>
        พบ <strong>{results.length}</strong> ชิ้นงาน
      </p>

      {results.length > 0 ? (
        <div className="community-model-grid">
          {visible.map((i) => (
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
      ) : null}

      {results.length > shown && (
        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <button type="button" className="search-more" onClick={() => setShown((n) => n + PAGE)}>
            แสดงเพิ่ม (เหลืออีก {results.length - shown} ชิ้น)
          </button>
        </div>
      )}

      {results.length > 0 ? null : (
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
