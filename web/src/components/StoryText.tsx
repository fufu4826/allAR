"use client";

import { useState } from "react";

/**
 * A site's story. On phones a long story is folded to a few lines with a "read more" button, so the
 * 3D collection below is reached without scrolling through two screens of text. Wide screens always
 * show all of it (the fold and the button exist only in the phone media query, see community.css).
 */
export default function StoryText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 320;

  return (
    <>
      <p id="story-text" className={`intro-text${long && !open ? " intro-text--folded" : ""}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          className="story-toggle"
          aria-expanded={open}
          aria-controls="story-text"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "ย่อเรื่องราว" : "อ่านต่อ"}
          <i className={`fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true"></i>
        </button>
      )}
    </>
  );
}
