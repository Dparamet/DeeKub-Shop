import type { ArtworkStyle, Product } from "@/data/catalog";

export type ApiCatalogProduct = {
  id: string;
  slug: string;
  game_title: string;
  name: string;
  type: "TOPUP" | "GAME_KEY";
  description: string;
  price_minor: number;
  currency: string;
  platform: string;
  region: string;
  artwork: string;
  image_url?: string;
  source_url?: string;
  activation_guide?: string;
  account_fields?: Product["fields"];
  stock_quantity: number;
  is_published?: boolean;
};

const artworkStyles = new Set<ArtworkStyle>([
  "valorant",
  "arena",
  "genshin",
  "hades",
  "stardew",
  "cyberpunk",
]);

export function toStorefrontProduct(product: ApiCatalogProduct): Product {
  const kind = product.type === "TOPUP" ? "topup" : "key";
  const artwork = artworkStyles.has(product.artwork as ArtworkStyle)
    ? (product.artwork as ArtworkStyle)
    : kind === "topup"
      ? "valorant"
      : "hades";

  return {
    id: product.id,
    slug: product.slug,
    kind,
    game: product.game_title,
    title: product.name,
    description: product.description,
    price: product.price_minor / 100,
    stock: product.stock_quantity,
    currency: product.currency,
    platform: product.platform,
    region: product.region,
    delivery:
      kind === "topup"
        ? "จำลองการเติมเกมหลังยืนยันคำสั่งซื้อ"
        : "แสดง Key ตัวอย่างหลังชำระเงินจำลอง (ใช้จริงไม่ได้)",
    artwork,
    imageUrl: product.image_url,
    sourceUrl: product.source_url,
    activationGuide: product.activation_guide,
    badge:
      kind === "topup"
        ? "เติมเกม"
        : product.platform === "Roblox"
          ? "Gift Card"
          : "Game Key",
    fields: product.account_fields ?? [],
  };
}
