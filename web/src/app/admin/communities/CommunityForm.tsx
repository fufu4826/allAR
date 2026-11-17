"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import FileField from "../FileField";
import { updateCommunityAction, CommunityActionState } from "./actions";

interface CommunityFormProps {
  initialData: {
    id: string;
    name: string;
    shortName: string;
    englishName: string | null;
    tagline: string | null;
    tags: string | null;
    theme: string;
    slug: string;
    location: string;
    description: string;
    lat: string;
    lng: string;
    color: string;
    coverPath: string | null;
    videoPath: string | null;
    sortOrder: number;
    isPublished: boolean;
  };
}

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand";
const labelClass = "block text-sm font-medium text-ink";
const hintClass = "mt-1 text-xs text-muted";
const errorClass = "mt-1 text-xs text-red-600";

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-line bg-paper/60 p-5">
      <legend className="px-1 text-base font-semibold text-ink">{title}</legend>
      {note && <p className="-mt-2 text-xs text-muted">{note}</p>}
      {children}
    </fieldset>
  );
}

export default function CommunityForm({ initialData }: CommunityFormProps) {
  const boundAction = updateCommunityAction.bind(null, initialData.id);
  const [state, formAction, pending] = useActionState<CommunityActionState, FormData>(boundAction, null);
  const [lat, setLat] = useState(initialData.lat);
  const [lng, setLng] = useState(initialData.lng);
  const [color, setColor] = useState(initialData.color);
  const err = (key: string) => state?.fieldErrors?.[key] && <p className={errorClass}>{state.fieldErrors[key]}</p>;
  const mapsUrl =
    lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)) ? `https://www.google.com/maps?q=${lat},${lng}` : "https://www.google.com/maps";

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {state.error}
        </div>
      )}

      <Section title="ชื่อและข้อความ" note="ข้อความเหล่านี้แสดงที่ส่วนหัวของหน้าแหล่งเรียนรู้ บนแผนที่ และในผลการค้นหา">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>
              ชื่อเต็ม <span className="text-red-500">*</span>
              <input name="name" defaultValue={initialData.name} required maxLength={255} className={inputClass} />
            </label>
            <p className={hintClass}>หัวเรื่องใหญ่ของหน้าแหล่งเรียนรู้ และชื่อแท็บเบราว์เซอร์ ถ้ามีคำว่า &quot;ชุมชน…&quot; จะขึ้นบรรทัดใหม่ก่อนคำนั้นเอง</p>
            {err("name")}
          </div>
          <div>
            <label className={labelClass}>
              ชื่อสั้น <span className="text-red-500">*</span>
              <input name="shortName" defaultValue={initialData.shortName} required maxLength={120} className={inputClass} />
            </label>
            <p className={hintClass}>ใช้ในการ์ดบนแผนที่ รายการแหล่งเรียนรู้ และสถิติ</p>
            {err("shortName")}
          </div>
          <div>
            <label className={labelClass}>
              ชื่อภาษาอังกฤษ
              <input name="englishName" defaultValue={initialData.englishName ?? ""} maxLength={120} className={inputClass} />
            </label>
            <p className={hintClass}>แสดงตัวเล็กบนการ์ดแผนที่</p>
            {err("englishName")}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              คำโปรย
              <input name="tagline" defaultValue={initialData.tagline ?? ""} maxLength={255} className={inputClass} />
            </label>
            <p className={hintClass}>ประโยคสั้นใต้ชื่อในส่วนหัว และคำอธิบายเวลาแชร์ลิงก์</p>
            {err("tagline")}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              แท็ก
              <input name="tags" defaultValue={initialData.tags ?? ""} maxLength={255} placeholder="เช่น ศาสนา · ประวัติศาสตร์ · สถาปัตยกรรม" className={inputClass} />
            </label>
            <p className={hintClass}>คำสั้น ๆ ใต้คำโปรย คั่นด้วย ·</p>
            {err("tags")}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              คำอธิบาย <span className="text-red-500">*</span>
              <textarea name="description" defaultValue={initialData.description} required className={`${inputClass} min-h-[160px]`} />
            </label>
            <p className={hintClass}>แสดงในส่วน &quot;เรื่องราว&quot; ของหน้าแหล่งเรียนรู้ เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่</p>
            {err("description")}
          </div>
        </div>
      </Section>

      <Section title="ที่ตั้ง" note="พิกัดใช้วางหมุดบนแผนที่และลิงก์นำทางของ Google Maps">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>
              ที่อยู่ <span className="text-red-500">*</span>
              <input name="location" defaultValue={initialData.location} required maxLength={255} className={inputClass} />
            </label>
            {err("location")}
          </div>
          <div>
            <label className={labelClass}>
              ละติจูด <span className="text-red-500">*</span>
              <input name="lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required className={inputClass} />
            </label>
            {err("lat")}
          </div>
          <div>
            <label className={labelClass}>
              ลองจิจูด <span className="text-red-500">*</span>
              <input name="lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} required className={inputClass} />
            </label>
            {err("lng")}
          </div>
        </div>
        <p className="text-xs text-muted">
          หาพิกัด: เปิด Google Maps คลิกขวาที่จุดที่ต้องการ แล้วคลิกตัวเลขบรรทัดแรกเพื่อคัดลอก ·{" "}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
            ตรวจพิกัดนี้ใน Google Maps ↗
          </a>
        </p>
      </Section>

      <Section title="ภาพและวีดิทัศน์">
        <FileField
          name="coverImage"
          kind="image"
          label="ภาพปก"
          hint="ภาพแนวนอน กว้างอย่างน้อย 1600 px แสดงเป็นแบนเนอร์ของหน้าแหล่งเรียนรู้ การ์ดบนแผนที่ และภาพตอนแชร์ลิงก์"
          current={initialData.coverPath}
        />
        <FileField
          name="videoFile"
          kind="video"
          label="วีดิทัศน์แนะนำ"
          hint="แสดงใต้ส่วนหัวของหน้าแหล่งเรียนรู้ ถ้าไม่มีวีดิทัศน์ ช่องนี้จะไม่แสดงบนเว็บ"
          current={initialData.videoPath}
          removeName="removeVideo"
          removeLabel="ลบวีดิทัศน์นี้ออกจากหน้าแหล่งเรียนรู้"
        />
      </Section>

      <Section title="การแสดงผล">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>
              ลำดับ
              <input name="sortOrder" type="number" min="0" defaultValue={initialData.sortOrder} className={inputClass} />
            </label>
            <p className={hintClass}>เลขน้อยแสดงก่อน ในรายการบนแผนที่และปุ่ม &quot;แหล่งเรียนรู้ถัดไป&quot;</p>
            {err("sortOrder")}
          </div>
          <div>
            <span className={labelClass}>สีสัญลักษณ์</span>
            <div className="mt-1 flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="เลือกสี" className="size-10 cursor-pointer rounded-lg border border-line p-0.5" />
              <input
                name="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
                maxLength={7}
                pattern="^#[0-9a-fA-F]{6}$"
                aria-label="รหัสสี"
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm uppercase outline-none focus:border-brand"
              />
            </div>
            <p className={hintClass}>สีป้ายของแหล่งนี้ในหน้าผู้ดูแล</p>
            {err("color")}
          </div>
          <div>
            <span className={labelClass}>ที่อยู่หน้าเว็บและธีม</span>
            <p className="mt-1 rounded-xl border border-line bg-white px-4 py-2.5 font-mono text-sm text-muted">/c/{initialData.slug} · {initialData.theme}</p>
            <p className={hintClass}>แก้ไม่ได้ เพราะลิงก์ QR code หมุดบนแผนที่ และสีธีมของหน้าผูกกับค่านี้</p>
          </div>
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
          <input name="isPublished" type="checkbox" defaultChecked={initialData.isPublished} className="size-5 accent-brand" />
          <span className="text-sm font-medium text-ink">เผยแพร่ (ถ้าไม่เลือก ชิ้นงานทั้งหมดของแหล่งนี้จะถูกซ่อนจากผู้เข้าชม)</span>
        </label>
      </Section>

      <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-line bg-white/95 px-6 py-4 backdrop-blur">
        <Link href="/admin/communities" className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper">
          ยกเลิก
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก… (ถ้ามีวีดิทัศน์อาจใช้เวลาหลายนาที)" : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
