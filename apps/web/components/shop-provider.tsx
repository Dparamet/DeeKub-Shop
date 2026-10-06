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

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<ShopUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const favorites = JSON.parse(localStorage.getItem(savedKey) || "[]");
      if (Array.isArray(stored))
        setCart(
          stored
            .filter(
              (i) =>
                i &&
                typeof i.product_id === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity >= 1 &&
                i.quantity <= 10 &&
                i.account_fields &&
                typeof i.account_fields === "object" &&
                Object.values(i.account_fields).every(
                  (v) => typeof v === "string",
                ),
            )
            .slice(0, 20),
        );
      if (Array.isArray(favorites))
        setSaved(favorites.filter((i) => typeof i === "string").slice(0, 500));
    } catch {
      /* Storage can be unavailable; shopping still works in this tab. */
    }
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
        items.includes(id) ? items.filter((i) => i !== id) : [...items, id],
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
