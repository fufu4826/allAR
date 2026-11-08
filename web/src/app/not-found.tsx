import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ไม่พบหน้านี้ | แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="text-2xl font-semibold">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="max-w-md text-muted">ลิงก์นี้อาจพิมพ์ผิด หรือเนื้อหาถูกย้ายหรือนำออกไปแล้ว</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-brand px-5 py-2.5 font-medium !text-white hover:bg-brand-dark">
          กลับหน้าแรก
        </Link>
        <Link href="/map" className="rounded-full border border-line px-5 py-2.5 font-medium hover:bg-brand-soft">
          ไปที่แผนที่ 5 แหล่งเรียนรู้
        </Link>
      </div>
    </main>
  );
}
