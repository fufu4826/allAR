"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MapMode = "3d" | "osm";
export type TextureMode = "color" | "satellite";

interface MapViewMenuProps {
  mapMode: MapMode;
  onMapMode: (mode: MapMode) => void;
  /** The device cannot draw the 3D map: that choice is shown but turned off. */
  webglFailed: boolean;
  textureMode: TextureMode;
  onTextureMode: (mode: TextureMode) => void;
  roadsVisible: boolean;
  onRoadsVisible: (visible: boolean) => void;
  onResetView: () => void;
  /** Fullscreen is offered only where the browser supports it (not iPhone Safari). */
  onFullscreen?: () => void;
}

/**
 * One "มุมมองแผนที่" button holding every map setting, so the pins and the site list are the only
 * things that stand out on the map. Closes on a choice of command, a tap outside, or Esc.
 */
export default function MapViewMenu({
  mapMode,
  onMapMode,
  webglFailed,
  textureMode,
  onTextureMode,
  roadsVisible,
  onRoadsVisible,
  onResetView,
  onFullscreen,
}: MapViewMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const is3d = mapMode === "3d";

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="mw-view">
      <button
        ref={buttonRef}
        type="button"
        className={`mw-view-btn ${open ? "open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="มุมมองแผนที่"
        onClick={() => setOpen((v) => !v)}
      >
        <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
        <span className="mw-view-btn-text">มุมมองแผนที่</span>
        <i className="fa-solid fa-chevron-down mw-view-caret" aria-hidden="true"></i>
      </button>

      {open && (
        <div id={menuId} className="mw-view-menu" role="menu" aria-label="มุมมองแผนที่">
          <p className="mw-view-group">รูปแบบแผนที่</p>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={is3d}
            className="mw-view-item"
            disabled={webglFailed}
            onClick={() => onMapMode("3d")}
          >
            <span className="mw-view-mark radio" aria-hidden="true"></span>
            <span>
              แผนที่ 3 มิติ
              {webglFailed && <small>อุปกรณ์นี้ไม่รองรับ</small>}
            </span>
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={!is3d}
            className="mw-view-item"
            onClick={() => onMapMode("osm")}
          >
            <span className="mw-view-mark radio" aria-hidden="true"></span>
            <span>แผนที่ 2 มิติ (ถนน)</span>
          </button>

          <p className="mw-view-group">พื้นผิว {!is3d && <small>(เฉพาะ 3 มิติ)</small>}</p>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={textureMode === "color"}
            className="mw-view-item"
            disabled={!is3d}
            onClick={() => onTextureMode("color")}
          >
            <span className="mw-view-mark radio" aria-hidden="true"></span>
            <span>แผนที่สี</span>
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={textureMode === "satellite"}
            className="mw-view-item"
            disabled={!is3d}
            onClick={() => onTextureMode("satellite")}
          >
            <span className="mw-view-mark radio" aria-hidden="true"></span>
            <span>ภาพถ่ายดาวเทียม</span>
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={roadsVisible}
            className="mw-view-item"
            disabled={!is3d}
            onClick={() => onRoadsVisible(!roadsVisible)}
          >
            <span className="mw-view-mark check" aria-hidden="true"></span>
            <span>แสดงทางหลวง</span>
          </button>

          <div className="mw-view-sep" role="separator"></div>
          <button type="button" role="menuitem" className="mw-view-item" onClick={() => run(onResetView)}>
            <i className="fa-solid fa-expand mw-view-icon" aria-hidden="true"></i>
            <span>ดูทั้งจังหวัด</span>
          </button>
          {onFullscreen && (
            <button type="button" role="menuitem" className="mw-view-item" onClick={() => run(onFullscreen)}>
              <i className="fa-solid fa-maximize mw-view-icon" aria-hidden="true"></i>
              <span>เต็มจอ / ออกจากเต็มจอ</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
