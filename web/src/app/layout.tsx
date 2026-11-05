import type { Metadata } from "next";
import Link from "next/link";
import { Prompt } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "คลังภูมิปัญญาชุมชน 3D/AR | สถาบันภาษา ศิลปะและวัฒนธรรม มรสน.",
  description:
    "รวมวัตถุพิพิธภัณฑ์ ผลิตภัณฑ์ และภูมิปัญญาของ 5 ชุมชนในจังหวัดสกลนคร ในรูปแบบโมเดล 3 มิติและ AR",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${prompt.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-[1000] border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand text-lg font-bold text-white">
                AR
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold sm:text-base">คลังภูมิปัญญาชุมชน 3D/AR</span>
                <span className="hidden text-xs text-muted sm:block">สถาบันภาษา ศิลปะและวัฒนธรรม มรสน.</span>
              </span>
            </Link>
            <nav className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-sm">
              <Link href="/" className="rounded-full px-3 py-2 hover:bg-brand-soft">หน้าแรก</Link>
              <Link href="/search" className="rounded-full px-3 py-2 hover:bg-brand-soft">ค้นหา</Link>
              <Link href="/about" className="hidden rounded-full px-3 py-2 hover:bg-brand-soft sm:block">เกี่ยวกับ</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-16 bg-ink text-sm text-white/80">
          <div className="mx-auto grid max-w-6xl gap-2 px-4 py-8 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-white">สถาบันภาษา ศิลปะและวัฒนธรรม</p>
              <p>พิพิธภัณฑ์เมืองสกลนคร มหาวิทยาลัยราชภัฏสกลนคร</p>
            </div>
            <p className="sm:text-right">ต้นแบบเว็บไซต์ · ข้อมูลชุมชนที่ 2–5 อยู่ระหว่างจัดเก็บ</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
