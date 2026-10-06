"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop-header";
import {
  requestJSON,
  dateLabel,
  orderStatus,
  type Order,
} from "@/lib/shop-client";
import { formatPrice } from "@/data/catalog";

export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void requestJSON<Order>(`/api/shop/orders/${id}`, {
      signal: controller.signal,
    })
      .then((d) => {
        if (!controller.signal.aborted) setOrder(d);
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, attempt]);
  async function transition(action: "mock-payment" | "cancel") {
    setBusy(true);
    setError("");
    try {
      await requestJSON(`/api/shop/orders/${id}/${action}`, {
        method: "POST",
        body: "{}",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setAttempt((i) => i + 1);
    }
  }
  return (
    <>
      <ShopHeader />
      <main className="shop-container account-container" id="main-content">
        <Link className="back-link" href="/account">
          กลับประวัติคำสั่งซื้อ
        </Link>
        {loading ? (
          <p className="empty-state" role="status">
            กำลังโหลดคำสั่งซื้อ…
          </p>
        ) : (
          <>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {order ? (
              <>
                <div className="page-heading">
                  <div>
                    <h1>คำสั่งซื้อ #{order.id.slice(0, 8).toUpperCase()}</h1>
                    <p className="muted">{dateLabel(order.created_at)}</p>
                  </div>
                  <span
                    className={`order-status status-${order.status.toLowerCase()}`}
                  >
                    {orderStatus[order.status]}
                  </span>
                </div>
                <div className="shop-panel">
                  <h2>รายการสินค้า</h2>
                  {order.items.map((i) => (
                    <div className="order-item" key={i.id}>
                      <div className="line-heading">
                        <strong>
                          {i.name} × {i.quantity}
                        </strong>
                        <strong>
                          {formatPrice(
                            (i.unit_price_minor * i.quantity) / 100,
                            order.currency,
                          )}
                        </strong>
                      </div>
                      <p className="muted">
                        {i.platform} · {i.region}
                      </p>
                      {Object.entries(i.account_fields).map(([k, v]) => (
                        <p key={k}>
                          {k}: {v}
                        </p>
                      ))}
                      {i.delivery_note && (
                        <>
                          <p className="small muted">
                            ผลการส่งมอบจำลอง (ใช้จริงไม่ได้)
                          </p>
                          <p className="delivery-note">{i.delivery_note}</p>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="summary-row total">
                    <span>ยอดรวม</span>
                    <strong>
                      {formatPrice(order.total_minor / 100, order.currency)}
                    </strong>
                  </div>
                </div>
                {order.status === "PENDING" && (
                  <section className="shop-panel payment-panel">
                    <h2>ชำระเงินจำลอง</h2>
                    <p>
                      ไม่มีการเรียกเก็บเงินจริง และไม่มีการเติมเกมหรือส่ง Key
                      จริง
                    </p>
                    <p className="muted">
                      ทำรายการก่อน {dateLabel(order.expires_at)}{" "}
                      หากหมดเวลาระบบจะยกเลิกและคืนสต็อก
                    </p>
                    <div className="button-row">
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() => void transition("mock-payment")}
                      >
                        {busy ? "กำลังดำเนินการ…" : "ยืนยันชำระเงินจำลอง"}
                      </button>
                      <button
                        className="button button-secondary"
                        disabled={busy}
                        onClick={() => void transition("cancel")}
                      >
                        ยกเลิกคำสั่งซื้อ
                      </button>
                    </div>
                  </section>
                )}
                <section className="shop-panel">
                  <h2>สถานะคำสั่งซื้อ</h2>
                  {order.events.map((e, i) => (
                    <p key={i}>
                      {dateLabel(e.created_at)} ·{" "}
                      {orderStatus[e.status as keyof typeof orderStatus] ||
                        e.status}
                    </p>
                  ))}
                </section>
              </>
            ) : (
              <div className="empty-state">
                <button
                  className="button"
                  onClick={() => {
                    setError("");
                    setLoading(true);
                    setAttempt((i) => i + 1);
                  }}
                >
                  ลองใหม่
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
