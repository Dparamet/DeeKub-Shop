import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "deeKub Admin — ระบบจัดการร้าน",
  description: "ภาพรวมร้าน deeKub รายการสินค้า และคำสั่งซื้อตัวอย่าง",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
