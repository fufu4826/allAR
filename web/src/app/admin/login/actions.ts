"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { destroySession, getClientIp, login } from "@/lib/auth";
export async function loginAction(_previous: string, form: FormData): Promise<string> {
  const username = form.get("username"); const password = form.get("password");
  if (typeof username !== "string" || typeof password !== "string") return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
  let result;
  try { result = await login(username, password, await getClientIp(), (await headers()).get("user-agent") || ""); }
  catch { console.error("Login failed"); return "เกิดข้อผิดพลาด กรุณาลองใหม่"; }
  if (!result.ok) return result.reason === "locked" ? "ลองใหม่อีกครั้งใน 15 นาที" : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
  redirect("/admin");
}
export async function logoutAction() { await destroySession(); redirect("/admin/login"); }
