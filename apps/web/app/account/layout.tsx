import { redirect } from "next/navigation";
import { currentUser } from "@/lib/api-server";
import { ShopHeader } from "@/components/shop-header";

export default async function AccountLayout({
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
            <h1>ระบบบัญชียังไม่พร้อม</h1>
            <p>ตรวจว่า API ทำงาน และ Supabase เชื่อมต่อได้ แล้วโหลดหน้าใหม่</p>
          </div>
        </main>
      </>
    );
  if (!user) redirect("/login?next=/account");
  return children;
}
