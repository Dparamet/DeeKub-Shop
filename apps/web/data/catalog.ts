export type ProductKind = "topup" | "key";
export type ArtworkStyle = "valorant" | "arena" | "genshin" | "hades" | "stardew" | "cyberpunk";

export type ProductField = {
  id: string;
  label: string;
  placeholder: string;
};

export type Product = {
  id: string;
  kind: ProductKind;
  game: string;
  title: string;
  description: string;
  price: number;
  platform: string;
  region: string;
  delivery: string;
  artwork: ArtworkStyle;
  badge?: string;
  fields?: ProductField[];
};

export const products: Product[] = [
  {
    id: "valorant-475",
    kind: "topup",
    game: "VALORANT",
    title: "475 VP",
    description: "คะแนน VP สำหรับบัญชี Riot Games",
    price: 159,
    platform: "Riot Games",
    region: "Asia Pacific",
    delivery: "เติมเข้าบัญชีหลังตรวจสอบคำสั่งซื้อ",
    artwork: "valorant",
    badge: "เติมเกม",
    fields: [
      { id: "riot-id", label: "Riot ID", placeholder: "ชื่อในเกม" },
      { id: "riot-tag", label: "Tag", placeholder: "เช่น TH1" },
    ],
  },
  {
    id: "rov-240",
    kind: "topup",
    game: "ROV",
    title: "240 Vouchers",
    description: "แพ็กเกจเติมเกมสำหรับ Garena RoV",
    price: 109,
    platform: "Garena",
    region: "Thailand",
    delivery: "เติมเข้าบัญชีหลังตรวจสอบคำสั่งซื้อ",
    artwork: "arena",
    fields: [
      { id: "player-id", label: "Player ID", placeholder: "กรอก UID ผู้เล่น" },
      { id: "server", label: "Server", placeholder: "กรอก Server ID" },
    ],
  },
  {
    id: "genshin-welkin",
    kind: "topup",
    game: "GENSHIN IMPACT",
    title: "Blessing of the Welkin Moon",
    description: "แพ็กเกจตัวอย่างสำหรับบัญชี HoYoverse",
    price: 149,
    platform: "HoYoverse",
    region: "เลือก Server ในฟอร์ม",
    delivery: "เติมเข้าบัญชีหลังตรวจสอบคำสั่งซื้อ",
    artwork: "genshin",
    fields: [
      { id: "uid", label: "UID", placeholder: "กรอก UID ผู้เล่น" },
      { id: "server", label: "Server / Region", placeholder: "เช่น Asia" },
    ],
  },
  {
    id: "hades-ii-key",
    kind: "key",
    game: "HADES II",
    title: "Hades II",
    description: "ตัวอย่างสินค้า Game Key สำหรับ Steam",
    price: 690,
    platform: "Steam",
    region: "Global",
    delivery: "แสดง Key หลังชำระเงินสำเร็จ",
    artwork: "hades",
    badge: "Game Key",
  },
  {
    id: "stardew-key",
    kind: "key",
    game: "STARDEW VALLEY",
    title: "Stardew Valley",
    description: "ตัวอย่างสินค้า Game Key สำหรับ Steam",
    price: 315,
    platform: "Steam",
    region: "Global",
    delivery: "แสดง Key หลังชำระเงินสำเร็จ",
    artwork: "stardew",
  },
  {
    id: "cyberpunk-key",
    kind: "key",
    game: "CYBERPUNK 2077",
    title: "Cyberpunk 2077",
    description: "ตัวอย่างสินค้า Game Key สำหรับ Steam",
    price: 1_290,
    platform: "Steam",
    region: "Global",
    delivery: "แสดง Key หลังชำระเงินสำเร็จ",
    artwork: "cyberpunk",
  },
];

export function formatPrice(value: number) {
  return `฿${new Intl.NumberFormat("th-TH").format(value)}`;
}
