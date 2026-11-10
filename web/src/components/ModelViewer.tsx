"use client";

import { useEffect, useState } from "react";

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
}: {
  src: string;
  /** USDZ for AR Quick Look on iPhone/iPad; without it the GLB is converted on the device. */
  iosSrc?: string | null;
  poster?: string | null;
  alt: string;
}) {
  const [ready, setReady] = useState(false);

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

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-b from-white to-brand-soft sm:aspect-[4/3]">
      {ready ? (
        <model-viewer
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
          <button
            slot="ar-button"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-6 py-3 font-medium text-white shadow-lg"
          >
            ดูใน AR (วางบนพื้นจริง)
          </button>
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
  );
}
