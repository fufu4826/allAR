import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";
import { logoutAction } from "./login/actions";
import AdminNavLinks from "./AdminNavLinks";

export default async function AdminNav() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  return (
    <nav aria-label="เมนูผู้ดูแล" className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2 text-sm">
        <AdminNavLinks />
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <a href="/" target="_blank" rel="noopener" className="rounded-full px-3 py-1.5 text-muted hover:text-brand" title="เปิดหน้าเว็บในแท็บใหม่">
            ดูหน้าเว็บ ↗
          </a>
          <Link href="/admin/account" className="max-w-40 truncate rounded-full px-3 py-1.5 text-muted hover:bg-brand-soft hover:text-ink" title="บัญชีของฉัน">
            {admin.displayName}
          </Link>
          <form action={logoutAction}>
            <button className="rounded-full border border-line px-3 py-1.5 hover:border-brand">ออกจากระบบ</button>
          </form>
        </div>
      </div>
    </nav>
  );
}
