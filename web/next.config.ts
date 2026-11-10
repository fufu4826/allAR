import type { NextConfig } from "next";

// Content-Security-Policy: everything is served from this site; the only outside source is the
// OpenStreetMap tiles of the 2D map. Next.js and model-viewer need inline scripts/styles, blob:
// (model textures, workers) and WebAssembly (the mesh/texture decoders in /public/decoders).
// Cloudflare Web Analytics (the beacon Cloudflare adds when the site sits behind it) is allowed too.
// Development also needs eval and a websocket for hot reload.
const dev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://static.cloudflareinsights.com${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  `connect-src 'self' data: blob: https://cloudflareinsights.com${dev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  // Do not advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: csp },
        // Browsers apply this only over HTTPS. No includeSubDomains: other services share the parent domain.
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
      ] },
      { source: "/admin/:path*", headers: [
        { key: "Cache-Control", value: "no-store" },
        { key: "X-Robots-Tag", value: "noindex" },
      ] },
    ];
  },
  experimental: {
    serverActions: {
      // Admin item form can carry model 100 MB + USDZ 100 MB + image 15 MB + audio 30 MB.
      // The reverse proxy must allow the same (nginx client_max_body_size 260m).
      bodySizeLimit: "260mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
