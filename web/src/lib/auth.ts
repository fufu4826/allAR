import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { and, count, eq, gte, or } from "drizzle-orm";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { admins, loginAttempts, sessions } from "@/db/schema";
import { audit } from "./audit";

const options = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 };
const duration = 8 * 60 * 60;
const dummyHash = hash("not-a-real-password", { ...options, salt: Buffer.alloc(16, 7) });
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function hashPassword(pw: string) {
  if (pw.length < 12 || pw.length > 128) throw new Error("Invalid password length");
  return hash(pw, options);
}
export async function verifyPassword(encoded: string, pw: string) {
  try { return await verify(encoded, pw); } catch { return false; }
}
// Client IP for rate limiting and audit. Forwarding headers are client-controlled unless a
// trusted reverse proxy sets them, so they are read only when TRUST_PROXY=true. With one
// proxy (nginx `proxy_add_x_forwarded_for`), the proxy appends the real peer address as
// the LAST entry; earlier entries can be forged by the client, so never use the first one.
export async function getClientIp() {
  if (process.env.TRUST_PROXY !== "true") return "direct";
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  return (forwarded?.at(-1) || h.get("x-real-ip") || "unknown").slice(0, 45);
}
async function cookieOptions() {
  const h = await headers();
  return { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" || h.get("x-forwarded-proto")?.split(",")[0].trim() === "https", maxAge: duration };
}
export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  await db.insert(sessions).values({ id: tokenHash(token), adminId, expiresAt: new Date(Date.now() + duration * 1000), ip: await getClientIp(), userAgent: (h.get("user-agent") || "").slice(0, 255) });
  (await cookies()).set("allar_session", token, await cookieOptions());
}
export const getCurrentAdmin = cache(async () => {
  const token = (await cookies()).get("allar_session")?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const id = tokenHash(token);
  const [row] = await db.select({ admin: admins, expiresAt: sessions.expiresAt }).from(sessions).innerJoin(admins, eq(sessions.adminId, admins.id)).where(and(eq(sessions.id, id), eq(admins.isActive, true))).limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) { await db.delete(sessions).where(eq(sessions.id, id)); return null; }
  // Cookie writes are forbidden during Server Component rendering. Renewal is
  // intentionally limited to mutation contexts that can refresh the cookie.
  return row.admin;
});
export async function requireAdmin() { const admin = await getCurrentAdmin(); if (!admin) { const { redirect } = await import("next/navigation"); return redirect("/admin/login"); } return admin; }
export async function destroySession() {
  const store = await cookies(); const token = store.get("allar_session")?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, tokenHash(token)));
  store.set("allar_session", "", { ...(await cookieOptions()), maxAge: 0 });
}
export async function login(username: string, password: string, ip: string, userAgent: string): Promise<{ ok: true } | { ok: false; reason: "invalid" | "locked" }> {
  username = username.slice(0, 64); ip = ip.slice(0, 45); void userAgent;
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const attempts = await db.select({ username: loginAttempts.username, ip: loginAttempts.ip, total: count() }).from(loginAttempts).where(and(eq(loginAttempts.success, false), gte(loginAttempts.createdAt, since), or(eq(loginAttempts.username, username), eq(loginAttempts.ip, ip)))).groupBy(loginAttempts.username, loginAttempts.ip);
  const locked = attempts.reduce((n, a) => n + (a.username === username ? a.total : 0), 0) >= 5 || attempts.reduce((n, a) => n + (a.ip === ip ? a.total : 0), 0) >= 20;
  const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  const valid = await verifyPassword(admin?.passwordHash ?? await dummyHash, password);
  const success = !locked && !!admin?.isActive && valid;
  await db.insert(loginAttempts).values({ username, ip, success });
  if (locked) return { ok: false, reason: "locked" };
  if (!success || !admin) return { ok: false, reason: "invalid" };
  await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, admin.id));
  await createSession(admin.id); await audit(admin.id, "login", "admin", admin.id);
  return { ok: true };
}
