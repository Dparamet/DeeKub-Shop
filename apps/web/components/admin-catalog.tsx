"use client";

import { useEffect, useState } from "react";
import { ChevronDown, RefreshCw, Search } from "lucide-react";
import { GameArt } from "@/components/game-art";
import { formatPrice, products, type Product, type ProductKind } from "@/data/catalog";

export function AdminCatalog() {
  const [items, setItems] = useState<Product[]>(products);
  const [status, setStatus] = useState<"loading" | "connected" | "demo">("loading");
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | ProductKind>("all");

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("catalog unavailable");
        const body = await response.json() as { items?: Product[] };
        if (!Array.isArray(body.items)) throw new Error("invalid catalog");
        if (controller.signal.aborted) return;
        setItems(body.items);
        setStatus("connected");
      } catch {
        if (controller.signal.aborted) return;
        setItems(products);
        setStatus("demo");
      }
    }
    void loadCatalog();
    return () => controller.abort();
  }, [refreshAttempt]);

  const query = search.trim().toLocaleLowerCase("th-TH");
  const visibleItems = items.filter((product) => (
    (kind === "all" || product.kind === kind)
    && `${product.title} ${product.game} ${product.platform}`.toLocaleLowerCase("th-TH").includes(query)
  ));

  return (
    <section className="admin-panel admin-catalog-panel" id="products" aria-labelledby="admin-products-title">
      <div className="panel-heading orders-heading">
        <div><span className="panel-kicker">STOREFRONT CATALOG</span><h2 id="admin-products-title">สินค้าและแพ็กเกจ</h2></div>
        <button className="admin-outline-button" disabled={status === "loading"} onClick={() => {
          setStatus("loading");
          setRefreshAttempt((attempt) => attempt + 1);
        }}><RefreshCw size={14} aria-hidden="true" />โหลด catalog ใหม่</button>
      </div>
      <p className={`admin-catalog-source source-${status}`} role="status">
        {status === "loading" ? "กำลังโหลดรายการสินค้า…" : status === "connected"
          ? "เชื่อม Go API แล้ว · แสดงสินค้าที่เผยแพร่บนหน้าร้าน"
          : "เชื่อม API ไม่ได้ · แสดงสินค้าตัวอย่าง ลองโหลดใหม่เมื่อ API พร้อม"}
      </p>
      <p className="admin-catalog-note">ตรวจรายการและข้อมูลที่ลูกค้าเห็นได้ที่นี่ การเพิ่ม แก้ไข และเผยแพร่สินค้าจะเปิดหลังเชื่อม Auth และ Admin API</p>
      <div className="orders-tools admin-catalog-tools">
        <label className="order-search-field"><Search size={15} aria-hidden="true" /><span className="sr-only">ค้นหาสินค้าในระบบจัดการ</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาสินค้าหรือเกม" /></label>
        <label className="filter-select"><span className="sr-only">ประเภทสินค้า</span><select value={kind} onChange={(event) => setKind(event.target.value as "all" | ProductKind)}><option value="all">ทุกประเภท</option><option value="topup">เติมเกม</option><option value="key">Game Key</option></select><ChevronDown size={14} aria-hidden="true" /></label>
        <span className="admin-catalog-count">{visibleItems.length} / {items.length} รายการ</span>
      </div>
      {status !== "loading" && <div className="admin-catalog-list">
        {visibleItems.map((product) => (
          <details className="admin-product" key={product.id}>
            <summary>
              <span className="admin-product-art" aria-hidden="true"><GameArt style={product.artwork} /></span>
              <span className="admin-product-name"><small>{product.kind === "topup" ? "เติมเกม" : "Game Key"} · {product.game}</small><strong>{product.title}</strong></span>
              <span className="admin-product-price">{formatPrice(product.price, product.currency)}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="admin-product-detail">
              <p>{product.description}</p>
              <dl><div><dt>Platform</dt><dd>{product.platform}</dd></div><div><dt>Region</dt><dd>{product.region}</dd></div><div><dt>การส่งมอบ</dt><dd>{product.delivery}</dd></div></dl>
              {product.fields && product.fields.length > 0 && <p>ข้อมูลที่ลูกค้าต้องกรอก: {product.fields.map((field) => field.label).join(", ")}</p>}
            </div>
          </details>
        ))}
        {visibleItems.length === 0 && <div className="admin-catalog-empty"><p>{items.length === 0 ? "ยังไม่มีสินค้าที่เผยแพร่" : "ไม่พบสินค้าตามคำค้นและประเภทที่เลือก"}</p>{items.length > 0 && <button className="admin-outline-button" onClick={() => { setSearch(""); setKind("all"); }}>ล้างตัวกรอง</button>}</div>}
      </div>}
    </section>
  );
}
