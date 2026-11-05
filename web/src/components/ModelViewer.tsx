"use client";

import { useEffect, useState } from "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
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

export default function ModelViewer({ src, poster, alt }: { src: string; poster?: string | null; alt: string }) {
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
        <div className="grid size-full place-items-center text-muted">กำลังโหลดโมเดล 3D…</div>
      )}
      <p className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs text-muted">
        ลากเพื่อหมุน · ถ่างนิ้วเพื่อซูม
      </p>
    </div>
  );
}
