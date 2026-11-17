"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction, type AccountState } from "./actions";

const inputClass = "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand";
const labelClass = "block text-sm font-medium text-ink";

function Message({ state }: { state: AccountState }) {
  if (state?.success) return <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p>;
  if (state?.error) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>;
  return null;
}

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfileAction, null);
  return (
    <form action={action} className="space-y-4">
      <Message state={state} />
      <label className={labelClass}>
        ชื่อที่แสดง
        <input name="displayName" defaultValue={displayName} required maxLength={120} className={inputClass} />
      </label>
      {state?.fieldErrors?.displayName && <p className="text-xs text-red-600">{state.fieldErrors.displayName}</p>}
      <button disabled={pending} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "กำลังบันทึก…" : "บันทึกชื่อ"}
      </button>
    </form>
  );
}

export function PasswordForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, null);
  const err = (key: string) => state?.fieldErrors?.[key] && <p className="mt-1 text-xs text-red-600">{state.fieldErrors[key]}</p>;
  return (
    // key resets the inputs after a successful change
    <form key={state?.success ?? "form"} action={action} className="space-y-4">
      <Message state={state} />
      {/* Lets password managers pair the new password with this account. */}
      <input type="text" name="username" value={username} autoComplete="username" readOnly hidden />
      <div>
        <label className={labelClass}>
          รหัสผ่านปัจจุบัน
          <input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className={inputClass} />
        </label>
        {err("currentPassword")}
      </div>
      <div>
        <label className={labelClass}>
          รหัสผ่านใหม่
          <input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass} />
        </label>
        <p className="mt-1 text-xs text-muted">อย่างน้อย 12 ตัวอักษร ใช้ประโยคยาว ๆ ที่จำง่ายก็ได้</p>
        {err("newPassword")}
      </div>
      <div>
        <label className={labelClass}>
          ยืนยันรหัสผ่านใหม่
          <input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass} />
        </label>
        {err("confirmPassword")}
      </div>
      <button disabled={pending} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
      </button>
    </form>
  );
}
