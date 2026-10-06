import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./css/globals.css";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "BrewLite — Cà phê nhanh · Thanh toán số",
  description: "Ứng dụng đặt cà phê không dùng tiền mặt dành cho sinh viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={manrope.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}