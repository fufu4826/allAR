"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};
const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** Share this page: the phone's own share sheet (LINE, Facebook, Messenger...) and a copy-link button. */
export default function ShareButtons({ title }: { title: string }) {
  const nativeShare = useSyncExternalStore(noop, canShare, () => false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("คัดลอกลิงก์นี้", window.location.href);
    }
  };

  return (
    <div className="share-buttons">
      {nativeShare && (
        <button
          type="button"
          className="share-btn share-btn--primary"
          onClick={() => navigator.share({ title, url: window.location.href }).catch(() => {})}
        >
          <i className="fa-solid fa-share-nodes" aria-hidden="true"></i> แชร์
        </button>
      )}
      <button type="button" className="share-btn" onClick={copy} aria-live="polite">
        <i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`} aria-hidden="true"></i>
        {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}
      </button>
    </div>
  );
}
