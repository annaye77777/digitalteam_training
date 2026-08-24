import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "外訓時間軸比對系統",
  description: "登記外訓課程時間地點，並與 Sprint 時間軸疊圖比對",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen text-slate-800 antialiased">{children}</body>
    </html>
  );
}
