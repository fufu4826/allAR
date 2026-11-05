"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Option {
  id: string;
  name: string;
  communityId?: string;
}

interface ItemFilterProps {
  communities: Option[];
  collections: Option[];
  initialCommunity?: string;
  initialCollection?: string;
  initialQuery?: string;
}

export default function ItemFilter({
  communities,
  collections,
  initialCommunity = "",
  initialCollection = "",
  initialQuery = "",
}: ItemFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCommunity, setSelectedCommunity] = useState(initialCommunity);
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const filteredCollections = selectedCommunity
    ? collections.filter((c) => c.communityId === selectedCommunity)
    : collections;

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (selectedCommunity) params.set("community", selectedCommunity);
    else params.delete("community");

    if (selectedCollection) params.set("collection", selectedCollection);
    else params.delete("collection");

    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    else params.delete("q");

    router.push(`/admin/items?${params.toString()}`);
  };

  const handleReset = () => {
    setSelectedCommunity("");
    setSelectedCollection("");
    setSearchQuery("");
    router.push("/admin/items");
  };

  return (
    <form
      onSubmit={handleApply}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm"
    >
      {/* Search Input */}
      <div className="min-w-[200px] flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาชื่อชิ้นงาน…"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-brand"
        />
      </div>

      {/* Community Select */}
      <div className="w-full sm:w-auto">
        <select
          value={selectedCommunity}
          onChange={(e) => {
            setSelectedCommunity(e.target.value);
            setSelectedCollection("");
          }}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-brand"
        >
          <option value="">ทุกชุมชน</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Collection Select */}
      <div className="w-full sm:w-auto">
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-brand"
        >
          <option value="">ทุกแหล่งเรียนรู้</option>
          {filteredCollections.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-dark"
        >
          ค้นหา / กรอง
        </button>
        {(selectedCommunity || selectedCollection || searchQuery) && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-line px-3 py-2 text-xs font-medium text-muted hover:text-ink"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>
    </form>
  );
}
