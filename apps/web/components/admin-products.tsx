"use client";
import { useEffect, useState, type FormEvent } from "react";
import { requestJSON } from "@/lib/shop-client";
import { formatPrice, type ProductField } from "@/data/catalog";
import type { ApiCatalogProduct } from "@/lib/catalog-adapter";

type AdminProduct = ApiCatalogProduct & {
  is_published: boolean;
  updated_at: string;
};
type Draft = Omit<AdminProduct, "id" | "updated_at" | "currency">;
const empty: Draft = {
  slug: "",
  game_title: "",
  name: "",
  type: "GAME_KEY",
  description: "",
  price_minor: 100,
  platform: "Steam",
  region: "Global",
  artwork: "hades",
  image_url: "",
  source_url: "",
  activation_guide: "",
  stock_quantity: 0,
  is_published: false,
  account_fields: [],
};

function Editor({
  product,
  saved,
  close,
}: {
  product: AdminProduct | null;
  saved: () => void;
  close: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(product || empty);
  const [price, setPrice] = useState(
    String((product?.price_minor || 100) / 100),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function field(key: keyof Draft, value: unknown) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function accountField(index: number, key: keyof ProductField, value: string) {
    field(
      "account_fields",
      draft.account_fields?.map((f, i) =>
        i === index ? { ...f, [key]: value } : f,
      ),
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestJSON(
        product
          ? `/api/shop/admin/products/${product.id}`
          : "/api/shop/admin/products",
        {
          method: product ? "PUT" : "POST",
          body: JSON.stringify({
            ...draft,
            price_minor: Math.round(Number(price) * 100),
            version: product?.updated_at,
          }),
        },
      );
      saved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="shop-panel editor-panel">
      <div className="page-heading">
        <h2>{product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
        <button className="text-button" disabled={busy} onClick={close}>
          ปิดฟอร์ม
        </button>
      </div>
      <form className="shop-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          <div className="form-grid">
            <label>
              ชื่อเกม
              <input
                required
                maxLength={150}
                value={draft.game_title}
                onChange={(e) => field("game_title", e.target.value)}
              />
            </label>
            <label>
              ชื่อสินค้า / แพ็กเกจ
              <input
                required
                maxLength={200}
                value={draft.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label>
              slug (ลิงก์สินค้า)
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={100}
                placeholder="game-name-key"
                value={draft.slug}
                onChange={(e) => field("slug", e.target.value)}
              />
            </label>
            <label>
              ประเภท
              <select
                value={draft.type}
                onChange={(e) => {
                  field("type", e.target.value);
                  field(
                    "account_fields",
                    e.target.value === "TOPUP"
                      ? [
                          {
                            id: "uid",
                            label: "UID",
                            placeholder: "กรอก UID ผู้เล่น",
                          },
                        ]
                      : [],
                  );
                }}
              >
                <option value="GAME_KEY">Game Key</option>
                <option value="TOPUP">เติมเกม</option>
              </select>
            </label>
            <label>
              ราคา (บาท)
              <input
                required
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label>
              สต็อกที่พร้อมขาย
              <input
                required
                type="number"
                min="0"
                max="1000000"
                step="1"
                value={draft.stock_quantity}
                onChange={(e) =>
                  field("stock_quantity", Number(e.target.value))
                }
              />
            </label>
            <label>
              แพลตฟอร์ม
              <input
                required
                maxLength={100}
                value={draft.platform}
                onChange={(e) => field("platform", e.target.value)}
              />
            </label>
            <label>
              ภูมิภาค
              <input
                required
                maxLength={100}
                value={draft.region}
                onChange={(e) => field("region", e.target.value)}
              />
            </label>
            <label>
              ภาพสำรองเมื่อไม่มีภาพเกม
              <select
                value={draft.artwork}
                onChange={(e) => field("artwork", e.target.value)}
              >
                {[
                  "valorant",
                  "arena",
                  "genshin",
                  "hades",
                  "stardew",
                  "cyberpunk",
                ].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label>
              URL ภาพเกม (HTTPS)
              <input
                type="url"
                maxLength={1500}
                value={draft.image_url || ""}
                onChange={(e) => field("image_url", e.target.value)}
                placeholder="https://shared.akamai.steamstatic.com/..."
              />
            </label>
            <label>
              เว็บไซต์ข้อมูลเกมทางการ (HTTPS)
              <input
                type="url"
                maxLength={1500}
                value={draft.source_url || ""}
                onChange={(e) => field("source_url", e.target.value)}
                placeholder="https://store.steampowered.com/app/..."
              />
            </label>
          </div>
          <p className="muted small">
            รองรับภาพจาก Steam, Google Play, Roblox, Riot และ PUBG MOBILE
            และลิงก์ข้อมูลจากร้าน/เว็บไซต์เกมทางการ เว้นว่างเพื่อใช้ภาพสำรอง
          </p>
          <label>
            รายละเอียด
            <textarea
              rows={3}
              maxLength={4000}
              value={draft.description}
              onChange={(e) => field("description", e.target.value)}
            />
          </label>
          {draft.type === "TOPUP" && (
            <div>
              <h3>ช่องข้อมูลบัญชีเกม</h3>
              <p className="muted small">
                เก็บเฉพาะ UID, ID หรือ Server ห้ามขอรหัสผ่านผู้เล่น
              </p>
              {draft.account_fields?.map((f, i) => (
                <div className="account-field-row" key={i}>
                  <label>
                    รหัสช่อง
                    <input
                      required
                      pattern="[a-z0-9-]{1,40}"
                      value={f.id}
                      onChange={(e) => accountField(i, "id", e.target.value)}
                    />
                  </label>
                  <label>
                    ชื่อช่อง
                    <input
                      required
                      maxLength={100}
                      value={f.label}
                      onChange={(e) => accountField(i, "label", e.target.value)}
                    />
                  </label>
                  <label>
                    ข้อความแนะนำ
                    <input
                      maxLength={150}
                      value={f.placeholder}
                      onChange={(e) =>
                        accountField(i, "placeholder", e.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() =>
                      field(
                        "account_fields",
                        draft.account_fields?.filter((_, n) => n !== i),
                      )
                    }
                  >
                    ลบช่อง
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button button-secondary"
                disabled={(draft.account_fields?.length || 0) >= 6}
                onClick={() =>
                  field("account_fields", [
                    ...(draft.account_fields || []),
                    { id: "", label: "", placeholder: "" },
                  ])
                }
              >
                เพิ่มช่อง (สูงสุด 6)
              </button>
            </div>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.is_published}
              onChange={(e) => field("is_published", e.target.checked)}
            />
            เผยแพร่บนหน้าร้าน
          </label>
          <label>
            วิธีใช้และข้อควรตรวจสอบ
            <textarea
              rows={3}
              maxLength={2000}
              value={draft.activation_guide || ""}
              onChange={(e) => field("activation_guide", e.target.value)}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button">
            {busy ? "กำลังบันทึก…" : "บันทึกสินค้า"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

export function AdminProducts() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void requestJSON<{ items: AdminProduct[] }>("/api/shop/admin/products", {
      signal: controller.signal,
    })
      .then((d) => {
        if (!controller.signal.aborted) setItems(d.items);
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  function reload() {
    setLoading(true);
    setError("");
    setAttempt((i) => i + 1);
  }
  const visible = items.filter((p) =>
    `${p.name} ${p.game_title} ${p.slug}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">จัดการหน้าร้าน</p>
          <h1>สินค้าและแพ็กเกจ</h1>
          <p className="muted">
            สินค้าในฐานข้อมูล สูงสุด 500 รายการ · สต็อกเป็นจำนวนที่ยังไม่ถูกจอง
          </p>
        </div>
        <button
          className="button"
          onClick={() => {
            setEditing(null);
            setNotice("");
          }}
        >
          เพิ่มสินค้า
        </button>
      </div>
      {notice && (
        <p className="form-success" role="status">
          {notice}
        </p>
      )}
      {editing !== undefined && (
        <Editor
          key={editing?.id || "new"}
          product={editing}
          close={() => setEditing(undefined)}
          saved={() => {
            setEditing(undefined);
            setNotice("บันทึกสินค้าแล้ว");
            reload();
          }}
        />
      )}
      <div className="admin-tools">
        <label className="shop-form">
          ค้นหาสินค้า
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          className="button button-secondary"
          disabled={loading}
          onClick={reload}
        >
          โหลดใหม่
        </button>
      </div>
      {loading ? (
        <p className="empty-state" role="status">
          กำลังโหลดสินค้า…
        </p>
      ) : error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : !visible.length ? (
        <div className="empty-state">
          <h2>ไม่พบสินค้า</h2>
          <p>เพิ่มสินค้าใหม่หรือเปลี่ยนคำค้นหา</p>
        </div>
      ) : (
        <div className="admin-product-list">
          {visible.map((p) => (
            <article className="shop-panel admin-product-row" key={p.id}>
              <div>
                <h3>{p.name}</h3>
                <p className="muted">
                  {p.game_title} · {p.platform} · {p.region}
                </p>
                <p className="muted small">/{p.slug}</p>
              </div>
              <strong>{formatPrice(p.price_minor / 100, p.currency)}</strong>
              <span>คงเหลือ {p.stock_quantity}</span>
              <span className={p.is_published ? "in-stock" : "muted"}>
                {p.is_published ? "เผยแพร่" : "ฉบับร่าง"}
              </span>
              <button
                className="button button-secondary"
                onClick={() => {
                  setEditing(p);
                  setNotice("");
                  window.scrollTo({ top: 0 });
                }}
              >
                แก้ไข
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
