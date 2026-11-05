"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminAction,
  toggleAdminStatusAction,
  resetAdminPasswordAction,
  AdminActionState,
} from "./actions";

interface AdminRecord {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface AdminManagerProps {
  currentAdminId: string;
  admins: AdminRecord[];
}

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2 text-sm outline-none transition focus:border-brand";
const labelClass = "block text-sm font-medium text-ink";

function AddAdminForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    createAdminAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-paper p-5">
      <h3 className="font-semibold text-ink">+ เพิ่มผู้ดูแลระบบคนใหม่</h3>

      {state?.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>
            ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
            <input
              name="username"
              required
              maxLength={64}
              pattern="[a-zA-Z0-9_.-]+"
              placeholder="เช่น admin_somchai"
              className={inputClass}
            />
          </label>
          <p className="mt-1 text-[11px] text-muted">ตัวอักษร a-z, 0-9, ขีด หรือ จุด (≥ 3 ตัว)</p>
          {state?.fieldErrors?.username && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.username}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>
            ชื่อที่แสดง (Display Name) <span className="text-red-500">*</span>
            <input
              name="displayName"
              required
              maxLength={120}
              placeholder="เช่น สมชาย ใจดี"
              className={inputClass}
            />
          </label>
          {state?.fieldErrors?.displayName && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.displayName}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>
            รหัสผ่านชั่วคราว <span className="text-red-500">*</span>
            <input
              name="password"
              type="text"
              required
              minLength={12}
              maxLength={128}
              placeholder="อย่างน้อย 12 ตัวอักษร"
              className={inputClass}
            />
          </label>
          <p className="mt-1 text-[11px] text-muted">ความยาวขั้นต่ำ 12 ตัวอักษร</p>
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "กำลังสร้างบัญชี…" : "สร้างบัญชีผู้ดูแล"}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordModal({
  admin,
  onClose,
  onSuccess,
}: {
  admin: AdminRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const boundAction = resetAdminPasswordAction.bind(null, admin.id);
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(boundAction, null);

  useEffect(() => {
    if (state?.success) {
      alert(`รีเซ็ตรหัสผ่านของ @${admin.username} เรียบร้อยแล้ว`);
      onSuccess();
    }
  }, [state, admin.username, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-semibold text-ink">รีเซ็ตรหัสผ่าน (@{admin.username})</h3>
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
              รหัสผ่านใหม่ (ชั่วคราว) <span className="text-red-500">*</span>
              <input
                name="newPassword"
                type="text"
                required
                minLength={12}
                maxLength={128}
                placeholder="อย่างน้อย 12 ตัวอักษร"
                className={inputClass}
              />
            </label>
            <p className="mt-1 text-xs text-muted">
              หลังจากรีเซ็ต เซสชันเดิมของผู้ดูแลท่านนี้จะถูกยกเลิกทันที
            </p>
            {state?.fieldErrors?.newPassword && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.newPassword}</p>
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
              {pending ? "กำลังบันทึก…" : "ยืนยันรีเซ็ตรหัสผ่าน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminManager({ currentAdminId, admins }: AdminManagerProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [resettingAdmin, setResettingAdmin] = useState<AdminRecord | null>(null);
  const [isToggling, startToggleTransition] = useTransition();

  const handleToggleStatus = (admin: AdminRecord) => {
    if (admin.id === currentAdminId) {
      alert("ไม่สามารถระงับการใช้งานบัญชีของตนเองได้");
      return;
    }

    const actionText = admin.isActive ? "ระงับการใช้งาน" : "เปิดใช้งาน";
    const confirmed = window.confirm(
      `คุณแน่ใจหรือไม่ว่าต้องการ${actionText} บัญชี @${admin.username}?`
    );
    if (!confirmed) return;

    startToggleTransition(async () => {
      const result = await toggleAdminStatusAction(admin.id, !admin.isActive);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleSuccess = () => {
    setShowAddForm(false);
    setResettingAdmin(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">รายชื่อผู้ดูแลระบบทั้งหมด ({admins.length})</h2>
          <p className="text-xs text-muted">
            จัดการสิทธิ์การเข้าถึง เพิ่มผู้ดูแลคนใหม่ และรีเซ็ตรหัสผ่าน
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand-dark"
        >
          {showAddForm ? "ปิดแบบฟอร์ม" : "+ เพิ่มผู้ดูแลคนใหม่"}
        </button>
      </div>

      {showAddForm && <AddAdminForm onSuccess={handleSuccess} />}

      {resettingAdmin && (
        <ResetPasswordModal
          admin={resettingAdmin}
          onClose={() => setResettingAdmin(null)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">ผู้ดูแล</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">เข้าสู่ระบบล่าสุด</th>
              <th className="px-4 py-3">วันที่สร้าง</th>
              <th className="px-4 py-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {admins.map((adm) => {
              const isSelf = adm.id === currentAdminId;

              return (
                <tr key={adm.id} className="hover:bg-brand-soft/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{adm.displayName}</span>
                      <span className="font-mono text-xs text-muted">(@{adm.username})</span>
                      {isSelf && (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
                          บัญชีของคุณ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {adm.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        ● ใช้งานอยู่
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        ✕ ถูกระงับ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {adm.lastLoginAt
                      ? new Date(adm.lastLoginAt).toLocaleString("th-TH")
                      : "ยังไม่เคยเข้าสู่ระบบ"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(adm.createdAt).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setResettingAdmin(adm)}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-brand"
                      >
                        รีเซ็ตรหัสผ่าน
                      </button>

                      {isSelf ? (
                        <span
                          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-400 cursor-not-allowed"
                          title="ไม่สามารถระงับบัญชีของตนเองได้"
                        >
                          ระงับไม่ได้
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(adm)}
                          disabled={isToggling}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                            adm.isActive
                              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {adm.isActive ? "ระงับการใช้งาน" : "เปิดใช้งาน"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
