/**
 * Detect chat/social apps' built-in browsers, where WebAR often fails, and build links that
 * reopen the page in a real browser. Pure functions; unit-tested in inAppBrowser.test.ts.
 */

export type InAppApp = "line" | "facebook" | "instagram";
export type MobileOs = "android" | "ios" | "other";

export function detectInAppBrowser(userAgent: string): { app: InAppApp | null; os: MobileOs } {
  const ua = userAgent || "";
  const os: MobileOs = /Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) ? "ios" : "other";
  let app: InAppApp | null = null;
  // Instagram's UA also carries FBAN/FBAV on some builds, so check it first.
  if (/Instagram/i.test(ua)) app = "instagram";
  else if (/\bLine\//.test(ua)) app = "line";
  else if (/FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(ua)) app = "facebook";
  return { app, os };
}

/** LINE opens the page in the phone's default browser when this query parameter is present. */
export function lineExternalUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.set("openExternalBrowser", "1");
  return url.toString();
}

/** Android intent that opens the same https URL in Chrome. */
export function androidChromeIntentUrl(href: string): string {
  const url = new URL(href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=com.android.chrome;end`;
}
