import type { Metadata } from "next";
import { Prompt, Space_Grotesk } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "AR Heritage & Identity | นวัตกรรมเทคโนโลยี 3D AR สู่ 5 แหล่งอัตลักษณ์สำคัญ",
  description:
    "การประยุกต์ใช้นวัตกรรม 3D Photogrammetry และเทคโนโลยี WebAR เชื่อมโยงมรดกทางวัฒนธรรม ประวัติศาสตร์ สถาปัตยกรรม และภูมิปัญญาท้องถิ่น 5 แหล่งอัตลักษณ์สำคัญ จังหวัดสกลนคร",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${prompt.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
