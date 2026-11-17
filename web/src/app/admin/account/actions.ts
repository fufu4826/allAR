"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { admins, sessions } from "@/db/schema";
import { hashPassword, requireAdmin, sessionToken, tokenHash, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type AccountState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null;

/** The signed-in admin changes their own display name. */
export async function updateProfileAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requireAdmin();
  const displayName = String(formData.get("displayName") || "").trim();
  if (!displayName || displayName.length > 120) {
    return { fieldErrors: { displayName: "กรุณาระบุชื่อที่แสดง (ไม่เกิน 120 ตัวอักษร)" } };
  }
  if (displayName === admin.displayName) return { success: "ชื่อที่แสดงไม่ได้เปลี่ยน" };
  await db.update(admins).set({ displayName }).where(eq(admins.id, admin.id));
  await audit(admin.id, "update", "admin", admin.id, { username: admin.username, changed: ["ชื่อที่แสดง"] });
  revalidatePath("/admin", "layout"); // the menu shows the name
  return { success: "บันทึกชื่อที่แสดงแล้ว" };
}

/**
 * The signed-in admin changes their own password: the current one is required, so a session
 * left open on a shared computer cannot be used to take over the account. Other sessions of
 * this admin are signed out; this one stays.
 */
export async function changePasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requireAdmin();
  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");
  const confirm = String(formData.get("confirmPassword") || "");

  const fieldErrors: Record<string, string> = {};
  if (next.length < 12 || next.length > 128) fieldErrors.newPassword = "รหัสผ่านใหม่ต้องยาว 12 ถึง 128 ตัวอักษร";
  else if (next === current) fieldErrors.newPassword = "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม";
  if (confirm !== next) fieldErrors.confirmPassword = "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const [row] = await db.select({ passwordHash: admins.passwordHash }).from(admins).where(eq(admins.id, admin.id)).limit(1);
  if (!row || !(await verifyPassword(row.passwordHash, current))) {
    return { fieldErrors: { currentPassword: "รหัสผ่านปัจจุบันไม่ถูกต้อง" } };
  }

  await db.update(admins).set({ passwordHash: await hashPassword(next) }).where(eq(admins.id, admin.id));
  const token = await sessionToken();
  await db.delete(sessions).where(token ? and(eq(sessions.adminId, admin.id), ne(sessions.id, tokenHash(token))) : eq(sessions.adminId, admin.id));
  await audit(admin.id, "change_password", "admin", admin.id, { username: admin.username });
  return { success: "เปลี่ยนรหัสผ่านแล้ว อุปกรณ์อื่นที่เข้าสู่ระบบด้วยบัญชีนี้ถูกออกจากระบบแล้ว" };
}
