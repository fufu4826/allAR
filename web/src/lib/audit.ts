import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getClientIp } from "./auth";
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !/password|token|secret/i.test(key)).map(([key, item]) => [key, clean(item)]));
  return value;
}
export async function audit(adminId: string | null, action: string, entity: string, entityId?: string, detail?: unknown) {
  try { await db.insert(auditLogs).values({ adminId, action, entity, entityId, detail: clean(detail), ip: await getClientIp() }); }
  catch { console.error("Audit logging failed"); }
}
