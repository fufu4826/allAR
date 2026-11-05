"use client";

import { useActionState } from "react";
import Link from "next/link";
import ModelViewer from "@/components/ModelViewer";
import { createItemAction, updateItemAction, ItemActionState } from "./actions";

interface CollectionGroup {
  communityName: string;
  collections: { id: string; name: string }[];
}

interface ItemFormProps {
  initialData?: {
    id: string;
    collectionId: string;
    name: string;
    description: string;
    modelPath: string | null;
    usdzPath: string | null;
    thumbnailPath: string | null;
    audioPath: string | null;
    isFeatured: boolean;
    isPublished: boolean;
    sortOrder: number;
  };
  collectionGroups: CollectionGroup[];
}

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand";
const textareaClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand min-h-[120px] whitespace-pre-line";
const labelClass = "block text-sm font-medium text-ink";
const errorClass = "mt-1 text-xs text-red-600";

export default function ItemForm({ initialData, collectionGroups }: ItemFormProps) {
  const isEditing = !!initialData;
  const boundAction = isEditing
    ? updateItemAction.bind(null, initialData.id)
    : createItemAction;

  const [state, formAction, pending] = useActionState<ItemActionState, FormData>(
    boundAction,
    null
  );

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

      {/* 3D Model Preview when Editing */}
      {isEditing && initialData?.modelPath && (
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h3 className="mb-2 text-sm font-semibold text-ink">
            ตัวอย่างโมเดล 3D ปัจจุบัน (หมุน / ซูม / ดูใน AR ได้)
          </h3>
          <div className="max-w-md">
            <ModelViewer
              src={initialData.modelPath}
              poster={initialData.thumbnailPath}
              alt={initialData.name}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            ไฟล์ GLB: <span className="font-mono">{initialData.modelPath}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Collection Select */}
        <div>
          <label className={labelClass}>
            แหล่งเรียนรู้ <span className="text-red-500">*</span>
            <select
              name="collectionId"
              defaultValue={initialData?.collectionId ?? ""}
              required
              className={inputClass}
            >
              <option value="">-- เลือกแหล่งเรียนรู้ --</option>
              {collectionGroups.map((group) => (
                <optgroup key={group.communityName} label={`ชุมชน: ${group.communityName}`}>
                  {group.collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {state?.fieldErrors?.collectionId && (
            <p className={errorClass}>{state.fieldErrors.collectionId}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>
            ชื่อชิ้นงาน <span className="text-red-500">*</span>
            <input
              name="name"
              defaultValue={initialData?.name ?? ""}
              required
              maxLength={255}
              placeholder="เช่น ผ้าไหมมัดหมี่โบราณ"
              className={inputClass}
            />
          </label>
          {state?.fieldErrors?.name && <p className={errorClass}>{state.fieldErrors.name}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>
          รายละเอียดชิ้นงาน (ขึ้นบรรทัดใหม่ได้) <span className="text-red-500">*</span>
          <textarea
            name="description"
            defaultValue={initialData?.description ?? ""}
            required
            placeholder="ประวัติ ความเป็นมา เทคนิคการสร้างสรรค์ หรือความสำคัญ..."
            className={textareaClass}
          />
        </label>
        {state?.fieldErrors?.description && (
          <p className={errorClass}>{state.fieldErrors.description}</p>
        )}
      </div>

      {/* Uploads Section */}
      <div className="space-y-4 rounded-2xl border border-line bg-paper p-5">
        <h3 className="font-semibold text-ink">ไฟล์แนบและสื่อดิจิทัล</h3>

        {/* Model GLB */}
        <div className="rounded-xl border border-line bg-white p-4">
          <label className={labelClass}>
            ไฟล์โมเดล 3D (.glb) {!isEditing && <span className="text-red-500">*</span>}
            <input
              name="modelFile"
              type="file"
              accept=".glb"
              required={!isEditing}
              className="mt-2 block w-full text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">
            ไฟล์โมเดล 3D (.glb) — ขนาดสูงสุด 100 MB
            {isEditing && " (เลือกไฟล์ใหม่หากต้องการแทนที่โมเดลเดิม)"}
          </p>
          {state?.fieldErrors?.modelFile && (
            <p className={errorClass}>{state.fieldErrors.modelFile}</p>
          )}
        </div>

        {/* USDZ File */}
        <div className="rounded-xl border border-line bg-white p-4">
          <label className={labelClass}>
            ไฟล์ AR Quick Look สำหรับ Apple iOS (.usdz)
            <input
              name="usdzFile"
              type="file"
              accept=".usdz"
              className="mt-2 block w-full text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">
            ไฟล์ AR สำหรับ iOS (.usdz) — ขนาดสูงสุด 100 MB (ไม่บังคับ)
          </p>
          {initialData?.usdzPath && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="font-mono text-muted">ไฟล์ปัจจุบัน: {initialData.usdzPath}</span>
              <label className="flex items-center gap-1 text-red-600">
                <input type="checkbox" name="removeUsdz" value="true" />
                ลบไฟล์นี้
              </label>
            </div>
          )}
        </div>

        {/* Thumbnail Image */}
        <div className="rounded-xl border border-line bg-white p-4">
          <label className={labelClass}>
            ภาพตัวอย่างชิ้นงาน (Thumbnail)
            <input
              name="thumbnailFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 block w-full text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">
            ไฟล์ภาพ (.jpg, .png, .webp) — ขนาดสูงสุด 15 MB (ไม่บังคับ)
          </p>
          {initialData?.thumbnailPath && (
            <div className="mt-3 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initialData.thumbnailPath}
                alt=""
                className="size-16 rounded-xl border border-line object-cover"
              />
              <div className="text-xs">
                <label className="flex items-center gap-1 text-red-600">
                  <input type="checkbox" name="removeThumbnail" value="true" />
                  ลบภาพตัวอย่างนี้
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Audio File */}
        <div className="rounded-xl border border-line bg-white p-4">
          <label className={labelClass}>
            ไฟล์เสียงบรรยาย
            <input
              name="audioFile"
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
              className="mt-2 block w-full text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">
            ไฟล์เสียง (.mp3, .wav, .m4a) — ขนาดสูงสุด 30 MB (ไม่บังคับ)
          </p>
          {initialData?.audioPath && (
            <div className="mt-3">
              <audio controls src={initialData.audioPath} className="w-full max-w-md" />
              <div className="mt-2 text-xs">
                <label className="flex items-center gap-1 text-red-600">
                  <input type="checkbox" name="removeAudio" value="true" />
                  ลบไฟล์เสียงนี้
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings: Featured, Published, Sort Order */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <p className="mt-1 text-xs text-muted">ตัวเลขน้อยกว่าจะแสดงก่อน (ค่าเริ่มต้น 0)</p>
          {state?.fieldErrors?.sortOrder && (
            <p className={errorClass}>{state.fieldErrors.sortOrder}</p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="isFeatured"
            name="isFeatured"
            type="checkbox"
            defaultChecked={initialData?.isFeatured ?? false}
            className="size-5 rounded border-line text-brand accent-brand focus:ring-brand"
          />
          <label htmlFor="isFeatured" className="cursor-pointer text-sm font-medium text-ink">
            ⭐ ชิ้นงานแนะนำ (Featured)
          </label>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            defaultChecked={initialData?.isPublished ?? true}
            className="size-5 rounded border-line text-brand accent-brand focus:ring-brand"
          />
          <label htmlFor="isPublished" className="cursor-pointer text-sm font-medium text-ink">
            ● เผยแพร่บนเว็บไซต์
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
        <Link
          href="/admin/items"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper"
        >
          ยกเลิก
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "กำลังบันทึกข้อมูล…" : isEditing ? "บันทึกการแก้ไข" : "สร้างชิ้นงาน 3D"}
        </button>
      </div>
    </form>
  );
}
