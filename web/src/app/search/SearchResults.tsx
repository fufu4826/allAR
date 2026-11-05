"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import ItemCard from "@/components/ItemCard";

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
  const [q, setQ] = useState(useSearchParams().get("q") ?? "");
  const term = q.trim().toLowerCase();
  const results = term
    ? items.filter((i) => i.name.toLowerCase().includes(term) || i.description.toLowerCase().includes(term))
    : items;

  return (
    <>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          router.replace(e.target.value ? `/search?q=${encodeURIComponent(e.target.value)}` : "/search", { scroll: false });
        }}
        autoFocus
        placeholder="พิมพ์ชื่อ เช่น เห็ด ไหม ข้าว คราม…"
        className="mt-4 w-full max-w-xl rounded-full border border-line bg-white px-5 py-3 outline-none focus:border-brand"
      />
      <p className="mt-3 text-sm text-muted">พบ {results.length} ชิ้นงาน</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((i) => (
          <ItemCard
            key={i.id}
            href={`/c/${i.communitySlug}/${i.id}`}
            name={i.name}
            thumbnail={i.thumbnail}
            caption={i.communityName}
            hasAudio={i.hasAudio}
          />
        ))}
      </div>
    </>
  );
}
