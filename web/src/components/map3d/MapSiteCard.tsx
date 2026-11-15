"use client";

import Link from "next/link";
import type { MapLandmark } from "@/components/map3d/data/landmarksData";
import SiteIcon from "@/components/SiteIcon";
import SiteName from "@/components/SiteName";

/**
 * The selected site's card: cover, name, one line about it, and a single main button into the site.
 * - "dock": wide screens, docked at the top-left of the map (the camera frames the site beside it);
 * - "sheet": inside the phone's bottom sheet, as a compact strip (close returns to the list).
 */
export default function MapSiteCard({
  site,
  variant,
  onClose,
  next,
  onNext,
  position,
}: {
  site: MapLandmark;
  variant: "dock" | "sheet";
  onClose: () => void;
  /** The next site in the list, offered as "ถัดไป" at the bottom of the card. */
  next?: MapLandmark;
  onNext?: () => void;
  /** Where this site is in the list (shown on the "ถัดไป" button). */
  position?: { at: number; of: number };
}) {
  const sheet = variant === "sheet";
  const nextButton = next && onNext && (
    <button type="button" className="mw-site-next" onClick={onNext}>
      <span className="mw-site-next-text">
        <strong>ถัดไป</strong>
        <small>
          {next.mapLabel || next.shortName}
          {position ? ` · ${position.at === position.of ? 1 : position.at + 1} จาก ${position.of}` : ""}
        </small>
      </span>
      <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
    </button>
  );

  // Phone sheet: one compact strip (thumbnail beside the name), so most of the screen stays map.
  if (sheet) {
    return (
      <article className="mw-site-card mw-site-card--sheet" aria-label={site.shortName}>
        <div className="mw-sheet-head">
          <span className="mw-sheet-thumb">
            {site.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.cover} alt="" loading="lazy" />
            ) : (
              <SiteIcon slug={site.slug} />
            )}
          </span>
          <span className="mw-sheet-titles">
            <h3 className="mw-sheet-name">{site.mapLabel || site.shortName}</h3>
            {site.mapLabel && <span className="mw-sheet-full">{site.shortName}</span>}
            <span className="mw-sheet-meta">
              <span>
                <i className="fa-solid fa-cube" aria-hidden="true"></i>
                {site.placeholder || !site.itemCount ? " กำลังเตรียมข้อมูล" : ` ${site.itemCount} ชิ้น`}
              </span>
              <a href={site.gmapsUrl} target="_blank" rel="noopener noreferrer">
                <i className="fa-solid fa-location-dot" aria-hidden="true"></i> นำทาง
              </a>
            </span>
          </span>
          <button type="button" className="mw-sheet-close" onClick={onClose} aria-label="กลับไปที่รายการ 5 แหล่งเรียนรู้">
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        {site.desc && <p className="mw-sheet-desc">{site.desc}</p>}
        <Link href={`/c/${site.slug}`} className="mw-site-cta mw-sheet-cta">
          เข้าชมแหล่งเรียนรู้ <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </Link>
        {nextButton}
      </article>
    );
  }

  return (
    <article className={`mw-site-card mw-site-card--${variant}`} aria-label={site.shortName}>
      <button type="button" className="mw-site-close" onClick={onClose} aria-label="ปิด">
        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

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
        <a href={site.gmapsUrl} target="_blank" rel="noopener noreferrer" className="mw-site-nav">
          <i className="fa-solid fa-location-dot" aria-hidden="true"></i> นำทางด้วย Google Maps
          <i className="fa-solid fa-arrow-up-right-from-square mw-site-ext" aria-hidden="true"></i>
        </a>
      </div>

      {nextButton}
    </article>
  );
}
