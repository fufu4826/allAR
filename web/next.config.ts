import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // ต้นแบบ: ไฟล์โมเดล/รูป/เสียงของภูพานยังอยู่บน R2 ซึ่งไม่เปิด CORS ให้โดเมนอื่น
  // จึงส่งต่อผ่านโดเมนเดียวกัน เมื่อขึ้นเซิร์ฟเวอร์มหาลัยจะย้ายไฟล์มาไว้ที่ /uploads แทน
  async rewrites() {
    return [
      {
        source: "/r2/:path*",
        destination: "https://pub-b7cd49a1aa5b4bb1ba339dfd78d4ec75.r2.dev/:path*",
      },
    ];
  },
};

export default nextConfig;
