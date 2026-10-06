"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShopHeader } from "@/components/shop-header";
import { useShop } from "@/components/shop-provider";
import {
  requestJSON,
  dateLabel,
  orderStatus,
  type Order,
} from "@/lib/shop-client";
import { formatPrice } from "@/data/catalog";

export function OrderList({ admin = false }: { admin?: boolean }) {
  const { user, logout } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const search = query.trim().toLocaleLowerCase();
  const visible = orders.filter(
    (order) =>
      (!status || order.status === status) &&
      [
        order.id,
        order.buyer_email || "",
        ...(admin ? [order.user_id] : []),
        ...order.items.map((item) => item.name),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search),
  );
  useEffect(() => {
    const controller = new AbortController();
    void requestJSON<{ items: Order[] }>(
      admin ? "/api/shop/admin/orders" : "/api/shop/orders",
      { signal: controller.signal },
    )
      .then((d) => {
        if (!controller.signal.aborted) setOrders(d.items);
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [admin, attempt]);
  const content = (
    <>
      <div className="page-heading">
        <div>
          <h1>{admin ? "คำสั่งซื้อทั้งหมด" : "บัญชีของฉัน"}</h1>
          {!admin && <p className="muted">{user?.email}</p>}
        </div>
        {!admin && (
          <button
            className="button button-secondary"
            onClick={() =>
              void logout().catch((e: Error) => setError(e.message))
            }
          >
            ออกจากระบบ
          </button>
        )}
      </div>
      <div className="order-controls shop-form">
        <label>
          {admin
            ? "ค้นหาเลขคำสั่งซื้อ สินค้า หรืออีเมลผู้ซื้อ"
            : "ค้นหาเลขคำสั่งซื้อหรือสินค้า"}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          สถานะ
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">ทั้งหมด</option>
            {Object.entries(orderStatus).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="page-heading">
        <h2>
          {admin ? "100 รายการล่าสุด" : "ประวัติคำสั่งซื้อ (100 รายการล่าสุด)"}
        </h2>
        <button
          className="text-button"
          disabled={loading}
          onClick={() => {
            setError("");
            setLoading(true);
            setAttempt((i) => i + 1);
          }}
        >
          โหลดใหม่
        </button>
      </div>
      {loading ? (
        <p className="empty-state" role="status">
          กำลังโหลดคำสั่งซื้อ…
        </p>
      ) : error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : !orders.length ? (
        <div className="empty-state">
          <h2>ยังไม่มีคำสั่งซื้อ</h2>
          {!admin && (
            <Link className="button" href="/">
              เลือกสินค้า
            </Link>
          )}
        </div>
      ) : !visible.length ? (
        <div className="empty-state">
          <h2>ไม่พบคำสั่งซื้อตามตัวกรอง</h2>
          <button
            className="button button-secondary"
            onClick={() => {
              setQuery("");
              setStatus("");
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="order-list">
          <p className="muted small" role="status">
            {visible.length} จาก {orders.length} รายการที่โหลด
          </p>
          {visible.map((o) => (
            <article className="shop-panel" key={o.id}>
              <div className="line-heading">
                <div>
                  <h3>#{o.id.slice(0, 8).toUpperCase()}</h3>
                  <p className="muted">{dateLabel(o.created_at)}</p>
                </div>
                <span
                  className={`order-status status-${o.status.toLowerCase()}`}
                >
                  {orderStatus[o.status]}
                </span>
              </div>
              <p>
                {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
              </p>
              {admin && (
                <p className="muted small">
                  ผู้ซื้อ: {o.buyer_email || o.user_id}
                </p>
              )}
              <div className="line-heading">
                <strong>{formatPrice(o.total_minor / 100, o.currency)}</strong>
                {!admin && (
                  <Link
                    className="button button-secondary"
                    href={`/account/orders/${o.id}`}
                  >
                    ดูคำสั่งซื้อ
                  </Link>
                )}
              </div>
              {admin && (
                <details>
                  <summary>ข้อมูลการสั่งซื้อ</summary>
                  {o.items.map((i) => (
                    <div key={i.id}>
                      <p>
                        {i.name} · {i.platform} · {i.region}
                      </p>
                      {Object.entries(i.account_fields).map(([k, v]) => (
                        <p className="muted" key={k}>
                          {k}: {v}
                        </p>
                      ))}
                      {i.delivery_note && (
                        <p className="delivery-note">{i.delivery_note}</p>
                      )}
                    </div>
                  ))}
                </details>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
  return admin ? (
    content
  ) : (
    <>
      <ShopHeader />
      <main className="shop-container account-container" id="main-content">
        {content}
      </main>
    </>
  );
}
