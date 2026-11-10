export const siteTitle = "แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง";
export const siteDescription =
  "การประยุกต์ใช้โมเดล 3 มิติและเทคโนโลยี WebAR เชื่อมโยงมรดกทางวัฒนธรรม ประวัติศาสตร์ สถาปัตยกรรม และภูมิปัญญาท้องถิ่น 5 แหล่งเรียนรู้สำคัญ จังหวัดสกลนคร";
export const siteOpenGraph = {
  type: "website",
  locale: "th_TH",
  siteName: "แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง",
  title: siteTitle,
  description: siteDescription,
} as const;
export const shareImage = {
  url: "/brand/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "แหล่งเรียนรู้และพิพิธภัณฑ์ท้องถิ่นจังหวัดสกลนครเสมือนจริง เปิดประตูสู่ 5 แหล่งเรียนรู้ เมืองสกลนคร",
};

/** Metadata for one page: its own title, a one-line description and, when it has one, its own picture.
 *  `openGraph` replaces the layout's object as a whole, so the shared fields are repeated here. */
export function pageMetadata(name: string, text: string | null | undefined, image: string | null | undefined) {
  const title = `${name} | ${siteTitle}`;
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  const description = flat ? (flat.length > 160 ? `${flat.slice(0, 157)}…` : flat) : siteDescription;
  const images = image ? [{ url: image, alt: name }] : [shareImage];
  return {
    title,
    description,
    openGraph: { ...siteOpenGraph, title, description, images },
    twitter: { card: "summary_large_image" as const, title, description, images: images.map((i) => i.url) },
  };
}
