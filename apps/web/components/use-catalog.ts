"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/data/catalog";
import { requestJSON } from "@/lib/shop-client";

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void requestJSON<{ items: Product[] }>("/api/catalog", {
      signal: controller.signal,
    })
      .then((body) => {
        if (!controller.signal.aborted) setProducts(body.items);
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  function reload() {
    setError("");
    setLoading(true);
    setAttempt((i) => i + 1);
  }
  return { products, loading, error, reload };
}
