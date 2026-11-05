"use client";

import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export type MapPin = {
  slug: string;
  number: number;
  name: string;
  location: string;
  position: [number, number];
  color: string;
  itemCount: number;
  placeholder?: boolean;
};

const icon = (pin: MapPin) =>
  L.divIcon({
    className: "",
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42],
    html: `<div style="position:relative;width:40px;height:48px">
      <div style="position:absolute;inset:0 0 8px 0;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${pin.placeholder ? "#bdbdbd" : pin.color};border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.3)"></div>
      <span style="position:absolute;top:8px;left:0;width:40px;text-align:center;color:#fff;font-weight:700;font-size:16px">${pin.number}</span>
    </div>`,
  });

export default function LeafletMap({ pins }: { pins: MapPin[] }) {
  return (
    <MapContainer center={[17.25, 104.05]} zoom={9} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => (
        <Marker key={pin.slug} position={pin.position} icon={icon(pin)}>
          <Popup>
            <div className="min-w-48 font-sans">
              <p className="text-base font-semibold text-ink">{pin.name}</p>
              <p className="text-xs text-muted">{pin.location}</p>
              {pin.placeholder ? (
                <p className="mt-2 text-xs text-muted">รอข้อมูล</p>
              ) : (
                <Link
                  href={`/c/${pin.slug}`}
                  className="mt-2 inline-block rounded-full bg-brand px-3 py-1 text-xs font-medium !text-white"
                >
                  ดู {pin.itemCount} ชิ้นงาน →
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
