"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductArt } from "@/components/product-art";
import { productURL } from "@/lib/product-media";
import { ShopHeader } from "@/components/shop-header";
import { useShop } from "@/components/shop-provider";
import { formatPrice, type Product } from "@/data/catalog";
import { requestJSON } from "@/lib/shop-client";

export function ProductDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { add, hydrated, cart } = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    void requestJSON<Product>(`/api/catalog/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then((p) => {
        if (!controller.signal.aborted) setProduct(p);
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, attempt]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    if (cart.length >= 20 && !cart.some((i) => i.product_id === product.id)) {
      setError("ตะกร้ารองรับ 20 รายการ กรุณาจัดการตะกร้าก่อน");
      return;
    }
    const data = new FormData(event.currentTarget);
    const fields = Object.fromEntries(
      (product.fields || []).map((f) => [
        f.id,
        String(data.get(f.id) || "").trim(),
      ]),
    );
    const existing = cart.find((i) => i.product_id === product.id);
    if (
      existing &&
      Object.keys(fields).some(
        (key) => (existing.account_fields[key] || "").trim() !== fields[key],
      )
    ) {
      setError(
        "สินค้านี้อยู่ในตะกร้าด้วยข้อมูลบัญชีอื่น กรุณาแก้ข้อมูลที่ตะกร้าหรือนำรายการเดิมออกก่อน",
      );
      return;
    }
    if (
      (existing?.quantity || 0) + quantity >
      Math.min(10, product.stock || 0)
    ) {
      setError(
        "จำนวนรวมในตะกร้าเกินสต็อกหรือเกิน 10 ชิ้นต่อสินค้า กรุณาปรับจำนวนในตะกร้า",
      );
      return;
    }
    add({ product_id: product.id, quantity, account_fields: fields });
    router.push("/cart");
  }
  return (
    <>
      <ShopHeader />
      <main className="shop-container" id="main-content">
        <Link className="back-link" href="/">
          กลับหน้าร้าน
        </Link>
        {loading ? (
          <p className="empty-state" role="status">
            กำลังโหลดสินค้า…
          </p>
        ) : !product ? (
          <div className="empty-state" role="alert">
            <h1>เปิดสินค้าไม่ได้</h1>
            <p>{error}</p>
            <button
              className="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setAttempt((i) => i + 1);
              }}
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <div className="product-detail">
            <div>
              <div className="detail-art">
                <ProductArt product={product} detail />
              </div>
              <p className="muted small">
                ภาพเกมเพื่อระบุสินค้า · รายการและราคาในร้านเป็นตัวอย่าง
              </p>
              {productURL(product.sourceUrl) && (
                <a
                  className="back-link"
                  href={productURL(product.sourceUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ดูข้อมูลเกมและเงื่อนไขจากเว็บไซต์ทางการ
                </a>
              )}
            </div>
            <section>
              <p className="eyebrow">
                {product.game} · {product.badge}
              </p>
              <h1>{product.title}</h1>
              <p className="detail-description">{product.description}</p>
              <dl className="product-facts">
                <div>
                  <dt>แพลตฟอร์ม</dt>
                  <dd>{product.platform}</dd>
                </div>
                <div>
                  <dt>ภูมิภาค</dt>
                  <dd>{product.region}</dd>
                </div>
                <div>
                  <dt>พร้อมสั่งซื้อ</dt>
                  <dd>{product.stock ?? 0} ชิ้น</dd>
                </div>
              </dl>
              <p className="detail-price">
                {formatPrice(product.price, product.currency)}
              </p>
              <p className="info-note">{product.delivery}</p>
              {product.activationGuide && (
                <section className="activation-guide">
                  <h2>วิธีใช้และข้อควรตรวจสอบ</h2>
                  <p>{product.activationGuide}</p>
                </section>
              )}
              <form className="shop-form" onSubmit={submit}>
                {(product.fields || []).map((f) => (
                  <label key={f.id}>
                    {f.label}
                    <input
                      required
                      name={f.id}
                      placeholder={f.placeholder}
                      maxLength={150}
                    />
                  </label>
                ))}
                <label>
                  จำนวน
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {Array.from(
                      { length: Math.min(10, product.stock || 1) },
                      (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                {error && (
                  <div className="form-error" role="alert">
                    {error}
                    <Link className="text-button" href="/cart">
                      เปิดตะกร้า
                    </Link>
                  </div>
                )}
                <button
                  className="button"
                  disabled={!hydrated || !(product.stock && product.stock > 0)}
                >
                  {product.stock ? "เพิ่มลงตะกร้า" : "สินค้าหมดชั่วคราว"}
                </button>
              </form>
              <p className="muted small">
                {product.kind === "topup"
                  ? "กรอกเฉพาะ ID และเซิร์ฟเวอร์เกม ห้ามกรอกรหัสผ่านบัญชีเกม"
                  : "ไม่ต้องให้รหัสผ่านบัญชีเกมหรือ Steam แก่ร้าน"}
              </p>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
