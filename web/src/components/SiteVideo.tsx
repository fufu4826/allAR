"use client";

import { useRef } from "react";
import { sendStat } from "@/components/TrackVisit";
import ViewCount from "@/components/ViewCount";

/**
 * The learning site's own video, shown under the hero on its page.
 * The file is fetched only when the visitor presses play (preload="metadata"), so the page
 * stays light on phones. The site's cover photo stands in until then.
 * The first press of play on each visit is counted, and the total is shown under the heading.
 */
export default function SiteVideo({
  src,
  poster,
  siteName,
  slug,
  plays,
}: {
  src: string;
  poster?: string | null;
  siteName: string;
  slug: string;
  plays?: number;
}) {
  const counted = useRef(false);
  return (
    <section id="video" className="site-video" aria-labelledby="site-video-title">
      <div className="community-container">
        <div className="site-video-head">
          <p className="eyebrow">VIDEO</p>
          <h2 id="site-video-title">
            วีดิทัศน์แนะนำ <span>{siteName}</span>
          </h2>
          <ViewCount count={plays} verb="รับชม" />
        </div>
        <div className="site-video-frame">
          <video
            src={src}
            poster={poster ?? undefined}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            aria-label={`วีดิทัศน์แนะนำ ${siteName}`}
            onPlay={() => {
              if (counted.current) return;
              counted.current = true;
              sendStat("video", slug);
            }}
          >
            เบราว์เซอร์นี้เล่นวิดีโอไม่ได้
          </video>
        </div>
      </div>
    </section>
  );
}
