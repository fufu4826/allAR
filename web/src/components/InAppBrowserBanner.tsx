"use client";

import "./inAppBrowserBanner.css";
import { useState, useSyncExternalStore } from "react";
import { androidChromeIntentUrl, detectInAppBrowser, lineExternalUrl, type InAppApp, type MobileOs } from "@/lib/inAppBrowser";

const DISMISS_KEY = "allar-inapp-banner-dismissed";
const APP_NAMES: Record<InAppApp, string> = { line: "LINE", facebook: "Facebook", instagram: "Instagram" };

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

  const target = env.os === "ios" ? "Safari" : "Chrome";

  return (
    <div className="iab-overlay" onClick={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="iab-title"
        aria-label="คำแนะนำการเปิดเว็บไซต์"
        className="iab-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={dismiss} aria-label="ปิดคำแนะนำ" className="iab-close">
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>

        <div className="iab-icon" aria-hidden="true">
          <i className="fa-solid fa-cube"></i>
        </div>
        <h2 id="iab-title" className="iab-title">
          เปิดใน {target}
          <br />
          เพื่อดู AR ได้เต็มที่
        </h2>
        <span className="iab-app">ตอนนี้เปิดผ่านแอป {APP_NAMES[env.app]}</span>
        <p className="iab-text">
          ปุ่ม &quot;ดูใน AR&quot; มักใช้ไม่ได้ในแอปแชท
          <br />
          เปิดใน {target} แล้ววางโมเดลบนพื้นได้เลย
        </p>

        {env.app === "line" ? (
          <a href={lineExternalUrl(env.href)} className="iab-primary">
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> เปิดในเบราว์เซอร์
          </a>
        ) : env.os === "android" ? (
          <a href={androidChromeIntentUrl(env.href)} className="iab-primary">
            <i className="fa-brands fa-chrome" aria-hidden="true"></i> เปิดใน Chrome
          </a>
        ) : (
          <>
            <p className="iab-steps">
              1. กดปุ่ม <b>⋯</b> ที่มุมขวาบน
              <br />
              2. เลือก <b>เปิดใน Safari</b> <span className="iab-en">(Open in Safari)</span>
            </p>
            <button type="button" onClick={copyLink} className="iab-primary">
              <i className={copied ? "fa-solid fa-check" : "fa-solid fa-link"} aria-hidden="true"></i>{" "}
              {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}
            </button>
          </>
        )}

        <button type="button" onClick={dismiss} className="iab-secondary">
          ดูต่อในแอปนี้
        </button>
      </div>
    </div>
  );
}
