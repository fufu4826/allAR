import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "เข้าสู่ระบบผู้ดูแล", robots: { index: false, follow: false } };

async function LoginPageContent() {
  if (await getCurrentAdmin()) redirect("/admin");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">เข้าสู่ระบบผู้ดูแล</h1>
        <p className="mt-1 text-sm text-muted">สำหรับเจ้าหน้าที่ที่ได้รับสิทธิ์เท่านั้น</p>
        <Suspense fallback={null}>
          <LoginPageContent />
        </Suspense>
      </div>
    </div>
  );
}
