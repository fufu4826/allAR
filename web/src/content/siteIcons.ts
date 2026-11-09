/**
 * One icon per learning site, used everywhere the site is named (map labels and cards, home page,
 * site page, About page, footer) so they always match.
 * Tha Rae and Phu Phan use Font Awesome; the three others are drawn for this project from photos of
 * the real buildings (64x64, filled with currentColor). Chosen by the project owner on 2026-11-09.
 */

const SVG_PATHS: Record<string, string> = {
  // วัดกลางศรีเชียงใหม่: hip roof with a front gable, door, two windows and front steps.
  watklang:
    '<path fill-rule="evenodd" d="M32 6l29 27H3zM32 14L46 31H18zM32 19l10 11H22z"/><path d="M3 33h58v3H3z"/><path fill-rule="evenodd" d="M8 36h48v18H8zM27 40h10v14H27zM12 40h11v7H12zM41 40h11v7H41z"/><path d="M6 54h52v3H6z"/><path d="M26 57h12v2H26zM24 59h16v3H24z"/>',
  // วัดมหาพรหมโพธิราช: the chedi, proportions taken from the photo (spire, tapering shaft, flared middle, tiers, stepped base).
  watnuea:
    '<path d="M32 0.83L33.33 8.53H30.67z"/><path d="M28.95 9.17H35.05L36.13 25.57H27.87z"/><path d="M27.08 26.29H36.92V28.65H27.08z"/><path d="M26.68 29.08H37.32L38.1 38.06Q38.3 39.69 38.99 40.03H25.01Q25.7 39.69 25.9 38.06z"/><path d="M23.53 40.55H40.47V43.71H23.53z"/><path d="M22.65 44.27H41.35V47.48H22.65z"/><path d="M24.62 47.91H39.38V50.05H42.58V52.19H44.9V54.67H19.1V52.19H21.42V50.05H24.62z"/><path d="M17.23 55.27H46.77V61.18H17.23z"/>',
  // บ้านโนนหอม: a house raised on posts with an open sun deck (ชานแดด).
  nonhom:
    '<path d="M22 6 42 20H2z"/><path fill-rule="evenodd" d="M6 21h32v15H6zM18 25h7v11h-7z"/><path d="M3 36h58v3H3z"/><path d="M40 30h21v2H40zM42 32h2v4h-2zM50 32h2v4h-2zM58 32h2v4h-2z"/><path d="M6 39h4v23H6zM22 39h4v23h-4zM38 39h4v23h-4zM55 39h4v23h-4z"/>',
};

const FA_CLASSES: Record<string, string> = {
  tharae: "fa-solid fa-church",
  phuphan: "fa-solid fa-seedling",
};

const FALLBACK = "fa-solid fa-location-dot";

export type SiteIconDef = { kind: "svg"; paths: string } | { kind: "fa"; className: string };

export function siteIcon(slug: string): SiteIconDef {
  const paths = SVG_PATHS[slug];
  if (paths) return { kind: "svg", paths };
  return { kind: "fa", className: FA_CLASSES[slug] ?? FALLBACK };
}

/** The icon as an HTML string, for places that build markup by hand (Leaflet markers). */
export function siteIconHtml(slug: string): string {
  const icon = siteIcon(slug);
  return icon.kind === "svg"
    ? `<svg class="site-icon" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">${icon.paths}</svg>`
    : `<i class="${icon.className}" aria-hidden="true"></i>`;
}
