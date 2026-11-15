"use client";

import "./map3d.css";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Sakon3DMap from "@/components/map3d/Sakon3DMap";
import CommunityMap from "@/components/CommunityMap";
import type { MapLandmark } from "@/components/map3d/data/landmarksData";
import MapViewMenu, { type MapMode, type TextureMode } from "@/components/map3d/MapViewMenu";
import MapSiteCard from "@/components/map3d/MapSiteCard";
import SiteIcon from "@/components/SiteIcon";
import MapGestureHint from "@/components/map3d/MapGestureHint";

// Width the docked card takes on the left of the map (card 320px + 16px margin each side).
const CARD_DOCK_PX = 352;

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
  // Phones: the site's top bar (logos, menu) is folded away on this page so the map gets the
  // whole screen; the "≡" button on the map unfolds it (see map3d.css, data-bar).
  const [barFolded, setBarFolded] = useState(true);
  // Set when the device cannot draw WebGL: the 2D map takes over and the 3D choice is turned off.
  const [webglFailed, setWebglFailed] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  // Phones: how much of the map's bottom the sheet covers (px), so the 3D view can centre the
  // selected site in the part that stays visible.
  const [coverPx, setCoverPx] = useState(0);
  useEffect(() => {
    const panel = panelRef.current;
    const view = viewportRef.current;
    if (!panel || !view) return;
    const measure = () => {
      const cover = Math.max(0, Math.round(view.getBoundingClientRect().bottom - panel.getBoundingClientRect().top));
      setCoverPx((prev) => (Math.abs(prev - cover) < 4 ? prev : cover));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    ro.observe(view);
    // The sheet animates its height; measure again once it has settled.
    panel.addEventListener("transitionend", measure);
    return () => {
      ro.disconnect();
      panel.removeEventListener("transitionend", measure);
    };
  }, []);
  // The 3D map has loaded: time to show how to turn it.
  const [mapReady, setMapReady] = useState(false);
  const touchStartY = useRef<number | null>(null);
  // "เริ่มเรียนรู้": the pins light up in turn like a roulette wheel, then one site is picked.
  const [spinning, setSpinning] = useState(false);
  const spinTimers = useRef<number[]>([]);
  useEffect(() => () => spinTimers.current.forEach((t) => window.clearTimeout(t)), []);

  const selected = landmarks.find((lm) => lm.id === selectedSlug);

  const select = (slug: string) => {
    setSelectedSlug(slug || null);
    if (slug) setHasPicked(true);
  };
  // A pin pressed again closes its card.
  // "ถัดไป" on the card: the next site in list order, from the last back to the first.
  const selectedIndex = landmarks.findIndex((lm) => lm.id === selectedSlug);
  const nextSite = selectedIndex >= 0 && landmarks.length > 1 ? landmarks[(selectedIndex + 1) % landmarks.length] : undefined;
  const goNext = () => nextSite && select(nextSite.id);
  const tourPosition = selectedIndex >= 0 ? { at: selectedIndex + 1, of: landmarks.length } : undefined;

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
    <div ref={shellRef} className="mw-shell" data-sheet={sheetState} data-bar={barFolded ? "folded" : "shown"}>
      <div ref={viewportRef} className="mw-viewport">
        <button
          type="button"
          className="mw-bar-toggle"
          onClick={() => setBarFolded((v) => !v)}
          aria-label={barFolded ? "แสดงแถบเมนูของเว็บไซต์" : "พับแถบเมนูของเว็บไซต์"}
          aria-expanded={!barFolded}
        >
          <i className={`fa-solid ${barFolded ? "fa-bars" : "fa-chevron-up"}`} aria-hidden="true"></i>
        </button>

        {!selected && (
          <button
            type="button"
            className={`mw-start ${spinning ? "spinning" : ""}`}
            onClick={startRandom}
            disabled={spinning}
            aria-live="polite"
          >
            <i className="fa-solid fa-map-location-dot" aria-hidden="true"></i>
            {spinning ? "กำลังสุ่มแหล่งเรียนรู้…" : "เริ่มเรียนรู้"}
          </button>
        )}

        {!hasPicked && (
          <p className="mw-hint" role="note">
            <i className="fa-solid fa-hand-pointer" aria-hidden="true"></i>
            {isPhone ? "กดหมุด หรือกดเริ่มเรียนรู้" : "กดหมุดบนแผนที่ เลือกจากรายการ หรือกดเริ่มเรียนรู้ให้สุ่มให้"}
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
              selectedId={selectedSlug}
              onSelectLandmark={selectFromMap}
              roadsVisible={roadsVisible}
              textureMode={textureMode}
              resetViewKey={resetViewKey}
              hoverId={hoverSlug}
              insetTop={isPhone ? 60 : 68}
              insetBottom={isPhone ? 72 : 56}
              cardBelow={isPhone}
              coverBottomPx={isPhone && selected ? coverPx : 0}
              cardLeftPx={isPhone ? 0 : CARD_DOCK_PX}
              className="w-full h-full"
              onReady={() => setMapReady(true)}
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

        {/* Wide screens: the card is docked at the top-left of the map (3D and 2D alike) and the
            camera frames the site to its right. Phones show it in the sheet instead. */}
        {mapMode === "3d" && !selected && !spinning && <MapGestureHint ready={mapReady} targetRef={viewportRef} />}

        {selected && !isPhone && (
          <MapSiteCard key={selected.id} site={selected} variant="dock" onClose={() => select("")} next={nextSite} onNext={goNext} position={tourPosition} />
        )}
      </div>

      <aside ref={panelRef} className="mw-panel" aria-label="5 แหล่งเรียนรู้">
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
          <MapSiteCard site={selected} variant="sheet" onClose={() => select("")} next={nextSite} onNext={goNext} position={tourPosition} />
        ) : (
          <>
            <div className="mw-panel-head">
              <h2 className="mw-panel-title">เลือกแหล่งเรียนรู้ที่อยากเข้าชม</h2>
              {isPhone ? (
                <button type="button" className="mw-panel-more" onClick={() => setSheetOpen((v) => !v)}>
                  {sheetOpen ? "ย่อ" : "ดูทั้งหมด"}
                  <i className={`fa-solid fa-chevron-${sheetOpen ? "down" : "up"}`} aria-hidden="true"></i>
                </button>
              ) : (
                <p className="mw-panel-sub">กดหมุดบนแผนที่ หรือกดจากรายการนี้</p>
              )}
            </div>
            {/* Phones, sheet lowered: the five sites as one row of chips, all within reach. */}
            {sheetState === "peek" && (
              <div className="mw-chips" role="list">
                {landmarks.map((site) => (
                  <button
                    key={site.id}
                    type="button"
                    role="listitem"
                    className={`mw-chip ${spinning && hoverSlug === site.id ? "lit" : ""}`}
                    onClick={() => select(site.id)}
                    disabled={spinning}
                  >
                    <span className="mw-chip-icon" aria-hidden="true">
                      <SiteIcon slug={site.slug} />
                    </span>
                    {site.mapLabel || site.shortName}
                  </button>
                ))}
              </div>
            )}
            <ul className="mw-rows" hidden={sheetState === "peek"}>
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
                      {isPhone ? (
                        <span className="mw-row-icon" aria-hidden="true">
                          <SiteIcon slug={site.slug} />
                        </span>
                      ) : (
                        <span className="mw-row-thumb" aria-hidden="true">
                          {site.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={site.cover} alt="" loading="lazy" />
                          ) : null}
                          <span className="mw-row-badge">
                            <SiteIcon slug={site.slug} />
                          </span>
                          {!site.placeholder && site.itemCount > 0 && (
                            <span className="mw-row-count">
                              <i className="fa-solid fa-cube"></i> {site.itemCount}
                            </span>
                          )}
                        </span>
                      )}
                      {/* Short name as the title, so long official names never split mid-word. */}
                      <span className="mw-row-text">
                        <strong>{site.mapLabel || site.shortName}</strong>
                        {isPhone ? (
                          <small>{site.shortName}</small>
                        ) : (
                          <>
                            {site.mapLabel && <small className="mw-row-full">{site.shortName}</small>}
                            {site.desc && <small className="mw-row-desc">{site.desc}</small>}
                          </>
                        )}
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
