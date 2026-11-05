import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";
import { logoutAction } from "./login/actions";

const links = [
  { href: "/admin", label: "แดชบอร์ด" },
  { href: "/admin/communities", label: "ชุมชน" },
  { href: "/admin/items", label: "ชิ้นงาน" },
  { href: "/admin/admins", label: "ผู้ดูแล" },
  { href: "/admin/audit", label: "บันทึกการใช้งาน" },
];

export default async function AdminNav() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  return (
    <nav aria-label="เมนูผู้ดูแล" className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 hover:bg-brand-soft">
            {l.label}
          </Link>
        ))}
        <span className="ml-auto text-muted">{admin.displayName}</span>
        <form action={logoutAction}>
          <button className="rounded-full border border-line px-3 py-1.5 hover:border-brand">ออกจากระบบ</button>
        </form>
      </div>
    </nav>
  );
}
