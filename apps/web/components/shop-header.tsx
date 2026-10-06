"use client";

import Link from "next/link";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import { useShop } from "@/components/shop-provider";

export function ShopHeader() {
  const { cart, user, authLoading } = useShop();
  return (
    <>
      <a className="skip-link" href="#main-content">
        ข้ามไปเนื้อหาหลัก
      </a>
      <div className="shop-notice">
        ร้านทดลอง: ชำระเงินและส่งมอบแบบจำลอง ไม่มีการรับเงินจริง
      </div>
      <header className="shop-header">
        <Link className="brand" href="/">
          dee<span className="brand-accent">Kub</span>
        </Link>
        <nav aria-label="เมนูหน้าร้าน" className="shop-nav">
          <Link href="/">สินค้าทั้งหมด</Link>
          <Link href="/?type=topup">เติมเกม</Link>
          <Link href="/?type=key">Game Keys</Link>
        </nav>
        <div className="shop-header-actions">
          <Link
            href="/wishlist"
            className="shop-icon"
            aria-label="รายการที่บันทึก"
          >
            <Heart size={20} />
          </Link>
          <Link
            href="/cart"
            className="shop-icon"
            aria-label={`ตะกร้า ${cart.reduce((n, i) => n + i.quantity, 0)} ชิ้น`}
          >
            <ShoppingBag size={20} />
            <span>{cart.reduce((n, i) => n + i.quantity, 0)}</span>
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="shop-account"
            aria-label={user ? "บัญชีของฉัน" : "เข้าสู่ระบบ"}
          >
            <UserRound size={19} />
            <span>
              {authLoading ? "บัญชี" : user ? "บัญชีของฉัน" : "เข้าสู่ระบบ"}
            </span>
          </Link>
        </div>
      </header>
    </>
  );
}
