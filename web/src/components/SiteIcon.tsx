import type { CSSProperties } from "react";
import { siteIcon } from "@/content/siteIcons";

/** A learning site's icon (see content/siteIcons.ts). Sized by the surrounding font-size, like a Font Awesome icon. */
export default function SiteIcon({ slug, style }: { slug: string; style?: CSSProperties }) {
  const icon = siteIcon(slug);
  if (icon.kind === "fa") return <i className={icon.className} style={style} aria-hidden="true"></i>;
  return (
    <svg
      className="site-icon"
      viewBox="0 0 64 64"
      fill="currentColor"
      style={style}
      aria-hidden="true"
      // Static paths from content/siteIcons.ts, never user input.
      dangerouslySetInnerHTML={{ __html: icon.paths }}
    />
  );
}
