"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const SEEN_KEY = "mw-gesture-seen";
const noop = () => () => {};
// Touch screens get a finger; a mouse or trackpad gets a mouse.
const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

type State = "waiting" | "shown" | "leaving" | "mini";

/**
 * Motion hint over the 3D map: a mouse (or a finger on touch screens) slides left and right to
 * show that dragging turns the map. Shown large in the middle once per visit, after the map has
 * loaded; on the first touch, drag or wheel (or after a few seconds) it shrinks into a small
 * reminder in the bottom-right corner, which brings the large hint back when pressed.
 */
export default function MapGestureHint({ ready, targetRef }: { ready: boolean; targetRef: React.RefObject<HTMLElement | null> }) {
  const touch = useSyncExternalStore(noop, isTouch, () => false);
  const [state, setState] = useState<State>("waiting");

  useEffect(() => {
    if (!ready || state !== "waiting") return;
    const show = window.setTimeout(() => {
      let seen = false;
      try {
        seen = sessionStorage.getItem(SEEN_KEY) === "1";
      } catch {
        // Private mode without storage: show it.
      }
      setState(seen ? "mini" : "shown");
    }, 500);
    return () => window.clearTimeout(show);
  }, [ready, state]);

  useEffect(() => {
    if (state !== "shown") return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Ignore: the hint may show large again next visit.
    }
    const leave = () => setState("leaving");
    const target = targetRef.current;
    target?.addEventListener("pointerdown", leave, { once: true });
    target?.addEventListener("wheel", leave, { once: true, passive: true });
    const timer = window.setTimeout(leave, 6500);
    return () => {
      target?.removeEventListener("pointerdown", leave);
      target?.removeEventListener("wheel", leave);
      window.clearTimeout(timer);
    };
  }, [state, targetRef]);

  useEffect(() => {
    if (state !== "leaving") return;
    const end = window.setTimeout(() => setState("mini"), 400);
    return () => window.clearTimeout(end);
  }, [state]);

  const icon = `fa-solid ${touch ? "fa-hand-pointer" : "fa-computer-mouse"}`;

  if (state === "mini") {
    return (
      <button
        type="button"
        className="mw-gesture-mini"
        onClick={() => setState("shown")}
        aria-label={touch ? "วิธีใช้: ใช้นิ้วลากเพื่อหมุนแผนที่" : "วิธีใช้: ลากเมาส์เพื่อหมุนแผนที่"}
        title={touch ? "ใช้นิ้วลากเพื่อหมุนแผนที่" : "กดเมาส์ค้างแล้วลากเพื่อหมุนแผนที่"}
      >
        <span className="mw-gesture-mini-icon" aria-hidden="true">
          <i className="fa-solid fa-caret-left"></i>
          <i className={icon}></i>
          <i className="fa-solid fa-caret-right"></i>
        </span>
        <span className="mw-gesture-mini-text">ลากเพื่อหมุน</span>
      </button>
    );
  }

  if (state !== "shown" && state !== "leaving") return null;

  return (
    <div className={`mw-gesture ${state === "leaving" ? "leaving" : ""}`} role="note">
      <div className="mw-gesture-track" aria-hidden="true">
        <i className="fa-solid fa-chevron-left mw-gesture-arrow left"></i>
        <span className="mw-gesture-trail"></span>
        <span className="mw-gesture-hand">
          <i className={icon}></i>
          <span className="mw-gesture-press"></span>
        </span>
        <i className="fa-solid fa-chevron-right mw-gesture-arrow right"></i>
      </div>
      <p className="mw-gesture-text">
        <span>{touch ? "ใช้นิ้วลากซ้าย-ขวา" : "กดเมาส์ค้างแล้วลากซ้าย-ขวา"}</span> <span>เพื่อหมุนแผนที่</span>
      </p>
      <p className="mw-gesture-sub">
        <span>{touch ? "ใช้สองนิ้วถ่าง-หุบ" : "หมุนลูกกลิ้งเมาส์"}</span> <span>เพื่อซูม</span>
      </p>
    </div>
  );
}
