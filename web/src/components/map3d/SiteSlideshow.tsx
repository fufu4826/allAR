"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MapSlide } from "@/components/map3d/data/landmarksData";

const INTERVAL_MS = 3500;

/**
 * Pictures of a site's items on the map card: crossfades every few seconds with the item's name.
 * Only the current and the next picture are in the DOM, so a phone downloads one image at a time.
 * It pauses while hovered or touched; with prefers-reduced-motion the pictures change without the fade (CSS).
 */
export default function SiteSlideshow({ slides, siteName }: { slides: MapSlide[]; siteName: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, count, paused]);

  if (count === 0) return null;
  const current = slides[index % count];
  const next = slides[(index + 1) % count];
  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  return (
    <div
      className="mw-slides"
      role="region"
      aria-roledescription="carousel"
      aria-label={`ภาพชิ้นงานใน ${siteName}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <Link href={current.href} className="mw-slide" key={current.id} aria-label={`ดูชิ้นงาน ${current.name}`}>
        <span className="mw-slide-backdrop" style={{ backgroundImage: `url("${current.image}")` }} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.image} alt={current.name} className="mw-slide-img" />
        <span className="mw-slide-caption">
          <span className="mw-slide-name">{current.name}</span>
          {count > 1 && (
            <span className="mw-slide-count">
              {index + 1} / {count}
            </span>
          )}
        </span>
      </Link>
      {count > 1 && (
        <>
          {/* Preload the next picture without showing it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={next.image} alt="" aria-hidden="true" className="mw-slide-preload" />
          <button type="button" className="mw-slide-nav prev" onClick={() => go(-1)} aria-label="ภาพก่อนหน้า">
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
          <button type="button" className="mw-slide-nav next" onClick={() => go(1)} aria-label="ภาพถัดไป">
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
          <div className="mw-slide-dots" aria-hidden="true">
            {slides.map((slide, i) => (
              <span key={slide.id} className={i === index ? "active" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
