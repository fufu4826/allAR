import { Suspense } from "react";
import type { Metadata } from "next";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  title: { template: "%s · ผู้ดูแลระบบ", default: "ผู้ดูแลระบบ" },
  robots: { index: false, follow: false },
};

// The login page lives under this layout, so the layout must not call requireAdmin();
// every admin page calls it itself. The nav renders only for a signed-in admin.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-paper">
      <Suspense fallback={null}>
        <AdminNav />
      </Suspense>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
