"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShopHeader } from "@/components/shop-header";
import { useShop } from "@/components/shop-provider";
import { useCatalog } from "@/components/use-catalog";
import { formatPrice } from "@/data/catalog";
import { requestJSON } from "@/lib/shop-client";

export function CartPage() {
  const router = useRouter();
  const {
    cart,
    update,
    remove,
    clear,
    hydrated,
    user,
    authLoading,
    authError,
  } = useShop();
  const { products, loading, error: catalogError, reload } = useCatalog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const checkoutRef = useRef<{
    user: string;
    payload: string;
    key: string;
  } | null>(null);
  const unavailable = cart.some((i) => {
    const p = products.find((p) => p.id === i.product_id);
    return !p || (p.stock ?? 0) < i.quantity;
  });
  const total = cart.reduce(
    (sum, i) =>
      sum +
      (products.find((p) => p.id === i.product_id)?.price || 0) * i.quantity,
    0,
  );
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      busy ||
      unavailable ||
      loading ||
      catalogError ||
      authLoading ||
      authError
    )
      return;
    if (!user) {
      router.push("/login?next=/cart");
      return;
    }
    setBusy(true);
    setError("");
    const items = cart.map((i) => {
      const product = products.find((p) => p.id === i.product_id)!;
      return {
        ...i,
        account_fields: Object.fromEntries(
          (product.fields || []).map((field) => [
            field.id,
            (i.account_fields[field.id] || "").trim(),
          ]),
        ),
        expected_price_minor: Math.round(product.price * 100),
      };
    });
    const payload = JSON.stringify({ items });
    let key = crypto.randomUUID();
    if (
      checkoutRef.current?.payload === payload &&
      checkoutRef.current.user === user.id
    )
      key = checkoutRef.current.key;
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("deekub.checkout") || "null",
      );
      if (
        stored?.payload === payload &&
        stored?.user === user.id &&
        typeof stored.key === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          stored.key,
        )
      )
        key = stored.key;
      sessionStorage.setItem(
        "deekub.checkout",
        JSON.stringify({ key, payload, user: user.id }),
      );
    } catch {
      /* The ref preserves retries in this tab when storage is blocked. */
    }
    checkoutRef.current = { key, payload, user: user.id };
    try {
      const order = await requestJSON<{ id: string }>("/api/shop/orders", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: payload,
      });
      clear();
      checkoutRef.current = null;
      try {
        sessionStorage.removeItem("deekub.checkout");
      } catch {
        /* Optional storage. */
      }
      router.push(`/account/orders/${order.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ShopHeader />
      <main className="shop-container" id="main-content">
        <div className="page-heading">
          <h1>ตะกร้าของคุณ</h1>
          <Link className="text-button" href="/">
            เลือกสินค้าเพิ่ม
          </Link>
        </div>
        {!hydrated || loading ? (
          <p className="empty-state" role="status">
            กำลังโหลดตะกร้า…
          </p>
        ) : catalogError ? (
          <div className="empty-state" role="alert">
            <p>{catalogError}</p>
            <button className="button" onClick={reload}>
              ลองใหม่
            </button>
          </div>
        ) : !cart.length ? (
          <div className="empty-state">
            <h2>ตะกร้ายังว่าง</h2>
            <p>เลือกเกมหรือแพ็กเกจที่ต้องการจากหน้าร้าน</p>
            <Link className="button" href="/">
              เลือกสินค้า
            </Link>
          </div>
        ) : (
          <form className="checkout-layout" onSubmit={checkout}>
            <div className="cart-lines">
              {cart.map((i) => {
                const p = products.find((p) => p.id === i.product_id);
                return (
                  <article className="shop-panel cart-line" key={i.product_id}>
                    <div className="line-heading">
                      <div>
                        <h2>{p?.title || "สินค้าหยุดขายแล้ว"}</h2>
                        {p && (
                          <p className="muted">
                            {p.platform} · {p.region}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-button danger"
                        disabled={busy}
                        onClick={() => remove(i.product_id)}
                      >
                        นำออก
                      </button>
                    </div>
                    {p && (
                      <>
                        <div className="line-quantity">
                          <label>
                            จำนวน
                            <select
                              disabled={busy}
                              value={i.quantity}
                              onChange={(e) =>
                                update(
                                  i.product_id,
                                  Number(e.target.value),
                                  i.account_fields,
                                )
                              }
                            >
                              {Array.from({ length: 10 }, (_, n) => (
                                <option key={n + 1}>{n + 1}</option>
                              ))}
                            </select>
                          </label>
                          <strong>
                            {formatPrice(p.price * i.quantity, p.currency)}
                          </strong>
                        </div>
                        {(p.stock ?? 0) < i.quantity && (
                          <p className="form-error">
                            สินค้าคงเหลือ {p.stock ?? 0} ชิ้น กรุณาปรับจำนวน
                          </p>
                        )}
                        {!!p.fields?.length && (
                          <div className="shop-form">
                            {p.fields.map((f) => (
                              <label key={f.id}>
                                {f.label}
                                <input
                                  disabled={busy}
                                  required
                                  maxLength={150}
                                  value={i.account_fields[f.id] || ""}
                                  placeholder={f.placeholder}
                                  onChange={(e) =>
                                    update(i.product_id, i.quantity, {
                                      ...i.account_fields,
                                      [f.id]: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
            <aside className="shop-panel checkout-summary">
              <h2>สรุปคำสั่งซื้อ</h2>
              <div className="summary-row">
                <span>จำนวนสินค้า</span>
                <span>{cart.reduce((n, i) => n + i.quantity, 0)} ชิ้น</span>
              </div>
              <div className="summary-row total">
                <span>ยอดรวม</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <p className="info-note">
                ขั้นตอนถัดไปเป็นชำระเงินจำลอง ไม่มีการหักเงินจริง และไม่มีการส่ง
                Key หรือเติมเกมจริง
              </p>
              <label className="checkbox-label">
                <input type="checkbox" required />
                ฉันตรวจสอบแพลตฟอร์ม ภูมิภาค และข้อมูลบัญชีเกมแล้ว
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              {authError && (
                <p role="alert" className="form-error">
                  {authError} กรุณาโหลดหน้าใหม่ก่อนสร้างคำสั่งซื้อ
                </p>
              )}
              <button
                className="button"
                disabled={
                  busy || authLoading || Boolean(authError) || unavailable
                }
              >
                {busy
                  ? "กำลังสร้างคำสั่งซื้อ…"
                  : user
                    ? "สร้างคำสั่งซื้อ"
                    : "เข้าสู่ระบบเพื่อสั่งซื้อ"}
              </button>
              <button
                className="text-button"
                type="button"
                disabled={busy}
                onClick={reload}
              >
                โหลดราคาและสต็อกใหม่
              </button>
            </aside>
          </form>
        )}
      </main>
    </>
  );
}
