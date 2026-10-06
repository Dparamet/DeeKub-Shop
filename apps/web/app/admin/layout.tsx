import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/api-server";
import { ShopHeader } from "@/components/shop-header";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "deeKub Admin | ระบบจัดการร้าน",
  description: "จัดการสินค้าและคำสั่งซื้อของ deeKub",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, unavailable } = await currentUser();
  if (unavailable)
    return (
      <>
        <ShopHeader />
        <main className="shop-container" id="main-content">
          <div className="empty-state" role="alert">
            <h1>ระบบผู้ดูแลยังไม่พร้อม</h1>
            <p>ตรวจว่า API ทำงานและ Supabase เชื่อมต่อได้ แล้วโหลดหน้าใหม่</p>
            <Link className="button" href="/">
              กลับหน้าร้าน
            </Link>
          </div>
        </main>
      </>
    );
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN")
    return (
      <>
        <ShopHeader />
        <main className="shop-container" id="main-content">
          <div className="empty-state">
            <h1>ไม่มีสิทธิ์เข้าใช้งาน</h1>
            <p>หน้านี้สำหรับบัญชีผู้ดูแลที่เจ้าของระบบกำหนดสิทธิ์เท่านั้น</p>
            <Link className="button" href="/account">
              กลับบัญชีของฉัน
            </Link>
          </div>
        </main>
      </>
    );
  return (
    <>
      <a className="skip-link" href="#main-content">
        ข้ามไปเนื้อหาหลัก
      </a>
      <header className="shop-header admin-header">
        <Link className="brand" href="/admin">
          dee<span className="brand-accent">Kub</span>
          <small>Admin</small>
        </Link>
        <nav className="shop-nav" aria-label="เมนูผู้ดูแล">
          <Link href="/admin">สินค้า</Link>
          <Link href="/admin/orders">คำสั่งซื้อ</Link>
          <Link href="/">หน้าร้าน</Link>
        </nav>
        <div className="shop-header-actions">
          <span className="muted small admin-email">{user.email}</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="shop-container" id="main-content">
        {children}
      </main>
    </>
  );
}
