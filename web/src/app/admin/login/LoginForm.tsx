"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

const input =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 outline-none focus:border-brand";

export default function LoginForm() {
  const [message, action, pending] = useActionState(loginAction, "");
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        ชื่อผู้ใช้
        <input name="username" autoComplete="username" required maxLength={64} className={input} />
      </label>
      <label className="block text-sm font-medium">
        รหัสผ่าน
        <input name="password" type="password" autoComplete="current-password" required maxLength={128} className={input} />
      </label>
      <button
        disabled={pending}
        className="w-full rounded-full bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
      </button>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-700">
        {message}
      </p>
    </form>
  );
}
