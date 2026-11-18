/** YouTube links of the learning-site videos. Pure, so it can be unit-tested. */

const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The video ID from what an admin pastes: a youtu.be share link (with or without ?si=…),
 * a watch?v= link, a shorts/embed/live link, or the bare 11-character ID. Null if it is none of them.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [first, second] = url.pathname.split("/").slice(1);
    id = first === "watch" ? url.searchParams.get("v") : ["shorts", "embed", "live", "v"].includes(first) ? second ?? null : null;
  }
  return id && ID.test(id) ? id : null;
}

/** The public watch link, without tracking parameters. */
export const youTubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** The privacy-enhanced player (youtube-nocookie.com: no YouTube cookies until the video plays). */
export function youTubeEmbedUrl(id: string, { autoplay = false } = {}) {
  const params = new URLSearchParams({ rel: "0", playsinline: "1", ...(autoplay ? { autoplay: "1" } : {}) });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
