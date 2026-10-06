export type ProductKind = "topup" | "key";
export type ArtworkStyle =
  "valorant" | "arena" | "genshin" | "hades" | "stardew" | "cyberpunk";
export type ProductField = { id: string; label: string; placeholder: string };
export type Product = {
  id: string;
  slug: string;
  kind: ProductKind;
  game: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  currency: string;
  platform: string;
  region: string;
  delivery: string;
  artwork: ArtworkStyle;
  imageUrl?: string;
  sourceUrl?: string;
  activationGuide?: string;
  badge?: string;
  fields: ProductField[];
};
export function formatPrice(value: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
