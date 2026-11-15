"use client";

import { useEffect } from "react";

/** Send one visit count to /api/stats. No cookie, nothing about the visitor. */
export function sendStat(event: "view" | "ar" | "video", slug: string, itemId?: string) {
  const body = JSON.stringify({ event, slug, itemId: itemId ?? "" });
  try {
    if (navigator.sendBeacon?.("/api/stats", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/stats", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    // Counting is best effort.
  }
}

// Development renders effects twice; count one visit per page per second.
let last = { key: "", at: 0 };

/** Counts one view of a learning-site page (no itemId) or an item page. Renders nothing. */
export default function TrackVisit({ slug, itemId }: { slug: string; itemId?: string }) {
  useEffect(() => {
    const key = `${slug}/${itemId ?? ""}`;
    const now = Date.now();
    if (last.key === key && now - last.at < 1000) return;
    last = { key, at: now };
    sendStat("view", slug, itemId);
  }, [slug, itemId]);
  return null;
}
