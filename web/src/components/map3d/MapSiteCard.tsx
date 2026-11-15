"use client";

import Link from "next/link";
import type { MapLandmark } from "@/components/map3d/data/landmarksData";
import SiteIcon from "@/components/SiteIcon";
import SiteName from "@/components/SiteName";

/**
 * The selected site's card: cover, name, one line about it, and a single main button into the site.
 * - "float": over the 3D map, growing out of the site's label (the scene positions its holder);
 * - "corner": over the 2D map, bottom-left;
 * - "sheet": inside the phone's bottom sheet, with a way back to the list.
 */
export default function MapSiteCard({
  site,
  variant,
  onClose,
  onShuffle,
}: {
  site: MapLandmark;
  variant: "float" | "corner" | "sheet";
  onClose: () => void;
  /** Pick another site at random (the map's "เริ่มสำรวจ"). */
  onShuffle?: () => void;
}) {
  const sheet = variant === "sheet";
  return (
    <article className={`mw-site-card mw-site-card--${variant}`} aria-label={site.shortName}>
      {sheet ? (
        <button type="button" className="mw-site-back" onClick={onClose}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> ดูทั้ง 5 แหล่งเรียนรู้
        </button>
      ) : (
        <button type="button" className="mw-site-close" onClick={onClose} aria-label="ปิด">
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      )}

      <div className="mw-site-cover">
        {site.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.cover} alt="" loading="lazy" />
        ) : (
          <span className="mw-site-cover-icon" aria-hidden="true">
            <SiteIcon slug={site.slug} />
          </span>
        )}
      </div>

      <div className="mw-site-body">
        <h3 className="mw-site-title">
          <span className="mw-site-icon" aria-hidden="true">
            <SiteIcon slug={site.slug} />
          </span>
          <span>
            <SiteName name={site.name} />
          </span>
        </h3>
        {site.desc && <p className="mw-site-desc">{site.desc}</p>}
        <p className="mw-site-meta">
          <i className="fa-solid fa-cube" aria-hidden="true"></i>
          {site.placeholder || !site.itemCount ? "กำลังเตรียมข้อมูล" : `โมเดล 3D และ AR ${site.itemCount} ชิ้น`}
        </p>

        <Link href={`/c/${site.slug}`} className="mw-site-cta">
          เข้าชมแหล่งเรียนรู้ <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </Link>
        <div className="mw-site-links">
          {onShuffle && (
            <button type="button" className="mw-site-nav" onClick={onShuffle}>
              <i className="fa-solid fa-dice mw-site-dice" aria-hidden="true"></i> สุ่มแหล่งอื่น
            </button>
          )}
          <a href={site.gmapsUrl} target="_blank" rel="noopener noreferrer" className="mw-site-nav">
            <i className="fa-solid fa-location-dot" aria-hidden="true"></i> นำทาง
            <i className="fa-solid fa-arrow-up-right-from-square mw-site-ext" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </article>
  );
}
