"use client";

import Image from "next/image";
import { useState } from "react";
import { GameArt } from "@/components/game-art";
import type { Product } from "@/data/catalog";
import { productURL } from "@/lib/product-media";

export function ProductArt({
  product,
  detail = false,
  eager = false,
}: {
  product: Product;
  detail?: boolean;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState("");
  const image = productURL(product.imageUrl, true);
  const icon = image?.startsWith("https://play-lh.googleusercontent.com/");
  const steam = image?.includes(
    ".steamstatic.com/store_item_assets/steam/apps/",
  );
  return (
    <div className={`product-image${icon ? " product-image-icon" : ""}`}>
      {image && failed !== image ? (
        <Image
          src={image}
          alt={`ภาพเกม ${product.game}`}
          fill
          unoptimized
          loading={detail || eager ? "eager" : "lazy"}
          sizes={
            detail
              ? "(max-width: 560px) 100vw, 50vw"
              : "(max-width: 850px) 50vw, 25vw"
          }
          className={
            icon
              ? "game-cover game-cover-icon"
              : steam
                ? "game-cover game-cover-banner"
                : "game-cover"
          }
          referrerPolicy="no-referrer"
          onError={() => setFailed(image)}
        />
      ) : (
        <>
          <GameArt style={product.artwork} label={product.game} />
          {image && (
            <span className="image-fallback-note">โหลดภาพเกมไม่ได้</span>
          )}
        </>
      )}
    </div>
  );
}
