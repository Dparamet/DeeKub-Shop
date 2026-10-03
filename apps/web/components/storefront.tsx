"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Gamepad2,
  Headphones,
  KeyRound,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { formatPrice, products, type Product, type ProductKind } from "@/data/catalog";
import { GameArt } from "@/components/game-art";
import { ProductCard } from "@/components/product-card";

type ProductFilter = "all" | ProductKind;

export function Storefront() {
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [search, setSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState(products);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "connected" | "demo">("loading");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const productDialog = useRef<HTMLDialogElement>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const cartButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const refreshCatalog = useCallback(async (signal?: AbortSignal) => {
    setCatalogStatus("loading");
    try {
      const response = await fetch("/api/catalog", { signal, cache: "no-store" });
      if (!response.ok) throw new Error("catalog request failed");
      const body = await response.json() as { items?: Product[] };
      if (!Array.isArray(body.items)) throw new Error("catalog response is invalid");
      setCatalogProducts(body.items);
      setCatalogStatus("connected");
    } catch {
      if (!signal?.aborted) setCatalogStatus("demo");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshCatalog(controller.signal);
    return () => controller.abort();
  }, [refreshCatalog]);

  useEffect(() => {
    const dialog = productDialog.current;
    if (selectedProduct && dialog && !dialog.open) dialog.showModal();
    if (!selectedProduct && dialog?.open) dialog.close();
  }, [selectedProduct]);

  useEffect(() => {
    const dialog = cartDialog.current;
    if (cartOpen && dialog && !dialog.open) dialog.showModal();
    if (!cartOpen && dialog?.open) dialog.close();
  }, [cartOpen]);

  useEffect(() => {
    if (!announcement) return;
    const timeout = window.setTimeout(() => setAnnouncement(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("th-TH");
    return catalogProducts.filter((product) => {
      const matchesKind = filter === "all" || product.kind === filter;
      const matchesSearch = !term || `${product.game} ${product.title} ${product.description}`.toLocaleLowerCase("th-TH").includes(term);
      return matchesKind && matchesSearch;
    });
  }, [catalogProducts, filter, search]);

  const topups = visibleProducts.filter((product) => product.kind === "topup");
  const keys = visibleProducts.filter((product) => product.kind === "key");

  function addToCart(product: Product) {
    setCartProducts((current) => [...current, product]);
    setAnnouncement(`${product.title} เพิ่มลงตะกร้าแล้ว — เป็นข้อมูลทดลอง ยังไม่มีการชำระเงิน`);
    setSelectedProduct(null);
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedProduct) addToCart(selectedProduct);
  }

  function closeProductDialog() {
    if (productDialog.current?.open) productDialog.current.close();
    setSelectedProduct(null);
  }

  function closeCartDialog() {
    setCartOpen(false);
    cartButton.current?.focus();
  }

  function removeFromCart(index: number) {
    setCartProducts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function resetCatalogView() {
    setFilter("all");
    setSearch("");
  }

  const cartTotal = cartProducts.reduce((total, product) => total + product.price, 0);

  return (
    <main className="storefront-shell">
      <a className="skip-link" href="#main-content">ข้ามไปยังเนื้อหาหลัก</a>
      <div className="demo-notice" role="note">
        <Sparkles size={14} aria-hidden="true" />
        <span className="demo-notice-detail">ต้นแบบ deeKub — สินค้า ราคา และคำสั่งซื้อทั้งหมดเป็นข้อมูลจำลอง</span>
        <span className="notice-dot" aria-hidden="true" />
        <span className="demo-notice-detail">ไม่มีการชำระเงินจริง</span>
        <span className="demo-notice-short">DEMO STORE · ไม่มีการชำระเงินจริง</span>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="deeKub หน้าหลัก">
            <span className="brand-symbol"><Gamepad2 size={19} strokeWidth={2.2} aria-hidden="true" /></span>
            <span>dee<span className="brand-accent">Kub</span></span>
          </Link>

          <button
            className="mobile-menu-button icon-button"
            aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={`main-nav${mobileMenuOpen ? " main-nav-open" : ""}`} aria-label="เมนูหลัก">
            <a href="#popular" onClick={() => { setMobileMenuOpen(false); resetCatalogView(); }}>สินค้า</a>
            <a href="#topups" onClick={() => { setMobileMenuOpen(false); resetCatalogView(); }}>เติมเกม</a>
            <a href="#game-keys" onClick={() => { setMobileMenuOpen(false); resetCatalogView(); }}>Game Keys</a>
            <a href="#offers" onClick={() => { setMobileMenuOpen(false); resetCatalogView(); }}>เกี่ยวกับเรา</a>
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
          </nav>

          <div className="header-actions">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">ค้นหาสินค้า</span>
              <input
                type="search"
                ref={searchInput}
                placeholder="ค้นหาเกมหรือสินค้า"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>/</kbd>
            </label>
            <button
              className="account-button"
              onClick={() => setAnnouncement("ระบบสมาชิกจะเชื่อม Supabase Auth ในขั้นตอนถัดไป")}
            >
              <span className="account-avatar">D</span>
              <span>บัญชี</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <button className="cart-button icon-button" ref={cartButton} onClick={() => setCartOpen(true)} aria-label={`เปิดตะกร้า มี ${cartProducts.length} รายการ`}>
              <ShoppingBag size={19} aria-hidden="true" />
              <span className="cart-count">{cartProducts.length}</span>
            </button>
          </div>
        </div>
      </header>

          <div className="mobile-subnav" aria-label="เมนูร้านค้า">
          <a href="#topups" onClick={resetCatalogView}><Zap size={15} /> เติมเกม</a>
          <a href="#game-keys" onClick={resetCatalogView}><KeyRound size={15} /> Game Keys</a>
        <button onClick={() => setCartOpen(true)}><ShoppingBag size={15} /> ตะกร้า <span>{cartProducts.length}</span></button>
      </div>

      <div className="store-content" id="main-content">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-mark" /> GAME TOP-UP · GAME KEYS</div>
            <h1 id="hero-title">เติมเกมและ<br /><span>Game Keys</span><br />ในที่เดียว</h1>
            <p className="hero-description">เลือกแพ็กเกมที่ใช่ เช็กรายละเอียดให้ครบ แล้วติดตามทุกขั้นตอนได้ในบัญชีเดียว</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#popular">เลือกดูสินค้า <ArrowRight size={16} aria-hidden="true" /></a>
              <a className="button button-secondary" href="#topups">เติมเกม <Zap size={15} aria-hidden="true" /></a>
            </div>
            <div className="hero-promises">
              <span><ShieldCheck size={16} aria-hidden="true" /> แสดงขั้นตอนชัดเจน</span>
              <span><Check size={16} aria-hidden="true" /> สถานะคำสั่งซื้อในที่เดียว</span>
            </div>
          </div>

          <div className="hero-art" aria-label="ภาพตัวอย่างสินค้าเกม">
            <div className="hero-art-backdrop" />
            <div className="hero-card hero-card-back hero-card-genshin">
              <GameArt style="genshin" />
              <span className="hero-card-tag">GAME KEY</span>
            </div>
            <div className="hero-card hero-card-back hero-card-arena">
              <GameArt style="arena" />
              <span className="hero-card-tag">TOP-UP</span>
            </div>
            <div className="hero-card hero-card-main">
              <GameArt style="valorant" />
              <div className="hero-card-overlay">
                <span className="hero-card-tag">แพ็กแนะนำ · ข้อมูลเดโม</span>
                <strong>เติม VP<br />ได้ในไม่กี่ขั้นตอน</strong>
                <span className="hero-card-caption"><span className="status-pip" /> flow จำลอง</span>
              </div>
            </div>
            <div className="hero-float-note"><span className="float-icon"><Zap size={16} /></span><span><strong>Top-up</strong><small>เลือกแพ็กแล้วกรอกข้อมูลผู้เล่น</small></span></div>
            <div className="hero-float-key"><KeyRound size={15} /><span>Digital Key</span></div>
            <span className="hero-index">01 / STORE PREVIEW</span>
          </div>
        </section>

        <section className="trust-row" aria-label="รายละเอียดการใช้งาน">
          <div><span className="trust-icon"><Zap size={18} aria-hidden="true" /></span><span><strong>แยกประเภทชัดเจน</strong><small>เติมเกมและ Game Key คนละ flow</small></span></div>
          <div><span className="trust-icon"><ShieldCheck size={18} aria-hidden="true" /></span><span><strong>ตรวจรายละเอียดก่อนสั่ง</strong><small>ยืนยัน Player ID และ Region</small></span></div>
          <div><span className="trust-icon"><Headphones size={18} aria-hidden="true" /></span><span><strong>ติดตามสถานะได้</strong><small>มี timeline สำหรับคำสั่งซื้อ</small></span></div>
        </section>

        <section className="catalog-section" id="popular" aria-labelledby="catalog-title">
          <div className="section-heading catalog-heading">
            <div>
              <div className="section-kicker">DEE KUB STORE</div>
              <h2 id="catalog-title">สินค้าสำหรับเกมเมอร์</h2>
              <div className="catalog-data-status" role="status" aria-live="polite">
                <span>
                  {catalogStatus === "connected"
                    ? `เชื่อม Go API แล้ว · ${catalogProducts.length} รายการ seed สำหรับ demo`
                    : catalogStatus === "loading"
                      ? "กำลังตรวจ Go API · แสดง catalog demo ชั่วคราว"
                      : "Go API ยังไม่พร้อม · แสดง catalog demo"}
                </span>
                {catalogStatus !== "connected" && (
                  <button type="button" disabled={catalogStatus === "loading"} onClick={() => void refreshCatalog()}>
                    {catalogStatus === "loading" ? "กำลังเชื่อมต่อ…" : "ลองอีกครั้ง"}
                  </button>
                )}
              </div>
            </div>
            <div className="catalog-controls" role="group" aria-label="กรองประเภทสินค้า">
              <button className={filter === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setFilter("all")}>ทั้งหมด <span>{catalogProducts.length}</span></button>
              <button className={filter === "topup" ? "filter-chip active" : "filter-chip"} onClick={() => setFilter("topup")}>เติมเกม</button>
              <button className={filter === "key" ? "filter-chip active" : "filter-chip"} onClick={() => setFilter("key")}>Game Keys</button>
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="empty-state" role="status">
              <CircleHelp size={23} aria-hidden="true" />
              <strong>ยังไม่พบสินค้าที่ตรงกัน</strong>
              <span>ลองค้นด้วยชื่อเกมอื่น หรือเลือกดูสินค้าทั้งหมด</span>
              <button className="text-button" onClick={() => { setSearch(""); setFilter("all"); }}>ล้างตัวกรอง</button>
            </div>
          ) : (
            <div className="catalog-groups">
              {topups.length > 0 && (
                <section className="product-group" id="topups" aria-labelledby="topups-title">
                  <div className="group-heading">
                    <div className="group-title-wrap"><span className="group-icon group-icon-cyan"><Zap size={16} aria-hidden="true" /></span><div><h3 id="topups-title">เติมเกมยอดนิยม</h3><p>เลือกแพ็กเกจและกรอกข้อมูลบัญชีเกม</p></div></div>
                    <a className="text-link" href="#popular" onClick={() => { setFilter("topup"); setSearch(""); }}>ดูแพ็กเติมเกม <ArrowRight size={15} aria-hidden="true" /></a>
                  </div>
                  <div className="product-grid">
                    {topups.map((product) => <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />)}
                  </div>
                </section>
              )}

              {keys.length > 0 && (
                <section className="product-group key-group" id="game-keys" aria-labelledby="keys-title">
                  <div className="group-heading">
                    <div className="group-title-wrap"><span className="group-icon group-icon-violet"><KeyRound size={16} aria-hidden="true" /></span><div><h3 id="keys-title">Game Keys</h3><p>รหัสเกมดิจิทัลพร้อมระบุ platform และ region</p></div></div>
                    <a className="text-link" href="#popular" onClick={() => { setFilter("key"); setSearch(""); }}>ดู Game Keys <ArrowRight size={15} aria-hidden="true" /></a>
                  </div>
                  <div className="product-grid">
                    {keys.map((product) => <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </section>

        <section className="offer-panel" id="offers" aria-labelledby="offer-title">
          <div className="offer-copy">
            <span className="offer-label"><Sparkles size={14} aria-hidden="true" /> STORE PREVIEW</span>
            <h2 id="offer-title">ทุกขั้นตอนควรตรวจสอบได้</h2>
            <p>deeKub วางโครงร้านให้แยกการเติมเกมออกจากการส่ง Game Key เพื่อให้ข้อมูลที่ต้องใช้และสถานะส่งมอบตรงกับสินค้าจริง</p>
            <a href="#popular" className="offer-link">สำรวจสินค้า <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
          <div className="offer-flow" aria-label="ตัวอย่างลำดับการสั่งซื้อ">
            <div><span>01</span><strong>เลือกสินค้า</strong><small>แพ็กเติมเกมหรือ Key</small></div>
            <ArrowDownRight size={16} aria-hidden="true" />
            <div><span>02</span><strong>ตรวจข้อมูล</strong><small>บัญชีเกมหรือ Region</small></div>
            <ArrowDownRight size={16} aria-hidden="true" />
            <div><span>03</span><strong>ติดตามรายการ</strong><small>สถานะตามประเภทสินค้า</small></div>
          </div>
        </section>

        <footer className="site-footer">
          <Link className="brand footer-brand" href="/">
            <span className="brand-symbol"><Gamepad2 size={18} aria-hidden="true" /></span><span>dee<span className="brand-accent">Kub</span></span>
          </Link>
          <p>ร้าน Digital Product สำหรับเกมเมอร์ · เวอร์ชันตัวอย่าง</p>
          <div className="footer-links"><Link href="/admin">ระบบจัดการ</Link><a href="#offers">เกี่ยวกับ deeKub</a></div>
          <span className="footer-copyright">© 2026 deeKub · Demo Store</span>
        </footer>
      </div>

      <div className="mobile-bottom-nav" aria-label="ทางลัดร้านค้า">
        <a href="#popular" onClick={resetCatalogView}><Gamepad2 size={18} /><span>สินค้า</span></a>
        <a href="#topups" onClick={resetCatalogView}><Zap size={18} /><span>เติมเกม</span></a>
        <a href="#game-keys" onClick={resetCatalogView}><KeyRound size={18} /><span>Keys</span></a>
        <button onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>ตะกร้า</span><i>{cartProducts.length}</i></button>
      </div>

      <dialog
        ref={productDialog}
        className="product-dialog"
        onCancel={(event) => { event.preventDefault(); closeProductDialog(); }}
        onClose={() => setSelectedProduct(null)}
      >
        {selectedProduct && (
          <form className="product-dialog-content" onSubmit={submitProduct}>
            <button className="dialog-close icon-button" type="button" onClick={closeProductDialog} aria-label="ปิดรายละเอียด"><X size={19} /></button>
            <div className="dialog-art-wrap"><GameArt style={selectedProduct.artwork} /></div>
            <div className="dialog-detail">
              <span className="dialog-kind">{selectedProduct.kind === "topup" ? "TOP-UP PACKAGE · DEMO" : "GAME KEY · DEMO"}</span>
              <h2>{selectedProduct.title}</h2>
              <p className="dialog-game-name">{selectedProduct.game} · {selectedProduct.platform}</p>
              <p className="dialog-description">{selectedProduct.description}</p>
              <div className="detail-facts">
                <div><span>Region</span><strong>{selectedProduct.region}</strong></div>
                <div><span>การส่งมอบ</span><strong>{selectedProduct.delivery}</strong></div>
              </div>
              {selectedProduct.kind === "topup" && (
                <div className="topup-fields">
                  <div className="form-section-title"><span>ข้อมูลสำหรับเติม</span><small>กรอกให้ตรงกับบัญชีเกม</small></div>
                  {selectedProduct.fields?.map((field) => (
                    <label className="form-field" key={field.id}>
                      <span>{field.label} <i>*</i></span>
                      <input name={field.id} required autoComplete="off" placeholder={field.placeholder} />
                    </label>
                  ))}
                  <p className="form-note"><ShieldCheck size={14} aria-hidden="true" /> ข้อมูลนี้ยังไม่ถูกส่งหรือบันทึก</p>
                </div>
              )}
              {selectedProduct.kind === "key" && (
                <div className="key-delivery-note"><KeyRound size={15} aria-hidden="true" /><span>Key demo จะแสดงหลังระบบชำระเงินและตรวจสิทธิ์พร้อมใช้งาน</span></div>
              )}
              <div className="dialog-buy-row">
                <div><small>ราคาเดโม</small><strong>{formatPrice(selectedProduct.price, selectedProduct.currency)}</strong></div>
                <button className="button button-primary" type="submit">เพิ่มลงตะกร้า <ShoppingBag size={16} aria-hidden="true" /></button>
              </div>
              <p className="dialog-demo-note">ตัวอย่างหน้าร้าน · ไม่มีการหักเงินจริงหรือส่งข้อมูลไปยังเกม</p>
            </div>
          </form>
        )}
      </dialog>

      <dialog
        ref={cartDialog}
        className="cart-dialog"
        onCancel={(event) => { event.preventDefault(); closeCartDialog(); }}
        onClose={() => setCartOpen(false)}
      >
        <div className="cart-dialog-content">
          <div className="cart-dialog-header">
            <div><span className="dialog-kind">DEE KUB STORE</span><h2>ตะกร้าสินค้า <span>{cartProducts.length}</span></h2></div>
            <button className="icon-button" onClick={closeCartDialog} aria-label="ปิดตะกร้า"><X size={19} /></button>
          </div>
          {cartProducts.length === 0 ? (
            <div className="cart-empty"><span><ShoppingBag size={21} /></span><strong>ยังไม่มีสินค้าในตะกร้า</strong><p>เลือกสินค้า demo เพื่อดูตัวอย่างสรุปรายการ</p><button className="button button-secondary" onClick={closeCartDialog}>เลือกสินค้า</button></div>
          ) : (
            <>
              <ul className="cart-items">
                {cartProducts.map((product, index) => (
                  <li key={`${product.id}-${index}`}>
                    <GameArt style={product.artwork} compact />
                    <div className="cart-item-info"><strong>{product.title}</strong><span>{product.game} · {product.kind === "topup" ? "เติมเกม" : "Game Key"}</span><b>{formatPrice(product.price, product.currency)}</b></div>
                    <button className="cart-remove" onClick={() => removeFromCart(index)} aria-label={`นำ ${product.title} ออกจากตะกร้า`}>นำออก</button>
                  </li>
                ))}
              </ul>
              <div className="cart-total"><span>ยอดรวม (ราคาเดโม)</span><strong>{formatPrice(cartTotal)}</strong></div>
              <button className="button button-primary checkout-disabled" disabled>ชำระเงินยังไม่พร้อมใช้งาน</button>
              <p className="cart-demo-note">Checkout และ Payment ยังไม่เชื่อมต่อ — ไม่มีการเรียกเก็บเงิน</p>
            </>
          )}
        </div>
      </dialog>

      <div className="toast-region" role="status" aria-live="polite">{announcement}</div>
    </main>
  );
}
