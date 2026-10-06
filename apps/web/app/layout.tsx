import type { Metadata } from "next";
import "./globals.css";
import "./shop.css";
import { ShopProvider } from "@/components/shop-provider";
import { themeScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "deeKub | ร้านเติมเกมและ Game Key",
  description:
    "ร้าน Game Key และเติมเกม พร้อมบัญชีสมาชิกและประวัติคำสั่งซื้อ โหมดชำระเงินจำลอง",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ShopProvider>{children}</ShopProvider>
      </body>
    </html>
  );
}
