"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductArt } from "@/components/product-art";
import { useShop } from "@/components/shop-provider";
import { formatPrice, type Product } from "@/data/catalog";

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const { saved, toggleSaved } = useShop();
  return (
    <article className="shop-product">
      <div className="shop-product-art">
        <Link
          href={`/products/${product.slug}`}
          aria-label={`ดู ${product.title}`}
        >
          <ProductArt product={product} eager={eager} />
        </Link>
        <span className="shop-type">{product.badge}</span>
        <button
          className="save-button"
          aria-label={`บันทึก ${product.title}`}
          aria-pressed={saved.includes(product.id)}
          onClick={() => toggleSaved(product.id)}
        >
          <Heart
            size={19}
            fill={saved.includes(product.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="shop-product-body">
        <p className="eyebrow">{product.game}</p>
        <h3>
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>
        <p className="muted">
          {product.platform} · {product.region}
        </p>
        <div className="shop-product-bottom">
          <strong>{formatPrice(product.price, product.currency)}</strong>
          <span className={(product.stock ?? 0) > 0 ? "in-stock" : "muted"}>
            {(product.stock ?? 0) > 0 ? "พร้อมสั่งซื้อ" : "หมดชั่วคราว"}
          </span>
        </div>
        <Link
          className="button button-secondary"
          href={`/products/${product.slug}`}
        >
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  );
}
