"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const links = [
  { href: "/admin", label: "แดชบอร์ด" },
  { href: "/admin/communities", label: "แหล่งเรียนรู้" },
  { href: "/admin/items", label: "ชิ้นงาน 3D" },
  { href: "/admin/stats", label: "สถิติ" },
  { href: "/admin/admins", label: "ผู้ดูแล" },
  { href: "/admin/audit", label: "บันทึกการแก้ไข" },
  { href: "/admin/help", label: "วิธีใช้" },
];

/** Admin menu; the current section is highlighted. Scrolls sideways on a phone. */
export default function AdminNavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const row = useRef<HTMLDivElement>(null);
  // On a phone the row scrolls sideways: keep the current section in view.
  useEffect(() => {
    row.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  return (
    <div ref={row} className="order-last -mx-1 flex w-full min-w-0 gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:order-none lg:w-auto lg:flex-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? "page" : undefined}
          className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 ${
            isActive(l.href) ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
