"use client";

import { useEffect, useState } from "react";
import ModelViewer from "@/components/ModelViewer";
import { checkUploadSize, formatBytes, UPLOAD_LIMIT_MB, type UploadKind } from "@/lib/uploadLimits";

const ACCEPT: Record<UploadKind, string> = {
  model: ".glb",
  usdz: ".usdz",
  image: "image/jpeg,image/png,image/webp",
  audio: "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,.m4a",
  video: "video/mp4,video/webm",
};
const TYPES: Record<UploadKind, string> = {
  model: ".glb",
  usdz: ".usdz",
  image: ".jpg .png .webp",
  audio: ".mp3 .wav .m4a",
  video: ".mp4 .webm",
};

function Preview({ kind, src, alt }: { kind: UploadKind; src: string; alt: string }) {
  if (kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element -- local preview or /uploads file
    return <img src={src} alt={alt} className="max-h-48 w-auto max-w-full rounded-xl border border-line object-contain" />;
  }
  if (kind === "audio") return <audio controls src={src} className="w-full max-w-md" />;
  if (kind === "video") {
    return <video src={src} controls preload="metadata" className="aspect-video w-full max-w-md rounded-xl border border-line bg-black" />;
  }
  if (kind === "model") {
    return (
      <div className="max-w-sm">
        <ModelViewer src={src} alt={alt} />
      </div>
    );
  }
  return null;
}

/**
 * File input of the admin forms. Shows the current file, checks the picked file's size at once
 * (the form will not submit with a file over the limit), and previews it before saving:
 * pictures, sound, video, and the 3D model itself.
 */
export default function FileField({
  name,
  kind,
  label,
  hint,
  required,
  current,
  removeName,
  removeLabel,
}: {
  name: string;
  kind: UploadKind;
  label: string;
  hint?: string;
  required?: boolean;
  /** Path of the file saved now, if any. */
  current?: string | null;
  /** Checkbox name that removes the current file (optional files only). */
  removeName?: string;
  removeLabel?: string;
}) {
  const [picked, setPicked] = useState<{ name: string; size: number; url: string; error: string | null } | null>(null);

  // Free the previous preview URL when another file is picked or the form goes away.
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.url); }, [picked]);

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <label className="block text-sm font-medium text-ink">
        {label} {required && <span className="text-red-500">*</span>}
        <input
          name={name}
          type="file"
          accept={ACCEPT[kind]}
          required={required}
          onChange={(e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            if (!file) { setPicked(null); input.setCustomValidity(""); return; }
            const error = checkUploadSize(file.size, kind);
            input.setCustomValidity(error ?? "");
            if (error) input.reportValidity();
            setPicked({ name: file.name, size: file.size, url: URL.createObjectURL(file), error });
          }}
          className="mt-2 block w-full text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
        />
      </label>
      <p className="mt-1.5 text-xs text-muted">
        {TYPES[kind]} ขนาดไม่เกิน {UPLOAD_LIMIT_MB[kind]} MB{hint ? ` · ${hint}` : ""}
      </p>

      {picked && (
        <div className="mt-3 space-y-2">
          <p className={`text-xs ${picked.error ? "font-medium text-red-600" : "text-emerald-700"}`}>
            {picked.error ? `✕ ${picked.error}` : `✓ เลือกแล้ว: ${picked.name} (${formatBytes(picked.size)}) จะบันทึกเมื่อกดปุ่มบันทึก`}
          </p>
          {!picked.error && <Preview kind={kind} src={picked.url} alt={picked.name} />}
        </div>
      )}

      {current && !picked && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted">ไฟล์ปัจจุบัน:</p>
          {kind === "usdz" ? <p className="break-all font-mono text-xs text-muted">{current}</p> : <Preview kind={kind} src={current} alt={label} />}
          {removeName && (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-red-700">
              <input type="checkbox" name={removeName} value="true" className="size-4 accent-red-600" />
              {removeLabel ?? "ลบไฟล์นี้"}
            </label>
          )}
          <p className="text-xs text-muted">เลือกไฟล์ใหม่ด้านบนเพื่อแทนที่ไฟล์นี้</p>
        </div>
      )}
    </div>
  );
}
