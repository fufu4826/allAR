"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins, sessions } from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type AdminActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
} | null;

export async function createAdminAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const currentAdmin = await requireAdmin();

  const username = String(formData.get("username") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();
  const password = String(formData.get("password") || "").trim();

  const fieldErrors: Record<string, string> = {};

  if (!username || !/^[a-zA-Z0-9_.-]+$/.test(username) || username.length < 3 || username.length > 64) {
    fieldErrors.username = "ชื่อผู้ใช้ต้องเป็น a-z, 0-9, ขีด หรือ จุด (3-64 ตัวอักษร)";
  }

  if (!displayName || displayName.length > 120) {
    fieldErrors.displayName = "กรุณาระบุชื่อที่แสดง (ไม่เกิน 120 ตัวอักษร)";
  }

  if (password.length < 12 || password.length > 128) {
    fieldErrors.password = "รหัสผ่านชั่วคราวต้องมีความยาวอย่างน้อย 12 ตัวอักษร";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน" };
  }

  const [exists] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.username, username))
    .limit(1);

  if (exists) {
    return {
      fieldErrors: { username: "ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ" },
      error: "ชื่อผู้ใช้ซ้ำ",
    };
  }

  try {
    const passwordHash = await hashPassword(password);
    const id = crypto.randomUUID().replaceAll("-", "");

    await db.insert(admins).values({
      id,
      username,
      displayName,
      passwordHash,
      isActive: true,
    });

    await audit(currentAdmin.id, "create", "admin", id, { username, displayName });
    return { success: true };
  } catch (error) {
    console.error("Create admin error:", error);
    return { error: "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ดูแล" };
  }
}

export async function toggleAdminStatusAction(
  targetId: string,
  activate: boolean
): Promise<{ error?: string; success?: boolean }> {
  const currentAdmin = await requireAdmin();

  if (targetId === currentAdmin.id) {
    return { error: "ไม่สามารถระงับการใช้งานบัญชีของตนเองได้" };
  }

  const [target] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, targetId))
    .limit(1);

  if (!target) {
    return { error: "ไม่พบบัญชีผู้ดูแลที่ต้องการดำเนินการ" };
  }

  try {
    await db.update(admins).set({ isActive: activate }).where(eq(admins.id, targetId));

    // When deactivated, invalidate all active sessions for this admin
    if (!activate) {
      await db.delete(sessions).where(eq(sessions.adminId, targetId));
    }

    await audit(currentAdmin.id, activate ? "activate" : "deactivate", "admin", targetId, {
      username: target.username,
    });

    return { success: true };
  } catch (error) {
    console.error("Toggle admin status error:", error);
    return { error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะบัญชี" };
  }
}

export async function resetAdminPasswordAction(
  targetId: string,
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const currentAdmin = await requireAdmin();

  const [target] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, targetId))
    .limit(1);

  if (!target) {
    return { error: "ไม่พบบัญชีผู้ดูแล" };
  }

  const newPassword = String(formData.get("newPassword") || "").trim();
  if (newPassword.length < 12 || newPassword.length > 128) {
    return {
      fieldErrors: { newPassword: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 12 ตัวอักษร" },
      error: "รหัสผ่านสั้นเกินไป",
    };
  }

  try {
    const passwordHash = await hashPassword(newPassword);

    await db.update(admins).set({ passwordHash }).where(eq(admins.id, targetId));

    // Invalidate existing sessions so the admin must re-authenticate with the new password
    await db.delete(sessions).where(eq(sessions.adminId, targetId));

    await audit(currentAdmin.id, "reset_password", "admin", targetId, {
      username: target.username,
    });

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" };
  }
}
