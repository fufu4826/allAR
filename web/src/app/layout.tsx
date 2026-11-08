import type { Metadata } from "next";
import { Kanit, Noto_Sans_Thai_Looped, Prompt, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { siteDescription, siteOpenGraph, siteTitle } from "@/content/seo";

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

// Phu Phan pages use the fonts of the original Phu Phan AR site (see phuphan-theme.css).
const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
  preload: false,
});

const notoLooped = Noto_Sans_Thai_Looped({
  variable: "--font-noto-looped",
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  preload: false,
});

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  openGraph: siteOpenGraph,
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${prompt.variable} ${spaceGrotesk.variable} ${kanit.variable} ${notoLooped.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
