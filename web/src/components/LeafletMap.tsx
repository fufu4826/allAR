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

function createLandmarkDivIcon(lm: MapLandmark, isSelected: boolean) {
  const anchor = lm.pinAnchor || "center";
  const badgeTranslate =
    anchor === "left"
      ? "translate(10px, -50%)"
      : anchor === "right"
      ? "translate(calc(-100% - 10px), -50%)"
      : "translate(-50%, calc(-100% - 10px))";

  return L.divIcon({
    className: "mw-leaflet-div-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div style="position:relative;width:0;height:0;">
        <div class="mw-2d-dot ${isSelected ? "active" : ""}"></div>
        <div class="mw-pin-pill mw-2d-pill ${isSelected ? "active" : ""}" style="transform:${badgeTranslate};">
          <span class="mw-pin-icon"><i class="${escapeHtml(lm.faIcon)}"></i></span>
          <span class="mw-pin-text">${escapeHtml(lm.shortName)}</span>
        </div>
      </div>
    `,
  });
}

function MapFlyController({ landmarks, selectedId }: { landmarks: MapLandmark[]; selectedId?: string | null }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (!selectedId) {
      map.flyTo(OVERVIEW_CENTER, OVERVIEW_ZOOM, { duration: 0.7 });
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
