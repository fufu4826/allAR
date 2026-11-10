"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Shown when a page fails while rendering (for example the database cannot be reached),
// instead of the browser's blank error screen.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">ขออภัย หน้านี้แสดงผลไม่สำเร็จ</h1>
      <p className="max-w-md text-muted">ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ให้กลับไปที่หน้าแรก</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          ลองใหม่อีกครั้ง
        </button>
        {/* A plain link on purpose: a full page load recovers from errors a client navigation would repeat. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="rounded-full border border-line px-5 py-2.5 font-medium hover:bg-brand-soft">
          กลับหน้าแรก
        </a>
      </div>
    </main>
  );
}
