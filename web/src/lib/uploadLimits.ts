/** Upload size limits in MB per file kind. Shared by the server check (uploads.ts) and the admin
 *  forms, which warn as soon as a file is picked instead of after a long upload. */
export type UploadKind = "model" | "usdz" | "image" | "audio" | "video";

export const UPLOAD_LIMIT_MB: Record<UploadKind, number> = { model: 100, usdz: 100, image: 15, audio: 30, video: 200 };

/** "12.3 MB" / "850 KB" for a byte count. */
export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Thai problem with a picked file, or null when it can be uploaded. */
export function checkUploadSize(size: number, kind: UploadKind): string | null {
  if (size === 0) return "ไฟล์นี้ว่างเปล่า";
  const limit = UPLOAD_LIMIT_MB[kind];
  if (size > limit * 1024 * 1024) return `ไฟล์ใหญ่ ${formatBytes(size)} เกินขนาดสูงสุด ${limit} MB`;
  return null;
}
