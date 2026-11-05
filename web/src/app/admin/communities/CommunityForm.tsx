"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createCommunityAction, updateCommunityAction, CommunityActionState } from "./actions";

interface CommunityFormProps {
  initialData?: {
    id: string;
    name: string;
    shortName: string;
    slug: string;
    location: string;
    description: string;
    lat: string;
    lng: string;
    color: string;
    coverPath: string | null;
    sortOrder: number;
    isPublished: boolean;
  };
}

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand";
const textareaClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand min-h-[110px]";
const labelClass = "block text-sm font-medium text-ink";
const errorClass = "mt-1 text-xs text-red-600";

export default function CommunityForm({ initialData }: CommunityFormProps) {
  const isEditing = !!initialData;
  const boundAction = isEditing
    ? updateCommunityAction.bind(null, initialData.id)
    : createCommunityAction;

  const [state, formAction, pending] = useActionState<CommunityActionState, FormData>(
    boundAction,
    null
  );

  const [lat, setLat] = useState(initialData?.lat ?? "17.156843");
  const [lng, setLng] = useState(initialData?.lng ?? "104.145892");
  const [color, setColor] = useState(initialData?.color ?? "#e9773e");

  const googleMapsUrl =
    lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : "https://www.google.com/maps";

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
        >
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Name */}
        <div>
          <label className={labelClass}>
            ชื่อชุมชน <span className="text-red-500">*</span>
            <input
              name="name"
              defaultValue={initialData?.name ?? ""}
              required
              maxLength={255}
              placeholder="เช่น ชุมชนบ้านเชียง"
              className={inputClass}
            />
          </label>
          {state?.fieldErrors?.name && <p className={errorClass}>{state.fieldErrors.name}</p>}
        </div>

        {/* Short Name */}
        <div>
          <label className={labelClass}>
            ชื่อย่อชุมชน <span className="text-red-500">*</span>
            <input
              name="shortName"
              defaultValue={initialData?.shortName ?? ""}
              required
              maxLength={120}
              placeholder="เช่น บ้านเชียง"
              className={inputClass}
            />
          </label>
          {state?.fieldErrors?.shortName && (
            <p className={errorClass}>{state.fieldErrors.shortName}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className={labelClass}>
            สลัก URL (Slug) <span className="text-red-500">*</span>
            <input
              name="slug"
              defaultValue={initialData?.slug ?? ""}
              required
              maxLength={64}
              pattern="[a-z0-9\-]+"
              placeholder="เช่น ban-chiang (a-z, 0-9, -)"
              className={inputClass}
            />
          </label>
          <p className="mt-1 text-xs text-muted">ใช้ใน URL ของเว็บไซต์ เช่น /c/ban-chiang</p>
          {state?.fieldErrors?.slug && <p className={errorClass}>{state.fieldErrors.slug}</p>}
        </div>

        {/* Location */}
        <div>
          <label className={labelClass}>
            สถานที่ตั้ง / จังหวัด <span className="text-red-500">*</span>
            <input
              name="location"
              defaultValue={initialData?.location ?? ""}
              required
              maxLength={255}
              placeholder="เช่น อ.หนองหาน จ.อุดรธานี"
              className={inputClass}
            />
          </label>
          {state?.fieldErrors?.location && (
            <p className={errorClass}>{state.fieldErrors.location}</p>
          )}
        </div>

        {/* Latitude */}
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>
              ละติจูด (Latitude) <span className="text-red-500">*</span>
            </label>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline"
            >
              เปิด Google Maps ↗
            </a>
          </div>
          <input
            name="lat"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
            placeholder="เช่น 17.156843"
            className={inputClass}
          />
          {state?.fieldErrors?.lat && <p className={errorClass}>{state.fieldErrors.lat}</p>}
        </div>

        {/* Longitude */}
        <div>
          <label className={labelClass}>
            ลองจิจูด (Longitude) <span className="text-red-500">*</span>
            <input
              name="lng"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
              placeholder="เช่น 104.145892"
              className={inputClass}
            />
          </label>
          {state?.fieldErrors?.lng && <p className={errorClass}>{state.fieldErrors.lng}</p>}
        </div>

        {/* Color */}
        <div>
          <label className={labelClass}>
            สีประจำชุมชน (Hex Color) <span className="text-red-500">*</span>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-10 cursor-pointer rounded-lg border border-line p-0.5"
              />
              <input
                name="color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
                maxLength={7}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#e9773e"
                className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm uppercase outline-none focus:border-brand"
              />
            </div>
          </label>
          {state?.fieldErrors?.color && <p className={errorClass}>{state.fieldErrors.color}</p>}
        </div>

        {/* Sort Order */}
        <div>
          <label className={labelClass}>
            ลำดับการจัดเรียง
            <input
              name="sortOrder"
              type="number"
              min="0"
              defaultValue={initialData?.sortOrder ?? 0}
              className={inputClass}
            />
          </label>
          <p className="mt-1 text-xs text-muted">ตัวเลขน้อยกว่าจะแสดงขึ้นก่อน (ค่าเริ่มต้น 0)</p>
          {state?.fieldErrors?.sortOrder && (
            <p className={errorClass}>{state.fieldErrors.sortOrder}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>
          รายละเอียดเกี่ยวกับชุมชน <span className="text-red-500">*</span>
          <textarea
            name="description"
            defaultValue={initialData?.description ?? ""}
            required
            placeholder="บรรยายความเป็นมา ประวัติ และจุดเด่นของชุมชน..."
            className={textareaClass}
          />
        </label>
        {state?.fieldErrors?.description && (
          <p className={errorClass}>{state.fieldErrors.description}</p>
        )}
      </div>

      {/* Cover Image Upload */}
      <div className="rounded-2xl border border-line bg-paper p-5">
        <label className={labelClass}>
          รูปภาพหน้าปกชุมชน
          <input
            name="coverImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
          />
        </label>
        <p className="mt-2 text-xs text-muted">
          ไฟล์ภาพ (.jpg, .png, .webp) — ขนาดสูงสุด 15 MB
        </p>

        {initialData?.coverPath && (
          <div className="mt-4">
            <span className="text-xs font-medium text-muted">รูปภาพหน้าปกปัจจุบัน:</span>
            <div className="mt-2 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initialData.coverPath}
                alt="หน้าปกชุมชน"
                className="h-24 w-36 rounded-xl border border-line object-cover shadow-sm"
              />
              <span className="text-xs text-muted">
                เลือกไฟล์ใหม่ด้านบนหากต้องการเปลี่ยนรูปหน้าปก
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Published Toggle */}
      <div className="flex items-center gap-3">
        <input
          id="isPublished"
          name="isPublished"
          type="checkbox"
          defaultChecked={initialData?.isPublished ?? false}
          className="size-5 rounded border-line text-brand accent-brand focus:ring-brand"
        />
        <label htmlFor="isPublished" className="cursor-pointer text-sm font-medium text-ink">
          เผยแพร่บนเว็บไซต์ (เปิดให้บุคคลทั่วไปเข้าชมได้)
        </label>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
        <Link
          href="/admin/communities"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper"
        >
          ยกเลิก
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "กำลังบันทึกข้อมูล…" : isEditing ? "บันทึกการแก้ไข" : "สร้างชุมชน"}
        </button>
      </div>
    </form>
  );
}
