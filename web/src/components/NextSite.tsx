import Link from "next/link";
import SiteIcon from "@/components/SiteIcon";
import SiteName from "@/components/SiteName";
import type { Community } from "@/lib/types";

/**
 * Last block of a learning-site page: the next site in the tour (the five sites' own order,
 * from the last one back to the first), with its cover, so the visitor can go straight on.
 */
export default function NextSite({ site, position, total }: { site: Community; position: number; total: number }) {
  return (
    <section className="next-site" aria-labelledby="next-site-title">
      <div className="community-container">
        <Link
          href={`/c/${site.slug}`}
          className="next-site-card"
          style={site.cover ? ({ "--next-cover": `url("${site.cover}")` } as React.CSSProperties) : undefined}
        >
          <span className="next-site-shade" aria-hidden="true"></span>
          <span className="next-site-body">
            <span className="next-site-kicker">
              <i className="fa-solid fa-route" aria-hidden="true"></i> แหล่งเรียนรู้ถัดไป · {position} จาก {total}
            </span>
            <span id="next-site-title" className="next-site-name">
              <span className="next-site-icon" aria-hidden="true">
                <SiteIcon slug={site.slug} />
              </span>
              <span>
                <SiteName name={site.name} />
              </span>
            </span>
            {site.tagline && <span className="next-site-lead">{site.tagline}</span>}
            <span className="next-site-go">
              ไปต่อเลย <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
