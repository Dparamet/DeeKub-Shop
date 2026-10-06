import { Storefront } from "@/components/storefront";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="empty-state">กำลังโหลดหน้าร้าน…</p>}>
      <Storefront />
    </Suspense>
  );
}
