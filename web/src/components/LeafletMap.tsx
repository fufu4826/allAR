"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { MapLandmark } from "@/components/map3d/data/landmarksData";

interface LeafletMapProps {
  landmarks: MapLandmark[];
  selectedId?: string | null;
  onSelectLandmark?: (slug: string) => void;
}

const OVERVIEW_CENTER: [number, number] = [17.152, 104.135];
const OVERVIEW_ZOOM = 11;

// shortName comes from the database, so escape it before putting it into the marker HTML.
const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

const pillTransform = (anchor: string) =>
  anchor === "left"
    ? "translate(10px, -50%)"
    : anchor === "right"
    ? "translate(calc(-100% - 10px), -50%)"
    : "translate(-50%, calc(-100% - 10px))";

function createLandmarkDivIcon(lm: MapLandmark, isSelected: boolean) {
  const anchor = lm.pinAnchor || "center";
  const badgeTranslate = pillTransform(anchor);

  return L.divIcon({
    className: "mw-leaflet-div-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div style="position:relative;width:0;height:0;">
        <div class="mw-2d-dot ${isSelected ? "active" : ""}"></div>
        <div class="mw-pin-pill mw-2d-pill ${isSelected ? "active" : ""}" data-anchor="${anchor}" style="transform:${badgeTranslate};">
          <span class="mw-pin-icon"><i class="${escapeHtml(lm.faIcon)}"></i></span>
          <span class="mw-pin-text">${escapeHtml(lm.shortName)}</span>
        </div>
      </div>
    `,
  });
}

/** After every zoom/pan, keep the 2D labels inside the map and off each other: a label that runs
 *  past the left/right edge flips to the other side of its pin, and overlapping labels are nudged
 *  up or down. Matters on phones, where the sites sit close together. */
function LabelFitter({ selectedId }: { selectedId?: string | null }) {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      const container = map.getContainer();
      const box = container.getBoundingClientRect();
      const placed: DOMRect[] = [];
      const pills = Array.from(container.querySelectorAll<HTMLElement>(".mw-2d-pill"));
      // The selected label is placed first so it never moves.
      pills.sort((a, b) => Number(b.classList.contains("active")) - Number(a.classList.contains("active")));
      for (const el of pills) {
        const anchor = el.dataset.anchor || "center";
        el.style.marginTop = "0px";
        el.style.transform = pillTransform(anchor);
        let r = el.getBoundingClientRect();
        if (r.left < box.left + 4 && anchor !== "left") {
          el.style.transform = pillTransform("left");
          r = el.getBoundingClientRect();
        } else if (r.right > box.right - 4 && anchor !== "right") {
          el.style.transform = pillTransform("right");
          r = el.getBoundingClientRect();
        }
        const step = r.height + 4;
        for (const dy of [0, -step, step, -2 * step, 2 * step]) {
          const top = r.top + dy;
          const clash = placed.some(
            (p) => r.left < p.right + 4 && r.right + 4 > p.left && top < p.bottom + 2 && top + r.height + 2 > p.top,
          );
          if (!clash) {
            el.style.marginTop = `${dy}px`;
            placed.push(new DOMRect(r.left, top, r.width, r.height));
            break;
          }
        }
      }
    };
    // Fit on every frame while the map moves (cheap: five labels), and once more after it settles,
    // so the result never depends on which Leaflet event happens to fire last.
    let timer = 0;
    let frame = 0;
    const run = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          fit();
        });
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(fit, 300);
    };
    map.on("move zoom zoomend moveend resize", run);
    // React re-creates the marker icons on re-render, which resets their position; re-fit then.
    // childList only, so our own style changes here do not trigger it again.
    const observer = new MutationObserver(run);
    observer.observe(map.getPane("markerPane") ?? map.getContainer(), { childList: true, subtree: true });
    // Label widths change when the web font finishes loading, so measure again then.
    document.fonts?.ready.then(run);
    document.fonts?.addEventListener("loadingdone", run);
    run();
    return () => {
      map.off("move zoom zoomend moveend resize", run);
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", run);
      window.clearTimeout(timer);
    };
  }, [map, selectedId]);

  return null;
}

function MapFlyController({ landmarks, selectedId }: { landmarks: MapLandmark[]; selectedId?: string | null }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (!selectedId) {
      // Fit all sites with room for their labels and the buttons above/below, so nothing is cut
      // off on narrow phone screens (a fixed zoom left labels hanging off the edges).
      if (landmarks.length) {
        const bounds = L.latLngBounds(landmarks.map((lm) => [lm.lat, lm.lon] as [number, number]));
        const side = Math.min(110, Math.round(map.getSize().x * 0.28));
        map.flyToBounds(bounds, {
          paddingTopLeft: [side, 70],
          paddingBottomRight: [side, 70],
          maxZoom: OVERVIEW_ZOOM + 1,
          duration: 0.7,
        });
      } else {
        map.flyTo(OVERVIEW_CENTER, OVERVIEW_ZOOM, { duration: 0.7 });
      }
      return;
    }
    const found = landmarks.find((lm) => lm.id === selectedId);
    if (found) {
      map.flyTo([found.lat, found.lon], 15, { duration: 0.75 });
    }
  }, [landmarks, selectedId, map]);

  return null;
}

export default function LeafletMap({ landmarks, selectedId, onSelectLandmark }: LeafletMapProps) {
  return (
    <div className="relative w-full h-full bg-[#e5edf5]">
      <MapContainer
        center={OVERVIEW_CENTER}
        zoom={OVERVIEW_ZOOM}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full z-10"
      >
        <ZoomControl position="topleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyController landmarks={landmarks} selectedId={selectedId} />
        <LabelFitter selectedId={selectedId} />

        {landmarks.map((lm) => {
          const isSelected = selectedId === lm.id;
          return (
            <Marker
              key={lm.id}
              position={[lm.lat, lm.lon]}
              icon={createLandmarkDivIcon(lm, isSelected)}
              zIndexOffset={isSelected ? 1000 : 100}
              eventHandlers={{
                click: () => {
                  if (onSelectLandmark) {
                    onSelectLandmark(lm.id);
                  }
                },
              }}
            />
          );
        })}
      </MapContainer>

      {/* Bottom-Right Reset Overview Button on 2D Map */}
      <div className="mw-layer-bar">
        <button
          type="button"
          onClick={() => onSelectLandmark && onSelectLandmark("")}
          className="mw-layer-btn"
          title="รีเซ็ตมุมมองภาพรวมสกลนคร"
        >
          <i className="fa-solid fa-rotate-left text-brand"></i>
          <span>มุมมองรวม</span>
        </button>
      </div>
    </div>
  );
}
