"use client";

import "./map3d.css";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Sakon3DMap from "@/components/map3d/Sakon3DMap";
import CommunityMap from "@/components/CommunityMap";
import type { MapLandmark } from "@/components/map3d/data/landmarksData";
import MapViewMenu, { type MapMode, type TextureMode } from "@/components/map3d/MapViewMenu";
import MapSiteCard from "@/components/map3d/MapSiteCard";
import SiteIcon from "@/components/SiteIcon";

interface MapWorkstationProps {
  landmarks: MapLandmark[];
}

// iPhone Safari has no element fullscreen API, so the command is left out there.
const noop = () => () => {};
const canFullscreen = () =>
  typeof document !== "undefined" &&
  !!document.fullscreenEnabled &&
  typeof document.documentElement.requestFullscreen === "function";

// Phones: the site list is a sheet under the map and the card opens in it (see map3d.css).
const PHONE_QUERY = "(max-width: 768px)";
const subscribePhone = (cb: () => void) => {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const isPhoneNow = () => window.matchMedia(PHONE_QUERY).matches;

/**
 * Map page. One way through: pick one of the five sites (a pin on the map or a row in the list),
 * read its card, then press "เข้าชมแหล่งเรียนรู้". Every map setting sits in one menu.
 */
export default function MapWorkstation({ landmarks }: MapWorkstationProps) {
  const fullscreenSupported = useSyncExternalStore(noop, canFullscreen, () => false);
  const isPhone = useSyncExternalStore(subscribePhone, isPhoneNow, () => false);

  const [mapMode, setMapMode] = useState<MapMode>("3d");
  const [textureMode, setTextureMode] = useState<TextureMode>("color");
  const [roadsVisible, setRoadsVisible] = useState(true);
  const [resetViewKey, setResetViewKey] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);
  // The hint over the map goes away once the visitor has picked a site.
  const [hasPicked, setHasPicked] = useState(false);
  // Phone sheet: "peek" shows the heading and the first rows, "open" the whole list.
  const [sheetOpen, setSheetOpen] = useState(false);
  // Set when the device cannot draw WebGL: the 2D map takes over and the 3D choice is turned off.
  const [webglFailed, setWebglFailed] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const cardAnchorRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  // "เริ่มสำรวจ": the pins light up in turn like a roulette wheel, then one site is picked.
  const [spinning, setSpinning] = useState(false);
  const spinTimers = useRef<number[]>([]);
  useEffect(() => () => spinTimers.current.forEach((t) => window.clearTimeout(t)), []);

  const selected = landmarks.find((lm) => lm.id === selectedSlug);

  const select = (slug: string) => {
    setSelectedSlug(slug || null);
    if (slug) setHasPicked(true);
  };
  // A pin pressed again closes its card.
  const selectFromMap = (slug: string) => select(!slug || slug === selectedSlug ? "" : slug);

  const startRandom = () => {
    if (spinning || landmarks.length === 0) return;
    // A different site from the one open now, when there is a choice.
    const pool = landmarks.length > 1 ? landmarks.filter((lm) => lm.id !== selectedSlug) : landmarks;
    const target = pool[Math.floor(Math.random() * pool.length)];
    setSelectedSlug(null);
    setSheetOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      select(target.id);
      return;
    }
    setSpinning(true);
    setHasPicked(true);
    // Light the sites in list order, slowing down, and stop on the target.
    const order = landmarks.map((lm) => lm.id);
    const steps = order.length * 2 + order.indexOf(target.id) + 1;
    let at = 0;
    spinTimers.current.forEach((t) => window.clearTimeout(t));
    spinTimers.current = [];
    for (let i = 0; i < steps; i++) {
      at += 55 + i * i * 0.9;
      spinTimers.current.push(window.setTimeout(() => setHoverSlug(order[i % order.length]), at));
    }
    spinTimers.current.push(
      window.setTimeout(() => {
        setHoverSlug(null);
        setSpinning(false);
        select(target.id);
      }, at + 350),
    );
  };

  const resetView = () => {
    setSelectedSlug(null);
    setResetViewKey((k) => k + 1);
  };

  const toggleFullscreen = () => {
    if (!shellRef.current || !canFullscreen()) return;
    if (!document.fullscreenElement) shellRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  // Swipe on the sheet's top edge: up opens the list, down closes the card or the list.
  const onGripTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onGripTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (dy < -40 && !selected) setSheetOpen(true);
    else if (dy > 40) {
      if (selected) setSelectedSlug(null);
      else setSheetOpen(false);
    }
  };

  const sheetState = isPhone ? (selected ? "card" : sheetOpen ? "open" : "peek") : undefined;

  return (
    <div ref={shellRef} className="mw-shell" data-sheet={sheetState}>
      <div className="mw-viewport">
        {!selected && (
          <button
            type="button"
            className={`mw-start ${spinning ? "spinning" : ""}`}
            onClick={startRandom}
            disabled={spinning}
            aria-live="polite"
          >
            <i className="fa-solid fa-dice" aria-hidden="true"></i>
            {spinning ? "กำลังสุ่มแหล่งเรียนรู้…" : "เริ่มสำรวจ"}
          </button>
        )}

        {!hasPicked && (
          <p className="mw-hint" role="note">
            <i className="fa-solid fa-hand-pointer" aria-hidden="true"></i>
            {isPhone ? "กดหมุด เลือกจากรายการ หรือกดเริ่มสำรวจ" : "กดหมุดบนแผนที่ เลือกจากรายการ หรือกดเริ่มสำรวจให้สุ่มให้"}
          </p>
        )}

        <div className="mw-view-anchor">
          <MapViewMenu
            mapMode={mapMode}
            onMapMode={setMapMode}
            webglFailed={webglFailed}
            textureMode={textureMode}
            onTextureMode={setTextureMode}
            roadsVisible={roadsVisible}
            onRoadsVisible={setRoadsVisible}
            onResetView={resetView}
            onFullscreen={fullscreenSupported ? toggleFullscreen : undefined}
          />
        </div>

        {mapMode === "3d" ? (
          <div className="relative w-full h-full">
            <Sakon3DMap
              landmarks={landmarks}
              cardAnchorRef={cardAnchorRef}
              selectedId={selectedSlug}
              onSelectLandmark={selectFromMap}
              roadsVisible={roadsVisible}
              textureMode={textureMode}
              resetViewKey={resetViewKey}
              hoverId={hoverSlug}
              insetTop={isPhone ? 60 : 68}
              insetBottom={56}
              cardBelow={isPhone}
              className="w-full h-full"
              onWebglUnavailable={() => {
                setWebglFailed(true);
                setMapMode("osm");
              }}
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <CommunityMap
              landmarks={landmarks}
              selectedId={selectedSlug}
              onSelectLandmark={selectFromMap}
              hoverId={hoverSlug}
              resetViewKey={resetViewKey}
            />
            {webglFailed && (
              <p className="mw-fallback-note" role="status">
                อุปกรณ์นี้ไม่รองรับแผนที่ 3 มิติ จึงแสดงแผนที่ 2 มิติแทน
              </p>
            )}
          </div>
        )}

        {/* Wide screens: the card grows out of the site's label in 3D (the scene moves its holder)
            and sits in the corner in 2D. Phones show it in the sheet instead. */}
        {mapMode === "3d" ? (
          <div ref={cardAnchorRef} className="mw-card-anchor" style={{ display: "none" }}>
            {selected && !isPhone && <MapSiteCard site={selected} variant="float" onClose={() => select("")} onShuffle={startRandom} />}
          </div>
        ) : (
          selected && !isPhone && <MapSiteCard site={selected} variant="corner" onClose={() => select("")} onShuffle={startRandom} />
        )}
      </div>

      <aside className="mw-panel" aria-label="5 แหล่งเรียนรู้">
        {isPhone && (
          <div className="mw-sheet-grip" onTouchStart={onGripTouchStart} onTouchEnd={onGripTouchEnd}>
            <button
              type="button"
              className="mw-sheet-handle"
              aria-label={selected ? "กลับไปที่รายการ" : sheetOpen ? "ย่อรายการ" : "ขยายรายการ"}
              aria-expanded={sheetState !== "peek"}
              onClick={() => (selected ? select("") : setSheetOpen((v) => !v))}
            >
              <span aria-hidden="true"></span>
            </button>
          </div>
        )}

        {isPhone && selected ? (
          <MapSiteCard site={selected} variant="sheet" onClose={() => select("")} onShuffle={startRandom} />
        ) : (
          <>
            <div className="mw-panel-head">
              <h2 className="mw-panel-title">เลือกแหล่งเรียนรู้ที่อยากเข้าชม</h2>
              <p className="mw-panel-sub">
                {isPhone ? "กดชื่อเพื่อดูบนแผนที่" : "กดหมุดบนแผนที่ หรือกดจากรายการนี้"}
              </p>
            </div>
            <ul className="mw-rows">
              {landmarks.map((site) => {
                const active = site.id === selectedSlug;
                return (
                  <li key={site.id}>
                    <button
                      type="button"
                      className={`mw-row ${active ? "active" : ""} ${spinning && hoverSlug === site.id ? "lit" : ""}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => select(site.id)}
                      disabled={spinning}
                      onMouseEnter={() => !spinning && setHoverSlug(site.id)}
                      onMouseLeave={() => !spinning && setHoverSlug(null)}
                      onFocus={() => !spinning && setHoverSlug(site.id)}
                      onBlur={() => !spinning && setHoverSlug(null)}
                    >
                      <span className="mw-row-icon" aria-hidden="true">
                        <SiteIcon slug={site.slug} />
                      </span>
                      <span className="mw-row-text">
                        <strong>{site.shortName}</strong>
                        <small>{site.desc || site.location}</small>
                      </span>
                      <i className="fa-solid fa-chevron-right mw-row-go" aria-hidden="true"></i>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
