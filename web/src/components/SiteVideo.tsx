/**
 * The learning site's own video, shown under the hero on its page.
 * The file is fetched only when the visitor presses play (preload="metadata"), so the page
 * stays light on phones. The site's cover photo stands in until then.
 */
export default function SiteVideo({ src, poster, siteName }: { src: string; poster?: string | null; siteName: string }) {
  return (
    <section id="video" className="site-video" aria-labelledby="site-video-title">
      <div className="community-container">
        <div className="site-video-head">
          <p className="eyebrow">VIDEO</p>
          <h2 id="site-video-title">
            วีดิทัศน์แนะนำ <span>{siteName}</span>
          </h2>
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
          >
            เบราว์เซอร์นี้เล่นวิดีโอไม่ได้
          </video>
        </div>
      </div>
    </section>
  );
}
