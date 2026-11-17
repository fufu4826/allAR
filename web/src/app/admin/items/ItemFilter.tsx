"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_OPTIONS } from "../labels";

interface Option {
  id: string;
  name: string;
  communityId?: string;
}


const selectClass = "w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-brand";

export default function ItemFilter({
  communities,
  collections,
  initialCommunity = "",
  initialCollection = "",
  initialQuery = "",
  initialStatus = "",
}: {
  communities: Option[];
  collections: Option[];
  initialCommunity?: string;
  initialCollection?: string;
  initialQuery?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const [community, setCommunity] = useState(initialCommunity);
  const [collection, setCollection] = useState(initialCollection);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const shownCollections = community ? collections.filter((c) => c.communityId === community) : collections;

  const go = (next: { community?: string; collection?: string; q?: string; status?: string }) => {
    const v = { community, collection, q: query, status, ...next };
    const params = new URLSearchParams();
    if (v.community) params.set("community", v.community);
    if (v.collection) params.set("collection", v.collection);
    if (v.q.trim()) params.set("q", v.q.trim());
    if (v.status) params.set("status", v.status);
    router.push(`/admin/items${params.size ? `?${params}` : ""}`);
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); go({}); }}
      className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาชื่อชิ้นงาน…"
        aria-label="ค้นหาชื่อชิ้นงาน"
        className={selectClass}
      />
      {/* Dropdowns apply at once; the search box applies on Enter or the button. */}
      <select
        value={community}
        aria-label="แหล่งเรียนรู้"
        onChange={(e) => { setCommunity(e.target.value); setCollection(""); go({ community: e.target.value, collection: "" }); }}
        className={selectClass}
      >
        <option value="">ทุกแหล่งเรียนรู้</option>
        {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select
        value={collection}
        aria-label="หมวดหมู่"
        onChange={(e) => { setCollection(e.target.value); go({ collection: e.target.value }); }}
        className={selectClass}
      >
        <option value="">ทุกหมวดหมู่</option>
        {shownCollections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select
        value={status}
        aria-label="สถานะ"
        onChange={(e) => { setStatus(e.target.value); go({ status: e.target.value }); }}
        className={selectClass}
      >
        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">ค้นหา</button>
        {(community || collection || query || status) && (
          <button
            type="button"
            onClick={() => { setCommunity(""); setCollection(""); setQuery(""); setStatus(""); router.push("/admin/items"); }}
            className="rounded-full border border-line px-3 py-2 text-sm text-muted hover:text-ink"
          >
            ล้าง
          </button>
        )}
      </div>
    </form>
  );
}
