"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ShopUser } from "@/lib/api-server";
import { requestJSON } from "@/lib/shop-client";

export type CartLine = {
  product_id: string;
  quantity: number;
  account_fields: Record<string, string>;
};
type ShopContext = {
  cart: CartLine[];
  saved: string[];
  hydrated: boolean;
  user: ShopUser | null;
  authLoading: boolean;
  authError: string;
  add: (line: CartLine) => void;
  update: (
    id: string,
    quantity: number,
    fields: Record<string, string>,
  ) => void;
  remove: (id: string) => void;
  clear: () => void;
  toggleSaved: (id: string) => void;
  logout: () => Promise<void>;
};
const Context = createContext<ShopContext | null>(null);
const cartKey = "deekub.cart.v1";
const savedKey = "deekub.saved.v1";
const productID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function storedList(key: string): unknown[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as CartLine;
  return (
    typeof line.product_id === "string" &&
    productID.test(line.product_id) &&
    Number.isInteger(line.quantity) &&
    line.quantity >= 1 &&
    line.quantity <= 10 &&
    Boolean(line.account_fields) &&
    typeof line.account_fields === "object" &&
    !Array.isArray(line.account_fields) &&
    Object.keys(line.account_fields).length <= 6 &&
    Object.values(line.account_fields).every(
      (v) => typeof v === "string" && v.length <= 150,
    )
  );
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<ShopUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const seen = new Set<string>();
    setCart(
      storedList(cartKey)
        .filter(isCartLine)
        .filter((line) => {
          if (seen.has(line.product_id)) return false;
          seen.add(line.product_id);
          return true;
        })
        .slice(0, 20),
    );
    setSaved(
      [
        ...new Set(
          storedList(savedKey).filter(
            (id): id is string => typeof id === "string" && productID.test(id),
          ),
        ),
      ].slice(0, 500),
    );
    setHydrated(true);
    const controller = new AbortController();
    void fetch("/api/shop/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) setUser(await response.json());
        else if (response.status !== 401)
          setAuthError("ระบบบัญชียังไม่พร้อม กรุณาตรวจการเชื่อมต่อ");
      })
      .catch(() => {
        if (!controller.signal.aborted) setAuthError("เชื่อมระบบบัญชีไม่ได้");
      })
      .finally(() => {
        if (!controller.signal.aborted) setAuthLoading(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      localStorage.setItem(savedKey, JSON.stringify(saved));
    } catch {
      /* Optional persistence. */
    }
  }, [cart, saved, hydrated]);

  const value: ShopContext = {
    cart,
    saved,
    hydrated,
    user,
    authLoading,
    authError,
    add(line) {
      setCart((items) => {
        const exists = items.some((i) => i.product_id === line.product_id);
        if (exists)
          return items.map((i) =>
            i.product_id === line.product_id
              ? { ...line, quantity: Math.min(10, i.quantity + line.quantity) }
              : i,
          );
        return [...items, line].slice(0, 20);
      });
    },
    update(id, quantity, fields) {
      setCart((items) =>
        items.map((i) =>
          i.product_id === id
            ? { product_id: id, quantity, account_fields: fields }
            : i,
        ),
      );
    },
    remove(id) {
      setCart((items) => items.filter((i) => i.product_id !== id));
    },
    clear() {
      setCart([]);
    },
    toggleSaved(id) {
      setSaved((items) =>
        items.includes(id)
          ? items.filter((i) => i !== id)
          : [...items, id].slice(0, 500),
      );
    },
    async logout() {
      await requestJSON("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "logout" }),
      });
      setUser(null);
      window.location.assign("/");
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useShop() {
  const context = useContext(Context);
  if (!context) throw new Error("ShopProvider required");
  return context;
}
