"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
const textareaClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2 text-sm outline-none transition focus:border-brand min-h-[90px]";
const labelClass = "block text-sm font-medium text-ink";

function AddCollectionForm({
  communityId,
  onSuccess,
}: {
  communityId: string;
  onSuccess: () => void;
}) {
  const boundAction = createCollectionAction.bind(null, communityId);
  const [state, formAction, pending] = useActionState<CollectionActionState, FormData>(
    boundAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-paper p-5">
      <h3 className="font-semibold text-ink">+ เพิ่มแหล่งเรียนรู้ใหม่</h3>

      {state?.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={labelClass}>
            ชื่อแหล่งเรียนรู้ <span className="text-red-500">*</span>
            <input
              name="name"
              required
              maxLength={255}
              placeholder="เช่น กลุ่มทอผ้าย้อมคราม"
              className={inputClass}
            />
          </label>
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>
            ลำดับการจัดเรียง
            <input name="sortOrder" type="number" min="0" defaultValue="0" className={inputClass} />
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>
          รายละเอียดเกี่ยวกับแหล่งเรียนรู้ <span className="text-red-500">*</span>
          <textarea
            name="description"
            required
            placeholder="อธิบายเกี่ยวกับแหล่งเรียนรู้หรือกลุ่มวิสาหกิจ..."
            className={textareaClass}
          />
        </label>
        {state?.fieldErrors?.description && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.description}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          รูปภาพแหล่งเรียนรู้
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block w-full text-xs text-ink file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark hover:file:bg-brand/20"
          />
        </label>
        <p className="mt-1 text-xs text-muted">
          ไฟล์ภาพ (.jpg, .png, .webp) — ขนาดสูงสุด 15 MB
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "กำลังเพิ่มข้อมูล…" : "เพิ่มแหล่งเรียนรู้"}
        </button>
      </div>
    </form>
  );
}

function EditCollectionModal({
  collection,
  onClose,
  onSuccess,
}: {
  collection: CollectionItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const boundAction = updateCollectionAction.bind(null, collection.id);
  const [state, formAction, pending] = useActionState<CollectionActionState, FormData>(
    boundAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-semibold text-ink">แก้ไขแหล่งเรียนรู้</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted hover:bg-paper hover:text-ink"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="mt-4 space-y-4">
          {state?.error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              ชื่อแหล่งเรียนรู้ <span className="text-red-500">*</span>
              <input
                name="name"
                defaultValue={collection.name}
                required
                maxLength={255}
                className={inputClass}
              />
            </label>
            {state?.fieldErrors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              รายละเอียด <span className="text-red-500">*</span>
              <textarea
                name="description"
                defaultValue={collection.description}
                required
                className={textareaClass}
              />
            </label>
            {state?.fieldErrors?.description && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.description}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              ลำดับการจัดเรียง
              <input
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={collection.sortOrder}
                className={inputClass}
              />
            </label>
          </div>

          <div>
            <label className={labelClass}>
              รูปภาพแหล่งเรียนรู้
              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 block w-full text-xs text-ink file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark"
              />
            </label>
            <p className="mt-1 text-xs text-muted">
              ไฟล์ภาพ (.jpg, .png, .webp) — ขนาดสูงสุด 15 MB
            </p>

            {collection.imagePath && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={collection.imagePath}
                  alt=""
                  className="size-14 rounded-lg border border-line object-cover"
                />
                <span className="text-xs text-muted">เลือกไฟล์ใหม่หากต้องการเปลี่ยนรูป</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink hover:bg-paper"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-brand px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CollectionManager({
  communityId,
  communityName,
  collections,
}: CollectionManagerProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = (col: CollectionItem) => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการลบแหล่งเรียนรู้ "${col.name}"?\n\nคำเตือน: ชิ้นงาน 3D ทั้งหมดในแหล่งเรียนรู้นี้ (${col.itemCount} ชิ้น) จะถูกลบไปด้วยอย่างถาวร!`
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteCollectionAction(col.id);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleSuccess = () => {
    setShowAddForm(false);
    setEditingCollection(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">
            รายการแหล่งเรียนรู้ใน &quot;{communityName}&quot; ({collections.length})
          </h2>
          <p className="text-xs text-muted">
            แหล่งเรียนรู้ทำหน้าที่เป็นกลุ่มหมวดหมู่สำหรับจัดเก็บชิ้นงาน 3D
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand-dark"
        >
          {showAddForm ? "ปิดแบบฟอร์ม" : "+ เพิ่มแหล่งเรียนรู้"}
        </button>
      </div>

      {showAddForm && (
        <AddCollectionForm communityId={communityId} onSuccess={handleSuccess} />
      )}

      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">แหล่งเรียนรู้</th>
              <th className="px-4 py-3">รายละเอียด</th>
              <th className="px-4 py-3">ชิ้นงาน</th>
              <th className="px-4 py-3 text-center">ลำดับ</th>
              <th className="px-4 py-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {collections.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  ยังไม่มีแหล่งเรียนรู้ในชุมชนนี้ กด &quot;+ เพิ่มแหล่งเรียนรู้&quot; ด้านบนเพื่อเริ่มต้น
                </td>
              </tr>
            ) : (
              collections.map((col) => (
                <tr key={col.id} className="hover:bg-brand-soft/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {col.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={col.imagePath}
                          alt=""
                          className="size-12 rounded-xl border border-line object-cover"
                        />
                      ) : (
                        <div className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-dark text-xs font-bold">
                          {col.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="font-semibold text-ink">{col.name}</div>
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-muted">
                    {col.description}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Link
                      href={`/admin/items?community=${communityId}&collection=${col.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {col.itemCount} ชิ้นงาน →
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted">
                    {col.sortOrder}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCollection(col)}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-brand"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(col)}
                        disabled={isDeleting}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
