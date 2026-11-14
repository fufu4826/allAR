import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const types: Record<string, string> = {
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".usdz": "model/vnd.usdz+zip",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\0") || part.includes("/") || part.includes("\\") || path.isAbsolute(part))) return new Response(null, { status: 404 });
  const type = types[path.extname(parts[parts.length - 1]).toLowerCase()];
  if (!type) return new Response(null, { status: 404 });
  try {
    const root = await realpath(path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? path.resolve(/*turbopackIgnore: true*/ process.cwd(), "../data-bundle/uploads")));
    const file = await realpath(path.resolve(root, ...parts));
    const relative = path.relative(root, file);
    if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return new Response(null, { status: 404 });
    const info = await stat(file);
    if (!info.isFile()) return new Response(null, { status: 404 });
    let start = 0;
    let end = info.size - 1;
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2]) || info.size === 0) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
      if (!match[1]) {
        const suffix = Number(match[2]);
        if (!Number.isSafeInteger(suffix) || suffix <= 0) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
        start = Math.max(0, info.size - suffix);
      } else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(Number(match[2]), end);
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    // Video and audio stay out of the Cloudflare cache: it stores them without a length (Next.js
    // streams the body) and then answers byte-range requests with the whole file, which iPhone
    // Safari refuses to play. Uncached, the range goes through to this route and comes back 206.
    const headers = new Headers({ "Content-Type": type, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes", "Cache-Control": type.startsWith("video/") || type.startsWith("audio/") ? "private, max-age=2592000, immutable" : "public, max-age=2592000, immutable", "X-Content-Type-Options": "nosniff" });
    if (range) headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    const body = info.size ? Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream : null;
    return new Response(body, { status: range ? 206 : 200, headers });
  } catch {
    return new Response(null, { status: 404 });
  }
}
