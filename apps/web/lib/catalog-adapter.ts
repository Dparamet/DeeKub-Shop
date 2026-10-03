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
  account_fields?: Product["fields"];
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
    : kind === "topup" ? "valorant" : "hades";

  return {
    id: product.id,
    slug: product.slug,
    kind,
    game: product.game_title,
    title: product.name,
    description: product.description,
    price: product.price_minor / 100,
    currency: product.currency,
    platform: product.platform,
    region: product.region,
    delivery: kind === "topup" ? "เติมตามขั้นตอนและตรวจสอบข้อมูลบัญชีเกม" : "Key จะแสดงเมื่อระบบสั่งซื้อพร้อมใช้งาน",
    artwork,
    badge: kind === "topup" ? "เติมเกม" : "Game Key",
    fields: product.account_fields ?? [],
  };
}
