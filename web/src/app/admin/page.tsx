import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
async function Dashboard() { const admin = await requireAdmin(); return <><h1>แดชบอร์ด</h1><p>{admin.displayName}</p></>; }
export default function AdminPage() { return <Suspense fallback={null}><Dashboard /></Suspense>; }
