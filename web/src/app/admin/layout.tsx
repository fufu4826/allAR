import { Suspense } from "react";
import AdminNav from "./AdminNav";

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
