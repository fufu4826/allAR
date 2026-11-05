"use client";

import { useTransition } from "react";
import { deleteCommunityAction } from "./actions";

interface DeleteCommunityButtonProps {
  id: string;
  name: string;
}

export default function DeleteCommunityButton({ id, name }: DeleteCommunityButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการลบชุมชน "${name}"?\n\nคำเตือน: การลบนี้จะลบแหล่งเรียนรู้ ชิ้นงาน 3D และไฟล์ทั้งหมดในชุมชนนี้ด้วยอย่างถาวร!`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCommunityAction(id);
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
      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "กำลังลบ…" : "ลบชุมชน"}
    </button>
  );
}
