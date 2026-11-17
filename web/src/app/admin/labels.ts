/**
 * Thai wording of the admin area, shared by the dashboard and the audit log.
 *
 * The public site calls the five places "แหล่งเรียนรู้" and the groups of models inside one
 * "หมวดหมู่". The database tables are still named communities / collections / items, so the
 * stored audit entity names stay as they are and only their labels follow the site.
 */

export const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "เพิ่ม", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "แก้ไข", color: "bg-blue-50 text-blue-700 border-blue-200" },
  delete: { label: "ลบ", color: "bg-red-50 text-red-700 border-red-200" },
  login: { label: "เข้าสู่ระบบ", color: "bg-purple-50 text-purple-700 border-purple-200" },
  activate: { label: "เปิดใช้บัญชี", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  deactivate: { label: "ระงับบัญชี", color: "bg-amber-50 text-amber-700 border-amber-200" },
  reset_password: { label: "รีเซ็ตรหัสผ่าน", color: "bg-orange-50 text-orange-700 border-orange-200" },
  change_password: { label: "เปลี่ยนรหัสผ่าน", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

export const ENTITY_LABELS: Record<string, string> = {
  community: "แหล่งเรียนรู้",
  collection: "หมวดหมู่",
  item: "ชิ้นงาน 3D",
  admin: "บัญชีผู้ดูแล",
  // Features removed before release; their old log rows still show.
  news: "ข่าว (ฟีเจอร์เดิม)",
  gallery: "แกลเลอรี (ฟีเจอร์เดิม)",
};

/** Filters on the audit page: value is the stored entity name. */
export const ENTITY_FILTERS = [
  { value: "", label: "ทั้งหมด" },
  { value: "community", label: "แหล่งเรียนรู้" },
  { value: "collection", label: "หมวดหมู่" },
  { value: "item", label: "ชิ้นงาน 3D" },
  { value: "admin", label: "บัญชีผู้ดูแล" },
];

export const actionMeta = (action: string) =>
  ACTION_LABELS[action] ?? { label: action, color: "bg-gray-100 text-gray-700 border-gray-200" };

type LogRow = {
  action: string;
  entity: string;
  entityId: string | null;
  detail: unknown;
  adminUsername: string | null;
};

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * What a log row was about, in words: the thing's name when the row recorded one
 * (rows store the name at the time of the change, so a later rename or delete does not hide it),
 * else the current name passed in `names`, else a short id.
 */
export function describeTarget(log: LogRow, names?: Map<string, string>): string {
  const d = (log.detail && typeof log.detail === "object" ? log.detail : {}) as Record<string, unknown>;
  const label = ENTITY_LABELS[log.entity] ?? log.entity;
  if (log.action === "login") return `@${log.adminUsername ?? "?"}`;
  const name =
    text(d.name) ??
    (text(d.username) ? `@${text(d.username)}` : null) ??
    text(d.title) ??
    text(d.caption) ??
    (log.entityId ? names?.get(log.entityId) : undefined) ??
    (log.entityId ? `รหัส ${log.entityId.slice(0, 8)}` : null);
  return name ? `${label}: ${name}` : label;
}

/** Thai labels of the fields that differ between two versions of a record (for the audit log). */
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>, labels: Record<string, string>) {
  return Object.keys(labels).filter((key) => String(before[key] ?? "") !== String(after[key] ?? "")).map((key) => labels[key]);
}

/** A Thai sentence for the detail column, or null when the target already says everything. */
export function describeDetail(log: LogRow): string | null {
  const d = (log.detail && typeof log.detail === "object" ? log.detail : {}) as Record<string, unknown>;
  if (log.action === "create" && log.entity === "admin" && text(d.displayName)) return `ชื่อที่แสดง: ${text(d.displayName)}`;
  if (log.action === "update" && Array.isArray(d.changed) && d.changed.length) return `แก้: ${d.changed.join(", ")}`;
  return null;
}

/** Status filter of the item list (kept here: a server page cannot read values from a client module). */
export const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "published", label: "เผยแพร่แล้ว" },
  { value: "draft", label: "ฉบับร่าง" },
  { value: "featured", label: "ชิ้นงานแนะนำ" },
  { value: "nothumb", label: "ยังไม่มีภาพตัวอย่าง" },
];
