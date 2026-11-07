"use client";

import { useState, useSyncExternalStore } from "react";
import { androidChromeIntentUrl, detectInAppBrowser, lineExternalUrl, type InAppApp, type MobileOs } from "@/lib/inAppBrowser";

const DISMISS_KEY = "allar-inapp-banner-dismissed";
const APP_NAMES: Record<InAppApp, string> = { line: "LINE", facebook: "Facebook / Messenger", instagram: "Instagram" };

type Env = { app: InAppApp; os: MobileOs; href: string } | null;

// Read the user agent only in the browser. The server snapshot is null, so the banner never
// renders during prerender or SSR and cannot cause a hydration mismatch.
let cached: { key: string; value: Env } | null = null;
function readEnv(): Env {
  const key = `${navigator.userAgent}|${location.href}`;
  if (cached?.key === key) return cached.value;
  let value: Env = null;
  try {
    if (sessionStorage.getItem(DISMISS_KEY) !== "1") {
      const { app, os } = detectInAppBrowser(navigator.userAgent);
      if (app) value = { app, os, href: location.href };
    }
  } catch {
    // sessionStorage can throw in some in-app browsers; still show the banner.
    const { app, os } = detectInAppBrowser(navigator.userAgent);
    if (app) value = { app, os, href: location.href };
  }
  cached = { key, value };
  return value;
}
const noopSubscribe = () => () => {};

export default function InAppBrowserBanner() {
  const env = useSyncExternalStore(noopSubscribe, readEnv, () => null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!env || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(env.href);
      setCopied(true);
    } catch {
      window.prompt("คัดลอกลิงก์นี้ แล้วนำไปเปิดใน Safari", env.href);
    }
  };

  const buttonClass =
    "inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold !text-white hover:bg-brand-dark";

  return (
    <div
      role="region"
      aria-label="คำแนะนำการเปิดเว็บไซต์"
      className="fixed inset-x-3 bottom-3 z-[2000] mx-auto max-w-xl rounded-2xl border border-line bg-white p-4 text-ink shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <i className="fa-solid fa-circle-info mt-1 text-lg text-brand" aria-hidden="true"></i>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">เปิดในเบราว์เซอร์เพื่อใช้งาน AR ได้เต็มที่</p>
          <p className="mt-1 text-sm text-muted">
            คุณกำลังเปิดเว็บผ่านแอป {APP_NAMES[env.app]} ซึ่งปุ่ม &quot;ดูใน AR&quot; อาจใช้งานไม่ได้
            {env.os === "ios" ? " แนะนำให้เปิดใน Safari" : " แนะนำให้เปิดใน Chrome"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {env.app === "line" ? (
              <a href={lineExternalUrl(env.href)} className={buttonClass}>
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> เปิดในเบราว์เซอร์
              </a>
            ) : env.os === "android" ? (
              <a href={androidChromeIntentUrl(env.href)} className={buttonClass}>
                <i className="fa-brands fa-chrome" aria-hidden="true"></i> เปิดใน Chrome
              </a>
            ) : (
              <>
                <p className="w-full text-sm">
                  กด <b>⋯</b> มุมขวาบน แล้วเลือก <b>เปิดใน Safari</b> (Open in Safari)
                </p>
                <button type="button" onClick={copyLink} className={buttonClass}>
                  <i className="fa-solid fa-link" aria-hidden="true"></i> {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}
                </button>
              </>
            )}
            <button type="button" onClick={dismiss} className="rounded-full px-3 py-2 text-sm text-muted hover:bg-brand-soft">
              ดูต่อในแอปนี้
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="ปิดคำแนะนำ" className="-m-1 p-1 text-muted hover:text-ink">
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}
