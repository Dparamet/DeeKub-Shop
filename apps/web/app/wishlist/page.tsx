import { Suspense } from "react";
import { Storefront } from "@/components/storefront";
export default function WishlistPage() {
  return (
    <Suspense fallback={<p className="empty-state">กำลังโหลด…</p>}>
      <Storefront wishlist />
    </Suspense>
  );
}
