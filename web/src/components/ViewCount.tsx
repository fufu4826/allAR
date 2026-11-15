/**
 * Public view counter ("เข้าชม 1,234 ครั้ง"). Nothing is shown before the first view, so a new
 * item does not advertise a zero. `compact` is the short form on cards ("👁 1,234").
 */
export default function ViewCount({
  count,
  compact = false,
  verb = "เข้าชม",
}: {
  count?: number;
  compact?: boolean;
  verb?: string;
}) {
  if (!count) return null;
  const n = count.toLocaleString("th-TH");
  return (
    <span className={compact ? "view-count view-count--compact" : "view-count"} title={`${verb} ${n} ครั้ง`}>
      <i className="fa-regular fa-eye" aria-hidden="true"></i>
      {compact ? <span aria-label={`${verb} ${n} ครั้ง`}>{n}</span> : `${verb} ${n} ครั้ง`}
    </span>
  );
}
