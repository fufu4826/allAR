"use client";

import { useState, useTransition } from "react";
import { deleteItemAction } from "./actions";

export default function DeleteItemButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleDelete = () => {
    if (!window.confirm(`ลบชิ้นงาน "${name}" ใช่ไหม?\n\nไฟล์โมเดล ภาพ และเสียงของชิ้นงานนี้จะถูกลบถาวร กู้คืนได้จากไฟล์สำรองรายวันเท่านั้น`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteItemAction(id);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        {isPending ? "กำลังลบ…" : "ลบ"}
      </button>
      {error && <span role="alert" className="mt-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}
