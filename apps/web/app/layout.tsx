import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "deeKub — ร้านเติมเกมและ Game Key",
  description: "ต้นแบบร้าน Digital Product สำหรับเติมเกมและ Game Key",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
