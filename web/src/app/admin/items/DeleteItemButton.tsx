"use client";

import { useTransition } from "react";
import { deleteItemAction } from "./actions";

interface DeleteItemButtonProps {
  id: string;
  name: string;
}

export default function DeleteItemButton({ id, name }: DeleteItemButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการลบชิ้นงาน "${name}"?\n\nการลบนี้จะลบไฟล์โมเดล 3D ภาพตัวอย่าง และไฟล์เสียงที่เกี่ยวข้องทั้งหมดอย่างถาวร!`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteItemAction(id);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "กำลังลบ…" : "ลบ"}
    </button>
  );
}
