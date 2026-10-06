import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { authConfigured } from "@/lib/supabase/server";
export default function ResetPage() {
  return (
    <Suspense fallback={<p className="empty-state">กำลังโหลด…</p>}>
      <AuthForm configured={authConfigured()} initial="reset" />
    </Suspense>
  );
}
