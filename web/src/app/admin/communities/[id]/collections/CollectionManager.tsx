"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FileField from "../../../FileField";
import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  CollectionActionState,
} from "./actions";

interface CollectionItem {
  id: string;
  name: string;
  description: string;
  imagePath: string | null;
  sortOrder: number;
  itemCount: number;
}

interface CollectionManagerProps {
  communityId: string;
  communityName: string;
  collections: CollectionItem[];
}

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2 text-sm outline-none transition focus:border-brand";
const labelClass = "block text-sm font-medium text-ink";

/** Add form (no `collection`) or edit form for one category. */
function CollectionForm({
  communityId,
  collection,
  onDone,
  onCancel,
}: {
  communityId: string;
  collection?: CollectionItem;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const action = collection ? updateCollectionAction.bind(null, collection.id) : createCollectionAction.bind(null, communityId);
  const [state, formAction, pending] = useActionState<CollectionActionState, FormData>(action, null);

  useEffect(() => {
    if (state?.success) onDone(collection ? "บันทึกหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว");
  }, [state, collection, onDone]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-brand/40 bg-paper p-5">
      <h3 className="font-semibold text-ink">{collection ? `แก้หมวดหมู่ "${collection.name}"` : "เพิ่มหมวดหมู่ใหม่"}</h3>
      {state?.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
        <div>
          <label className={labelClass}>
            ชื่อหมวดหมู่ <span className="text-red-500">*</span>
            <input name="name" defaultValue={collection?.name} required maxLength={255} placeholder="เช่น พระพุทธรูป" className={inputClass} />
          </label>
          {state?.fieldErrors?.name && <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>}
        </div>
        <label className={labelClass}>
          ลำดับ
          <input name="sortOrder" type="number" min="0" defaultValue={collection?.sortOrder ?? 0} className={inputClass} />
        </label>
      </div>
      <div>
        <label className={labelClass}>
          คำอธิบาย
          <textarea name="description" defaultValue={collection?.description} className={`${inputClass} min-h-[90px]`} />
        </label>
        <p className="mt-1 text-xs text-muted">แสดงเหนือรายการชิ้นงานเมื่อผู้เข้าชมเลือกหมวดนี้ เว้นว่างได้</p>
      </div>
      <FileField name="image" kind="image" label="ภาพประจำหมวด" hint="ไม่บังคับ ตอนนี้แสดงเฉพาะในหน้าผู้ดูแล" current={collection?.imagePath} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-paper">
          ยกเลิก
        </button>
        <button type="submit" disabled={pending} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark disabled:opacity-60">
          {pending ? "กำลังบันทึก…" : collection ? "บันทึก" : "เพิ่มหมวดหมู่"}
        </button>
      </div>
    </form>
  );
}

export default function CollectionManager({ communityId, communityName, collections }: CollectionManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<CollectionItem | "new" | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const done = (text: string) => {
    setEditing(null);
    setNotice({ ok: true, text });
    router.refresh();
  };

  const handleDelete = (col: CollectionItem) => {
    if (!window.confirm(`ลบหมวดหมู่ "${col.name}" ใช่ไหม?`)) return;
    startDelete(async () => {
      const result = await deleteCollectionAction(col.id);
      setNotice(result?.error ? { ok: false, text: result.error } : { ok: true, text: `ลบหมวดหมู่ "${col.name}" แล้ว` });
      if (!result?.error) router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-ink">
          {collections.length} หมวดหมู่ใน{communityName}
        </h2>
        {editing === null && (
          <button type="button" onClick={() => { setEditing("new"); setNotice(null); }} className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark">
            + เพิ่มหมวดหมู่
          </button>
        )}
      </div>

      {notice && (
        <div role="status" className={`rounded-xl border p-3 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {notice.text}
        </div>
      )}

      {editing === "new" && <CollectionForm communityId={communityId} onDone={done} onCancel={() => setEditing(null)} />}

      {collections.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-8 text-center text-sm text-muted">ยังไม่มีหมวดหมู่ กด &quot;+ เพิ่มหมวดหมู่&quot; เพื่อเริ่ม</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {collections.map((col) =>
            editing !== "new" && editing?.id === col.id ? (
              <li key={col.id} className="p-3">
                <CollectionForm key={col.id} communityId={communityId} collection={col} onDone={done} onCancel={() => setEditing(null)} />
              </li>
            ) : (
              <li key={col.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="w-8 shrink-0 text-center font-mono text-xs text-muted" title="ลำดับ">{col.sortOrder}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink">{col.name}</div>
                  {col.description && <div className="line-clamp-1 text-xs text-muted">{col.description}</div>}
                </div>
                <Link href={`/admin/items?community=${communityId}&collection=${col.id}`} className="text-xs font-medium text-brand hover:underline">
                  {col.itemCount} ชิ้นงาน →
                </Link>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditing(col); setNotice(null); }} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-brand">
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(col)}
                    disabled={isDeleting || col.itemCount > 0}
                    title={col.itemCount > 0 ? "ลบได้เมื่อหมวดนี้ไม่มีชิ้นงานแล้ว" : undefined}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ลบ
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
      <p className="text-xs text-muted">ลบหมวดหมู่ได้เมื่อไม่มีชิ้นงานอยู่ข้างในแล้ว เพื่อกันการลบโมเดลทิ้งโดยไม่ตั้งใจ</p>
    </div>
  );
}
