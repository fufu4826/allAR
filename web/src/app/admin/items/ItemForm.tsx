"use client";

import { useActionState } from "react";
import Link from "next/link";
import FileField from "../FileField";
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
  /** Category picked in advance (from "add item" in a filtered list). */
  defaultCollectionId?: string;
  collectionGroups: CollectionGroup[];
}

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand";
const labelClass = "block text-sm font-medium text-ink";
const hintClass = "mt-1 text-xs text-muted";
const errorClass = "mt-1 text-xs text-red-600";

export default function ItemForm({ initialData, defaultCollectionId, collectionGroups }: ItemFormProps) {
  const isEditing = !!initialData;
  const boundAction = isEditing ? updateItemAction.bind(null, initialData.id) : createItemAction;
  const [state, formAction, pending] = useActionState<ItemActionState, FormData>(boundAction, null);
  const err = (key: string) => state?.fieldErrors?.[key] && <p className={errorClass}>{state.fieldErrors[key]}</p>;

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {state.error}
        </div>
      )}

      <fieldset className="space-y-5 rounded-2xl border border-line bg-paper/60 p-5">
        <legend className="px-1 text-base font-semibold text-ink">ข้อมูลชิ้นงาน</legend>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              แหล่งเรียนรู้ / หมวดหมู่ <span className="text-red-500">*</span>
              <select name="collectionId" defaultValue={initialData?.collectionId ?? defaultCollectionId ?? ""} required className={inputClass}>
                <option value="">-- เลือกหมวดหมู่ --</option>
                {collectionGroups.map((group) => (
                  <optgroup key={group.communityName} label={group.communityName}>
                    {group.collections.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <p className={hintClass}>ถ้ายังไม่มีหมวดที่ต้องการ เพิ่มได้ที่เมนู แหล่งเรียนรู้ → หมวดหมู่</p>
            {err("collectionId")}
          </div>
          <div>
            <label className={labelClass}>
              ชื่อชิ้นงาน <span className="text-red-500">*</span>
              <input name="name" defaultValue={initialData?.name ?? ""} required maxLength={255} placeholder="เช่น พระพุทธรูปปางมารวิชัย" className={inputClass} />
            </label>
            {err("name")}
          </div>
        </div>
        <div>
          <label className={labelClass}>
            คำอธิบาย <span className="text-red-500">*</span>
            <textarea
              name="description"
              defaultValue={initialData?.description ?? ""}
              required
              placeholder="ประวัติ ความเป็นมา ลักษณะเด่น หรือความสำคัญ"
              className={`${inputClass} min-h-[160px]`}
            />
          </label>
          <p className={hintClass}>แสดงใต้โมเดลในหน้าชิ้นงาน และใช้ในการค้นหา เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่</p>
          {err("description")}
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-line bg-paper/60 p-5">
        <legend className="px-1 text-base font-semibold text-ink">ไฟล์</legend>
        <p className="-mt-2 text-xs text-muted">
          เลือกไฟล์แล้วจะเห็นตัวอย่างทันที ไฟล์จะถูกอัปโหลดตอนกดบันทึก โมเดลควรย่อด้วย optimize-media ก่อน ให้เหลือไม่เกินราว 15 MB เพื่อให้เปิดบนมือถือได้เร็ว
        </p>
        <FileField name="modelFile" kind="model" label="โมเดล 3D" required={!isEditing} current={initialData?.modelPath} />
        <FileField
          name="thumbnailFile"
          kind="image"
          label="ภาพตัวอย่าง"
          hint="ภาพสี่เหลี่ยมจัตุรัส แสดงในรายการชิ้นงานและระหว่างโหลดโมเดล"
          current={initialData?.thumbnailPath}
          removeName="removeThumbnail"
          removeLabel="ลบภาพตัวอย่างนี้"
        />
        <FileField
          name="audioFile"
          kind="audio"
          label="เสียงบรรยาย"
          hint="ไม่บังคับ มีปุ่มฟังเสียงในหน้าชิ้นงาน"
          current={initialData?.audioPath}
          removeName="removeAudio"
          removeLabel="ลบเสียงบรรยายนี้"
        />
        <FileField
          name="usdzFile"
          kind="usdz"
          label="ไฟล์ AR สำหรับ iPhone/iPad"
          hint="ไม่บังคับ ถ้าไม่มี iPhone จะแปลงจากโมเดล 3D ให้เอง"
          current={initialData?.usdzPath}
          removeName="removeUsdz"
          removeLabel="ลบไฟล์นี้"
        />
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-paper/60 p-5">
        <legend className="px-1 text-base font-semibold text-ink">การแสดงผล</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>
              ลำดับ
              <input name="sortOrder" type="number" min="0" defaultValue={initialData?.sortOrder ?? 0} className={inputClass} />
            </label>
            <p className={hintClass}>เลขน้อยแสดงก่อนในหมวดเดียวกัน</p>
            {err("sortOrder")}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:mt-6">
            <input name="isPublished" type="checkbox" defaultChecked={initialData?.isPublished ?? true} className="mt-0.5 size-5 accent-brand" />
            <span className="text-sm">
              <span className="font-medium text-ink">เผยแพร่</span>
              <span className="block text-xs text-muted">ไม่เลือก = ฉบับร่าง ผู้เข้าชมมองไม่เห็น</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 sm:mt-6">
            <input name="isFeatured" type="checkbox" defaultChecked={initialData?.isFeatured ?? false} className="mt-0.5 size-5 accent-brand" />
            <span className="text-sm">
              <span className="font-medium text-ink">⭐ ชิ้นงานแนะนำ</span>
              <span className="block text-xs text-muted">ขึ้นในแถว &quot;ชิ้นงานแนะนำ&quot; ของหน้าแหล่งเรียนรู้</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-line bg-white/95 px-6 py-4 backdrop-blur">
        {pending && <span className="mr-auto text-xs text-muted">กำลังอัปโหลดและบันทึก ไฟล์ใหญ่อาจใช้เวลาหลายนาที อย่าปิดหน้านี้</span>}
        <Link href="/admin/items" className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper">
          ยกเลิก
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก…" : isEditing ? "บันทึก" : "เพิ่มชิ้นงาน"}
        </button>
      </div>
    </form>
  );
}
