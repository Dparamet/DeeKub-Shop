import { ArrowUpRight, Gamepad2, Zap } from "lucide-react";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/data/catalog";
import { GameArt } from "@/components/game-art";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (product: Product) => void }) {
  const isTopup = product.kind === "topup";

  return (
    <article className="product-card">
      <button className="product-visual-button" onClick={() => onOpen(product)} aria-label={`ดูรายละเอียด ${product.title}`}>
        <GameArt style={product.artwork} />
        <span className={`product-badge${product.badge === "Game Key" ? " product-badge-key" : ""}`}>
          {isTopup ? <Zap size={13} aria-hidden="true" /> : <Gamepad2 size={14} aria-hidden="true" />}
          {product.badge ?? (isTopup ? "เติมเกม" : "Game Key")}
        </span>
        <span className="visual-open" aria-hidden="true"><ArrowUpRight size={15} /></span>
      </button>
      <div className="product-card-body">
        <div className="product-game-label">{product.game}</div>
        <h3>{product.title}</h3>
        <p>{product.description}</p>
        <div className="product-card-footer">
          <div>
            <span className="price-caption">ราคาเดโม</span>
            <strong>{formatPrice(product.price)}</strong>
          </div>
          <button className="icon-button product-open" onClick={() => onOpen(product)} aria-label={`เลือก ${product.title}`}>
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
