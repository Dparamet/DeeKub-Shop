"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ShopHeader } from "@/components/shop-header";
import { ProductCard } from "@/components/product-card";
import { useCatalog } from "@/components/use-catalog";
import { useShop } from "@/components/shop-provider";

export function Storefront({ wishlist = false }: { wishlist?: boolean }) {
  const params = useSearchParams();
  const type = params.get("type") || "all";
  const { products, loading, error, reload } = useCatalog();
  const { saved } = useShop();
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");
  const term = search.trim().toLocaleLowerCase("th-TH");
  const visible = products.filter(
    (p) =>
      (!wishlist || saved.includes(p.id)) &&
      (type === "all" || p.kind === type) &&
      `${p.title} ${p.game} ${p.platform}`
        .toLocaleLowerCase("th-TH")
        .includes(term) &&
      (!platform || p.platform === platform) &&
      (!region || p.region === region) &&
      (!maxPrice || p.price <= Number(maxPrice)),
  );
  if (sort === "price-asc") visible.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") visible.sort((a, b) => b.price - a.price);
  if (sort === "name") visible.sort((a, b) => a.title.localeCompare(b.title));
  function reset() {
    setSearch("");
    setPlatform("");
    setRegion("");
    setMaxPrice("");
    setSort("featured");
  }
  return (
    <>
      <ShopHeader />
      <main className="shop-container" id="main-content">
        <div className="catalog-intro">
          <div>
            <p className="eyebrow">deeKub digital store</p>
            <h1>
              {wishlist
                ? "รายการที่บันทึก"
                : type === "topup"
                  ? "เติมเกมที่คุณเล่น"
                  : type === "key"
                    ? "Game Keys / Gift Cards"
                    : "เลือกเกมถัดไปของคุณ"}
            </h1>
            <p className="muted">
              {wishlist
                ? "สินค้าที่คุณเก็บไว้บนอุปกรณ์นี้"
                : "ค้นหาเกมและแพ็กเกจ ตรวจแพลตฟอร์มและภูมิภาคก่อนสั่งซื้อ"}
            </p>
          </div>
          <p className="catalog-note">
            ภาพเกมจากผู้พัฒนาและหน้าร้านทางการ
            <br />
            ส่งมอบแบบจำลองเท่านั้น
          </p>
        </div>
        <div className="catalog-controls">
          <label className="catalog-search">
            <Search size={19} />
            <span className="sr-only">ค้นหาชื่อเกมหรือสินค้า</span>
            <input
              type="search"
              placeholder="ค้นหาชื่อเกมหรือสินค้า"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            แพลตฟอร์ม
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              {[...new Set(products.map((p) => p.platform))].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            ภูมิภาค
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {[...new Set(products.map((p) => p.region))].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            ราคาไม่เกิน (บาท)
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="ไม่จำกัด"
            />
          </label>
          <label>
            เรียงตาม
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">แนะนำ</option>
              <option value="price-asc">ราคาต่ำไปสูง</option>
              <option value="price-desc">ราคาสูงไปต่ำ</option>
              <option value="name">ชื่อสินค้า</option>
            </select>
          </label>
        </div>
        {loading ? (
          <div className="empty-state" role="status">
            กำลังโหลดสินค้า…
          </div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <h2>โหลดสินค้าไม่ได้</h2>
            <p>{error}</p>
            <button className="button" onClick={reload}>
              ลองใหม่
            </button>
          </div>
        ) : (
          <>
            <div className="catalog-results">
              <span>{visible.length} รายการ</span>
              <button className="text-button" onClick={reset}>
                ล้างตัวกรอง
              </button>
            </div>
            {visible.length ? (
              <div className="shop-grid">
                {visible.map((p, index) => (
                  <ProductCard product={p} key={p.id} eager={index < 4} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>
                  {wishlist ? "ยังไม่มีสินค้าในรายการนี้" : "ไม่พบสินค้า"}
                </h2>
                <p>
                  {wishlist
                    ? "กดหัวใจบนสินค้าที่สนใจเพื่อบันทึก"
                    : "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"}
                </p>
                <button className="button button-secondary" onClick={reset}>
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="shop-footer">
        <strong>deeKub</strong>
        <span>Game Keys และเติมเกม · ตรวจสอบแพลตฟอร์มและภูมิภาคทุกครั้ง</span>
        <span>โหมดทดลอง ไม่มีการรับเงินจริง</span>
      </footer>
    </>
  );
}
