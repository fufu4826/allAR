"use client";

import { useRef, useState } from "react";
import { sendStat } from "@/components/TrackVisit";
import ViewCount from "@/components/ViewCount";
import { youTubeEmbedUrl, youTubeWatchUrl } from "@/lib/youtube";

/**
 * The learning site's own video, shown under the hero on its page.
 * The file is fetched only when the visitor presses play (preload="metadata"), so the page
 * stays light on phones. The site's cover photo stands in until then.
 *
 * Our own player is the main one. When the same video is on YouTube, a button switches the frame
 * to YouTube's player (useful on a slow connection: YouTube adapts the quality); another button
 * switches back. Nothing from YouTube is loaded until the visitor asks for it.
 * The first play on each visit, on either player, is counted and shown under the heading.
 */
export default function SiteVideo({
  src,
  youtubeId,
  poster,
  siteName,
  slug,
  plays,
}: {
  src?: string | null;
  youtubeId?: string | null;
  poster?: string | null;
  siteName: string;
  slug: string;
  plays?: number;
}) {
  const counted = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<"site" | "youtube">(src ? "site" : "youtube");
  const [youtubeStarted, setYoutubeStarted] = useState(false);
  const count = () => {
    if (counted.current) return;
    counted.current = true;
    sendStat("video", slug);
  };
  const showYoutube = source === "youtube" && youtubeId;

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
          {showYoutube ? (
            youtubeStarted ? (
              <iframe
                src={youTubeEmbedUrl(youtubeId, { autoplay: true })}
                title={`วีดิทัศน์แนะนำ ${siteName} (YouTube)`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              // No YouTube request until the visitor presses play: one tap loads the player and starts it.
              <button
                type="button"
                className="site-video-yt-start"
                style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
                onClick={() => {
                  setYoutubeStarted(true);
                  count();
                }}
                aria-label={`เล่นวีดิทัศน์แนะนำ ${siteName} จาก YouTube`}
              >
                <span className="site-video-yt-play" aria-hidden="true">
                  <i className="fa-brands fa-youtube"></i>
                </span>
              </button>
            )
          ) : (
            src && (
              <video
                ref={videoRef}
                src={src}
                poster={poster ?? undefined}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                aria-label={`วีดิทัศน์แนะนำ ${siteName}`}
                onPlay={count}
              >
                เบราว์เซอร์นี้เล่นวิดีโอไม่ได้
              </video>
            )
          )}
        </div>
        {youtubeId && (
          <div className="site-video-actions">
            {src &&
              (source === "site" ? (
                <button
                  type="button"
                  className="site-video-switch"
                  onClick={() => {
                    // Stop our player first so the two never play over each other; if it was
                    // playing, YouTube's player starts right away.
                    const playing = videoRef.current ? !videoRef.current.paused : false;
                    videoRef.current?.pause();
                    setSource("youtube");
                    setYoutubeStarted(playing);
                  }}
                >
                  <i className="fa-brands fa-youtube" aria-hidden="true"></i>
                  รับชมด้วย YouTube
                </button>
              ) : (
                <button type="button" className="site-video-switch" onClick={() => setSource("site")}>
                  <i className="fa-solid fa-circle-play" aria-hidden="true"></i>
                  กลับไปเล่นจากเว็บไซต์
                </button>
              ))}
            {source === "youtube" && (
              <a
                href={youTubeWatchUrl(youtubeId)}
                target="_blank"
                rel="noopener noreferrer"
                className="site-video-open"
                aria-label={`เปิดวีดิทัศน์ ${siteName} ในแอปหรือเว็บไซต์ YouTube (เปิดแท็บใหม่)`}
              >
                เปิดใน YouTube ↗
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
