"use client";

import { useEffect, useRef, useState } from "react";
import { sendStat } from "@/components/TrackVisit";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        "ios-src"?: string;
        poster?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-placement"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
        "touch-action"?: string;
        loading?: string;
      };
    }
  }
}

export default function ModelViewer({
  src,
  iosSrc,
  poster,
  alt,
  stat,
}: {
  src: string;
  /** USDZ for AR Quick Look on iPhone/iPad; without it the GLB is converted on the device. */
  iosSrc?: string | null;
  poster?: string | null;
  alt: string;
  /** Page to count an AR press against (admin statistics). */
  stat?: { slug: string; itemId: string };
}) {
  const [ready, setReady] = useState(false);
  // True once the viewer reports that this device can open AR (Scene Viewer, Quick Look or WebXR).
  const [canAr, setCanAr] = useState(false);
  const viewerRef = useRef<HTMLElement & { canActivateAR?: boolean; activateAR?: () => void }>(null);

  useEffect(() => {
    // Self-hosted decoders (no Google CDN). Each <model-viewer> re-reads this global
    // config on connect and falls back to gstatic.com when a key is missing, so it must
    // be set here rather than only through the static setters.
    const g = globalThis as { ModelViewerElement?: Record<string, string> };
    g.ModelViewerElement = {
      ...g.ModelViewerElement,
      ktx2TranscoderLocation: "/decoders/basis/",
      meshoptDecoderLocation: "/decoders/meshopt_decoder.js",
    };
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  // The viewer picks its AR mode a moment after it mounts, so ask a few times and on load.
  useEffect(() => {
    if (!ready) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    const check = () => setCanAr(!!viewer.canActivateAR);
    const timers = [300, 1000, 2500, 5000].map((ms) => setTimeout(check, ms));
    viewer.addEventListener("load", check);
    return () => {
      timers.forEach(clearTimeout);
      viewer.removeEventListener("load", check);
    };
  }, [ready]);

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-b from-white to-brand-soft sm:aspect-[4/3]">
        {ready ? (
          <model-viewer
            ref={viewerRef}
            src={src}
            ios-src={iosSrc ?? undefined}
            poster={poster ?? undefined}
            alt={alt}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="floor"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            touch-action="pan-y"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Replaces the viewer's own AR button, which would sit on top of the model; ours is below. */}
            <span slot="ar-button" hidden></span>
          </model-viewer>
        ) : (
          // The viewer library is still downloading: show the item's picture instead of an empty box.
          <div className="relative grid size-full place-items-center text-muted">
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element -- served from /uploads, already sized
              <img src={poster} alt={alt} className="absolute inset-0 size-full object-contain" />
            )}
            <span className={poster ? "absolute bottom-4 rounded-full bg-white/85 px-4 py-1.5 text-sm shadow" : ""}>
              กำลังโหลดโมเดล 3D…
            </span>
          </div>
        )}
        <p className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs text-muted">
          ลากเพื่อหมุน · ถ่างนิ้วเพื่อซูม
        </p>
      </div>
      {canAr && (
        <button
          type="button"
          onClick={() => {
            if (stat) sendStat("ar", stat.slug, stat.itemId);
            viewerRef.current?.activateAR?.();
          }}
          style={{ marginTop: "12px" }}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-base font-medium text-white shadow-lg active:bg-brand-dark"
        >
          <i className="fa-solid fa-cube" aria-hidden="true"></i> ดูใน AR (วางบนพื้นจริง)
        </button>
      )}
    </div>
  );
}
