import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, rename, unlink, writeFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { UPLOAD_LIMIT_MB as limits, type UploadKind as Kind } from "./uploadLimits";
export class UploadError extends Error {}
export async function detectUpload(bytes: Uint8Array, kind: Kind, name: string) {
  if (kind === "model" && Buffer.from(bytes.subarray(0, 4)).equals(Buffer.from("glTF"))) return "glb";
  if (kind === "usdz" && /\.usdz$/i.test(name) && Buffer.from(bytes.subarray(0, 4)).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) return "usdz";
  let type; try { type = await fileTypeFromBuffer(bytes); } catch { /* truncated data */ }
  if (kind === "image" && type && ["jpg", "png", "webp"].includes(type.ext)) return type.ext;
  if (kind === "audio" && type && ["mp3", "wav", "m4a"].includes(type.ext)) return type.ext;
  // Only the two formats every current phone and desktop browser plays.
  if (kind === "video" && type && ["mp4", "webm"].includes(type.ext)) return type.ext;
  throw new UploadError(`ชนิดไฟล์ไม่ถูกต้อง: "${name.slice(0, 80)}" ไม่ใช่ไฟล์${KIND_NAME[kind]}`);
}
const KIND_NAME: Record<Kind, string> = { model: "โมเดล .glb", usdz: " .usdz", image: "ภาพ .jpg .png หรือ .webp", audio: "เสียง .mp3 .wav หรือ .m4a", video: "วิดีโอ .mp4 หรือ .webm" };
function root() { if (!process.env.UPLOAD_DIR) throw new UploadError("ไม่ได้ตั้งค่าที่เก็บไฟล์"); return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR); }
export async function saveUpload(file: File, kind: Kind): Promise<string> {
  if (!file.size) throw new UploadError("ไฟล์ว่างเปล่า");
  if (file.size > limits[kind] * 1024 * 1024) throw new UploadError(`ไฟล์ใหญ่เกินขนาดสูงสุด ${limits[kind]} MB`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = await detectUpload(bytes, kind, file.name);
  const date = new Date(); const dir = path.join(/*turbopackIgnore: true*/ `${kind}s`, String(date.getFullYear()), String(date.getMonth() + 1).padStart(2, "0"));
  const base = root(); const targetDir = path.join(/*turbopackIgnore: true*/ base, dir); await mkdir(targetDir, { recursive: true });
  const realBase = await realpath(base); const realDir = await realpath(targetDir);
  if (!realDir.startsWith(realBase + path.sep)) throw new UploadError("ตำแหน่งไฟล์ไม่ถูกต้อง");
  const name = `${randomBytes(16).toString("hex")}.${ext}`; const tmp = path.join(/*turbopackIgnore: true*/ realDir, `.${name}.tmp`);
  try { await writeFile(tmp, bytes, { flag: "wx" }); await rename(tmp, path.join(/*turbopackIgnore: true*/ realDir, name)); } catch (error) { await unlink(tmp).catch(() => {}); throw error; }
  return `/uploads/${dir.split(path.sep).join("/")}/${name}`;
}
export async function deleteUpload(value: string) {
  if (!value.startsWith("/uploads/") || value.includes("\\") || value.includes("\0")) throw new UploadError("ตำแหน่งไฟล์ไม่ถูกต้อง");
  const base = root(); const target = path.resolve(/*turbopackIgnore: true*/ base, value.slice(9));
  if (!target.startsWith(base + path.sep)) throw new UploadError("ตำแหน่งไฟล์ไม่ถูกต้อง");
  try { const realBase = await realpath(base); const realTarget = await realpath(target); if (!realTarget.startsWith(realBase + path.sep)) throw new UploadError("ตำแหน่งไฟล์ไม่ถูกต้อง"); await unlink(realTarget); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
